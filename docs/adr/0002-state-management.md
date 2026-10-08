# ADR 0002 — State management: TanStack Query for server state, Pinia for client state

- **Status:** Accepted
- **Date:** 2026-10-08

## Context

Banking screens are dominated by **server state** (balances, transactions, loans) that must stay fresh,
be shared between widgets, update in real time and survive SSR. There is a smaller amount of **client
state** (session profile, privacy toggle, wizard drafts) and a lot of **form state**.

Putting everything in one global store (the classic Redux/Vuex approach) means hand-writing caching,
deduplication, invalidation and loading flags for every endpoint.

## Decision

| Kind of state        | Tool                                       | Why                                                                                          |
| -------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------- |
| Server state         | **TanStack Query** (`@tanstack/vue-query`) | caching, dedupe, background refetch, `keepPreviousData`, optimistic updates, SSR dehydration |
| Client/UI state      | **Pinia** setup stores                     | small, typed, devtools, SSR-safe; equivalent of Zustand/Redux Toolkit                        |
| Form state           | **VeeValidate + Zod**                      | field-level state and errors; the same Zod schema validates on the BFF                       |
| Shareable view state | **URL query**                              | filters and pagination survive reloads and can be bookmarked                                 |

Rules:

- Query keys come only from `queryKeys` (`layers/base/app/utils/query-keys.ts`) so mutations and live events
  invalidate precisely.
- Real-time events **patch** the cache (`setQueriesData`) and mark aggregates stale, rather than refetching everything.
- Server data is never copied into Pinia.
- Nothing sensitive is persisted in the browser; the wizard draft drops national ID and date of birth.

## Consequences

- ✅ Far less custom code; consistent loading/error UX; SSR without double fetching.
- ✅ Clear ownership: a reviewer can tell where any piece of state belongs.
- ⚠️ Two libraries to learn; team conventions (key factory, `prefetchOnServer`) must be followed.
