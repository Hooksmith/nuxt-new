import { Kind, NoSchemaIntrospectionCustomRule, execute, parse, specifiedRules, validate } from 'graphql'
import type { DocumentNode, GraphQLError } from 'graphql'
import { z } from 'zod'
import { depthLimitRule, rootValue, schema } from '../graphql/schema'

const requestSchema = z.object({
  query: z.string().min(1).max(5_000),
  operationName: z.string().max(100).optional(),
  variables: z
    .union([
      z.record(z.string(), z.unknown()),
      z.string().transform((value) => JSON.parse(value) as Record<string, unknown>),
    ])
    .optional(),
})

const rules = import.meta.dev
  ? [...specifiedRules, depthLimitRule(6)]
  : [...specifiedRules, depthLimitRule(6), NoSchemaIntrospectionCustomRule]

/**
 * GraphQL over HTTP: GET for queries (cacheable, CSRF-safe), POST for everything.
 * Introspection is disabled in production.
 */
export default defineEventHandler(async (event) => {
  assertMethod(event, ['GET', 'POST'])
  const user = await requireUser(event)

  const input = event.method === 'GET' ? getQuery(event) : await readBody(event)
  const parsed = requestSchema.safeParse(input)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request', data: { code: 'INVALID_GRAPHQL_REQUEST' } })
  }
  const { query, variables, operationName } = parsed.data

  let document: DocumentNode
  try {
    document = parse(query)
  } catch (error) {
    setResponseStatus(event, 400)
    return { errors: [{ message: (error as GraphQLError).message }] }
  }

  if (
    event.method === 'GET' &&
    document.definitions.some((d) => d.kind === Kind.OPERATION_DEFINITION && d.operation !== 'query')
  ) {
    throw createError({ statusCode: 405, statusMessage: 'Mutations must use POST' })
  }

  const validationErrors = validate(schema, document, rules)
  if (validationErrors.length > 0) {
    setResponseStatus(event, 400)
    return { errors: validationErrors.map((e) => ({ message: e.message })) }
  }

  const result = await execute({
    schema,
    document,
    rootValue,
    contextValue: { user },
    variableValues: variables,
    operationName,
  })

  // Don't leak internal error details to the client in production.
  return {
    data: result.data,
    errors: result.errors?.map((e) => ({
      message: import.meta.dev || !e.originalError ? e.message : 'Internal error',
      path: e.path,
    })),
  }
})
