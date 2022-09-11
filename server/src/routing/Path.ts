import {
  CursorQuery,
  CursorQueryAsc,
  CursorQueryDesc,
} from './../../../shared/Cursor'

export type ObjectIdPath = {
  _id: string
}

type CursorQueryAscPath = Omit<CursorQueryAsc, 'first'> & {
  first: string
}

type CursorQueryDescPath = Omit<CursorQueryDesc, 'last'> & {
  last: string
}

export type CursorQueryPath = CursorQueryAscPath | CursorQueryDescPath

export function parseCursorQueryPath(query: CursorQueryPath): CursorQuery {
  switch (query.order) {
    case 'ASC':
      return { ...query, first: parseInt(query.first) }
    case 'DESC':
      return { ...query, last: parseInt(query.last) }
  }
}

export class Path<P = Record<string, never>, Q = Record<string, never>> {
  private readonly path: string

  private constructor(initialPath: string) {
    this.path = initialPath
  }

  static start(): Path<Record<string, never>, Record<string, never>> {
    return new Path('/')
  }

  literal(fragment: string): Path<P, Q> {
    return new Path(
      this.path === '/' ? `/${fragment}` : `${this.path}/${fragment}`,
    )
  }

  param<A extends { [key: string]: string | null }>(
    name: keyof A,
  ): Path<P & A, Q> {
    return new Path<P & A, Q>(
      this.path === '/' ? `/:${String(name)}` : `${this.path}/:${String(name)}`,
    )
  }

  withQuery<A extends { [key: string]: string | null }>(): Path<P, Q & A> {
    return new Path<P & A, Q>(this.path)
  }

  toString(): string {
    return this.path
  }
}
