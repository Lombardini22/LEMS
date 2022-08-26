import { Result } from '../../../shared/Result'
import { ServerError } from '../ServerError'

export class Resource<T, M = T> {
  private readonly acquireFn: () => Promise<Result<ServerError, T>>
  private readonly releaseFn: (
    resource: T,
  ) => Promise<Result<ServerError, void>>
  private readonly mapFn: (resource: T) => Promise<Result<ServerError, M>>

  private resource: T | null = null

  private constructor(
    acquire: () => Promise<Result<ServerError, T>>,
    release: (resource: T) => Promise<Result<ServerError, void>>,
    mapFn?: (resource: T) => Promise<Result<ServerError, M>>,
  ) {
    this.acquireFn = acquire
    this.releaseFn = release
    this.mapFn = mapFn || (x => Result.asyncSuccess(x as unknown as M))
  }

  static make<T>(
    acquire: () => Promise<Result<ServerError, T>>,
    release: (resource: T) => Promise<Result<ServerError, void>>,
  ): Resource<T>
  static make<T, M>(
    acquire: () => Promise<Result<ServerError, T>>,
    release: (resource: T) => Promise<Result<ServerError, void>>,
    mapFn: (resource: T) => Promise<Result<ServerError, M>>,
  ): Resource<T, M>
  static make<T, M>(
    acquire: () => Promise<Result<ServerError, T>>,
    release: (resource: T) => Promise<Result<ServerError, void>>,
    mapFn?: (resource: T) => Promise<Result<ServerError, M>>,
  ): Resource<T, T | M> {
    return new Resource(acquire, release, mapFn)
  }

  async use<R>(
    op: (resource: M) => Promise<Result<ServerError, R>>,
  ): Promise<Result<ServerError, R>> {
    const resource = await this.impureAcquire()
    const mappedResource = await resource.asyncFlatMap(_ => this.mapFn(_))

    return mappedResource.asyncFlatMap(op)
  }

  async release(): Promise<Result<ServerError, void>> {
    const resource = await this.impureAcquire()
    return resource.asyncFlatMap(this.releaseFn)
  }

  private async impureAcquire(): Promise<Result<ServerError, T>> {
    if (this.resource) {
      return Result.success(this.resource)
    } else {
      const result = await this.acquireFn()

      return result.fold(
        error => Result.failure(error),
        value => {
          this.resource = value
          return Result.success(value)
        },
      )
    }
  }
}
