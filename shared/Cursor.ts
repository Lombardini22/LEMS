interface PageInfo {
  totalCount: number
  startCursor: string | null
  endCursor: string | null
  hasPreviousPage: boolean
  hasNextPage: boolean
}

interface Edge<T> {
  cursor: string
  node: T
}

export interface Cursor<T> {
  pageInfo: PageInfo
  edges: Edge<T>[]
}

export function emptyCursor<T>(): Cursor<T> {
  return {
    pageInfo: {
      totalCount: 0,
      startCursor: null,
      endCursor: null,
      hasPreviousPage: false,
      hasNextPage: false,
    },
    edges: [],
  }
}

export interface CursorQueryAsc {
  order: 'ASC'
  query: string | null
  first: number
  after: string | null
}

export interface CursorQueryDesc {
  order: 'DESC'
  query: string | null
  last: number
  before: string | null
}

export type CursorQuery = CursorQueryAsc | CursorQueryDesc

export function emptyCursorQuery(perPage = 20): CursorQuery {
  return {
    order: 'ASC',
    query: null,
    first: perPage,
    after: null,
  }
}

export function foldCursorQuery<T>(
  query: CursorQuery,
  cases: {
    [k in CursorQuery['order']]: (
      query: Extract<CursorQuery, { order: k }>,
    ) => T
  },
): T {
  return cases[query.order](query as any)
}
