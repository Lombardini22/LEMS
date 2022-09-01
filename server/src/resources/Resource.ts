import { Result } from '../../../shared/Result'
import { ServerError } from '../ServerError'

export class Resource<T, M = T> {
  private readonly acquireFn: () => Promise<Result<ServerError, T>>

  private readonly releaseFn: (
    resource: T,
  ) => Promise<Result<ServerError, void>>

  private readonly mapFn: (resource: T) => Promise<Result<ServerError, M>>

  protected resource: T | null = null

  protected constructor(
    acquire: () => Promise<Result<ServerError, T>>,
    release: (resource: T) => Promise<Result<ServerError, void>>,
    mapFn?: (resource: T) => Promise<Result<ServerError, M>>,
  ) {
    this.acquireFn = acquire
    this.releaseFn = release
    this.mapFn =
      mapFn || (x => Result.success(() => Promise.resolve(x as unknown as M)))
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
    if (!this.resource) {
      const acquisitionResult = await this.acquireFn()

      if (acquisitionResult.isSuccess()) {
        this.resource = acquisitionResult.unsafeGetValue()
      } else {
        return Result.failure(() => acquisitionResult.unsafeGetError())
      }
    }

    const mapResult = await this.mapFn(this.resource)
    return mapResult.flatMap(op)
  }

  async release(): Promise<Result<ServerError, void>> {
    if (!this.resource) {
      const acquisitionResult = await this.acquireFn()

      if (acquisitionResult.isSuccess()) {
        this.resource = acquisitionResult.unsafeGetValue()
      } else {
        return Result.failure(() => acquisitionResult.unsafeGetError())
      }
    }

    const result = await this.releaseFn(this.resource)

    this.resource = null
    return result
  }
}
