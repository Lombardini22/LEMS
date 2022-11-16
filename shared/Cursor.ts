interface PageInfo {
  totalCount: number
  startCursor: string | null
  endCursor: string | null
  hasPreviousPage: boolean
  hasNextPage: boolean
}

/**
 * Represents a single item of a paginated result. The cursor can be used as a reference in a `CursorQuery`, while the node is the actual document
 */
interface Edge<T> {
  cursor: string
  node: T
}

/**
 * Represents a paginated result. See `PageInfo` and `Edge`
 */
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

/**
 * Represents a query with pagination in ascending order. `query` is the query string, `first` and `after` express the number of documents (i.e.: page size) that are wanted and which was the last known document. `after` should be a cursor retrieved from an `Edge`
 */
export interface CursorQueryAsc {
  order: 'ASC'
  query: string | null
  first: number
  after: string | null
}

/**
 * Represents a query with pagination in descending order. `query` is the query string, `last` and `before` express the number of documents (i.e.: page size) that are wanted and which was the last known document. `before` should be a cursor retrieved from an `Edge`
 */
export interface CursorQueryDesc {
  order: 'DESC'
  query: string | null
  last: number
  before: string | null
}

/**
 * Represents a query with pagination. See `CursorQueryAsc` and `CursorQueryDesc`
 */
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
