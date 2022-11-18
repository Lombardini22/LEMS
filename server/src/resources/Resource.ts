import { Result } from '../../../shared/Result'
import { ServerError } from '../ServerError'

/**
 * A Resource is an object that can be made, used multiple times, and released
 */
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
  /**
   * Creates a new Resource. It renders the acquisition process opaque, making it one time only
   * @param acquire the acquisition function. Use it to access the resource and return it
   * @param release the release function. Use it to release your resource forever
   * @param mapFn optional map function. Use it if you need to provide the use of something different from what you acquired
   */
  static make<T, M>(
    acquire: () => Promise<Result<ServerError, T>>,
    release: (resource: T) => Promise<Result<ServerError, void>>,
    mapFn?: (resource: T) => Promise<Result<ServerError, M>>,
  ): Resource<T, T | M> {
    return new Resource(acquire, release, mapFn)
  }

  /**
   * Acquires the resource if needed, then executes an operation providing the resource to it
   * @param op the operation to be done
   * @returns the result of the operation, or the failure of the acquisition process, if it went wrong
   */
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

  /**
   * Acquires the resource if needed, then it releases it. After this method is called, the resource will need to be acquired again if needed
   * @returns the result of the release operation
   */
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
