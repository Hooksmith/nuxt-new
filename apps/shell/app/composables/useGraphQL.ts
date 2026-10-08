interface GraphQLResponse<T> {
  data?: T
  errors?: { message: string }[]
}

/** Minimal typed GraphQL client on top of the shared API client (queries use GET). */
export function useGraphQL() {
  const api = useApi()
  return async function request<T>(
    query: string,
    variables?: Record<string, unknown>,
    signal?: AbortSignal,
  ): Promise<T> {
    const response = await api<GraphQLResponse<T>>('/graphql', {
      query: { query, variables: variables ? JSON.stringify(variables) : undefined },
      signal,
    })
    if (response.errors?.length || !response.data) {
      throw new Error(response.errors?.map((e) => e.message).join('; ') ?? 'Empty GraphQL response')
    }
    return response.data
  }
}
