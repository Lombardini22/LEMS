export class Resource<T, M = T> {
  private readonly acquireFn: () => Promise<T>
  private readonly releaseFn: (resource: T) => Promise<void>
  private readonly mapFn: (resource: T) => Promise<M>

  private resource: T | null = null

  private constructor(
    acquire: () => Promise<T>,
    release: (resource: T) => Promise<void>,
    mapFn?: (resource: T) => Promise<M>,
  ) {
    this.acquireFn = acquire
    this.releaseFn = release
    this.mapFn = mapFn || (x => Promise.resolve(x as unknown as M))
  }

  static make<T>(
    acquire: () => Promise<T>,
    release: (resource: T) => Promise<void>,
  ): Resource<T>
  static make<T, M>(
    acquire: () => Promise<T>,
    release: (resource: T) => Promise<void>,
    mapFn: (resource: T) => Promise<M>,
  ): Resource<T, M>
  static make<T, M>(
    acquire: () => Promise<T>,
    release: (resource: T) => Promise<void>,
    mapFn?: (resource: T) => Promise<M>,
  ): Resource<T, T | M> {
    return new Resource(acquire, release, mapFn)
  }

  async use<R>(op: (resource: M) => Promise<R>): Promise<R> {
    this.resource = this.resource || (await this.acquireFn())
    return await this.mapFn(this.resource).then(op)
  }

  async release(): Promise<void> {
    this.resource = this.resource || (await this.acquireFn())
    return this.releaseFn(this.resource)
  }
}
