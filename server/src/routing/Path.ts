import {
  CursorQuery,
  CursorQueryAsc,
  CursorQueryDesc,
} from './../../../shared/Cursor'

/**
 * Utility type for a Path that only expects a MongoDB _id
 */
export type ObjectIdPath = {
  _id: string
}

type CursorQueryAscPath = Omit<CursorQueryAsc, 'first'> & {
  first: string
}

type CursorQueryDescPath = Omit<CursorQueryDesc, 'last'> & {
  last: string
}

/**
 * Utility type for a CursorQuery that expects strings instead of numbers, since Express only deals with strings. Use it together with `parseCursorQueryPath` to obtain the actual CursorQuery
 */
export type CursorQueryPath = CursorQueryAscPath | CursorQueryDescPath

/**
 * Turns an Express query (CursorQueryPath) into a CursorQuery
 * @param query the query straight from Express
 * @returns an actual CursorQuery
 */
export function parseCursorQueryPath(query: CursorQueryPath): CursorQuery {
  switch (query.order) {
    case 'ASC':
      return { ...query, first: parseInt(query.first) }
    case 'DESC':
      return { ...query, last: parseInt(query.last) }
  }
}

/**
 * Strongly typed version of Express paths. Use this to create Express paths (e.g.: /users/:_id/profile) that are strongly typed and can be matched with Router handlers
 */
export class Path<P = Record<string, never>, Q = Record<string, never>> {
  private readonly path: string

  private constructor(initialPath: string) {
    this.path = initialPath
  }

  /**
   * Creates a Path
   * @returns a new Path
   */
  static start(): Path<Record<string, never>, Record<string, never>> {
    return new Path('/')
  }

  /**
   * Appends a literal fragment (i.e.: a constant string) to the path
   * @param fragment the literal fragment
   * @returns a copy of this path with the literal at the end
   */
  literal(fragment: string): Path<P, Q> {
    return new Path(
      this.path === '/' ? `/${fragment}` : `${this.path}/${fragment}`,
    )
  }

  /**
   * Appends a parameter (i.e.: a string that will end up into the `params` property of a request) to the path. Type this method call to type the parameter
   * @param name the name of the parameter
   * @returns a copy of this path with the parameter at the end
   */
  param<A extends { [key: string]: string | null }>(
    name: keyof A,
  ): Path<P & A, Q> {
    return new Path<P & A, Q>(
      this.path === '/' ? `/:${String(name)}` : `${this.path}/:${String(name)}`,
    )
  }

  /**
   * Adds a query (i.e.: an object that will end up into the `query` property of a request) to the path. Type this method call to type the query
   * @returns a copy of this path with the query attached
   */
  withQuery<A extends { [key: string]: string | null }>(): Path<P, Q & A> {
    return new Path<P & A, Q>(this.path)
  }

  /**
   * @returns the Express string representation of this path
   */
  toString(): string {
    return this.path
  }
}
