import { Kind, buildSchema, GraphQLError, type SelectionSetNode, type ValidationRule } from 'graphql'
import type { User } from '#contracts'

/**
 * Read-only analytics graph. Aggregations live behind GraphQL so the
 * dashboard can fetch exactly the fields each widget needs in one round trip.
 */
export const schema = buildSchema(/* GraphQL */ `
  type CashflowPoint {
    month: String!
    inflow: Float!
    outflow: Float!
  }

  type LoanStatusCount {
    status: String!
    count: Int!
  }

  type Portfolio {
    "Sum of all deposit balances in USD minor units (KHR converted at the indicative rate)"
    totalBalanceUsd: Float!
    totalOutstandingUsd: Float!
    activeLoans: Int!
    pendingApplications: Int!
    cashflow(months: Int = 6): [CashflowPoint!]!
    loanStatusBreakdown: [LoanStatusCount!]!
  }

  type CreditScorePoint {
    month: String!
    score: Int!
  }

  type CreditFactor {
    label: String!
    impact: String!
    detail: String!
  }

  type CreditScore {
    current: Int!
    band: String!
    updatedAt: String!
    history: [CreditScorePoint!]!
    factors: [CreditFactor!]!
  }

  type Query {
    portfolio: Portfolio!
    creditScore: CreditScore!
  }
`)

export interface GraphQLContext {
  user: User
}

export const rootValue = {
  portfolio: (_args: unknown, context: GraphQLContext) => getPortfolio(context.user.id),
  creditScore: (_args: unknown, context: GraphQLContext) => {
    const score = getCreditScore(context.user.id)
    if (!score) throw new GraphQLError('No credit report on file')
    return score
  },
}

function selectionDepth(selectionSet: SelectionSetNode | undefined, depth: number): number {
  if (!selectionSet) return depth
  return Math.max(
    depth,
    ...selectionSet.selections.map((selection) =>
      selection.kind === Kind.FRAGMENT_SPREAD ? depth + 1 : selectionDepth(selection.selectionSet, depth + 1),
    ),
  )
}

/** Rejects deeply nested queries (DoS protection). */
export function depthLimitRule(maxDepth: number): ValidationRule {
  return (context) => ({
    OperationDefinition(node) {
      const depth = selectionDepth(node.selectionSet, 0)
      if (depth > maxDepth) {
        context.reportError(
          new GraphQLError(`Query depth ${depth} exceeds the maximum of ${maxDepth}.`, { nodes: [node] }),
        )
      }
    },
  })
}
