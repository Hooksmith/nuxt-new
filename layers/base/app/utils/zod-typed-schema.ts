import type { TypedSchema, TypedSchemaError } from 'vee-validate'
import type { z } from 'zod'

/**
 * Adapts a Zod 4 schema to vee-validate's TypedSchema contract
 * (the equivalent of `zodResolver` in React Hook Form).
 */
export function zodTypedSchema<TSchema extends z.ZodType>(
  schema: TSchema,
): TypedSchema<z.input<TSchema>, z.output<TSchema>> {
  return {
    __type: 'VVTypedSchema',
    async parse(values) {
      const result = await schema.safeParseAsync(values)
      if (result.success) return { value: result.data, errors: [] }

      const grouped = new Map<string, string[]>()
      for (const issue of result.error.issues) {
        const path = issue.path.map(String).join('.')
        grouped.set(path, [...(grouped.get(path) ?? []), issue.message])
      }
      const errors: TypedSchemaError[] = [...grouped].map(([path, messages]) => ({ path, errors: messages }))
      return { errors }
    },
  }
}
