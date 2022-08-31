export class Path<T = Record<string, never>> {
  private readonly path: string

  private constructor(initialPath: string) {
    this.path = initialPath
  }

  static start(): Path<Record<string, never>> {
    return new Path('/')
  }

  literal(fragment: string): Path<T> {
    return new Path(
      this.path === '/' ? `/${fragment}` : `${this.path}/${fragment}`,
    )
  }

  param<A extends { [key: string]: string }>(name: keyof A): Path<T & A> {
    return new Path<T & A>(
      this.path === '/' ? `/:${String(name)}` : `${this.path}/:${String(name)}`,
    )
  }

  toString(): string {
    return this.path
  }
}
