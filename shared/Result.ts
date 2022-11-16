interface Success<A> {
  readonly _tag: 'Success'
  readonly value: A
}

interface Failure<E> {
  readonly _tag: 'Failure'
  readonly error: E
}

/**
 * Represents an operation (either sync or async) that may fail
 */
export class Result<E, A> {
  private readonly state: Failure<E> | Success<A>

  private constructor(state: Failure<E> | Success<A>) {
    this.state = state
  }

  /**
   * Creates a successful Result
   * @param value a sync or async function that returns the successful value of the result
   * @returns the result
   */
  static async success<E = never, A = never>(
    value: () => A | Promise<A>,
  ): Promise<Result<E, A>> {
    return new Result({ _tag: 'Success', value: await value() })
  }

  /**
   * Creates a failed result
   * @param error a sync or async function that returns the error value of the failure
   * @returns the result
   */
  static async failure<E = never, A = never>(
    error: () => E | Promise<E>,
  ): Promise<Result<E, A>> {
    return new Result({ _tag: 'Failure', error: await error() })
  }

  /**
   * Turns a fallible sync or async opertion into a Result
   * @param fn the sync or async fallible operation
   * @param errorHandler the error handler. It should turn an unknown exception into a known error
   * @returns the result of the operation
   */
  static async tryCatch<E, A>(
    fn: () => A | Promise<A>,
    errorHandler: (e: unknown) => E,
  ): Promise<Result<E, A>> {
    try {
      const result = await fn()
      return Result.success(() => result)
    } catch (e) {
      return Result.failure(() => errorHandler(e))
    }
  }

  isSuccess(): boolean {
    return this.state._tag === 'Success'
  }

  isFailure(): boolean {
    return this.state._tag === 'Failure'
  }

  /**
   * WARNING: use this only when testing or fter having called `isSuccess`, otherwise an exception may be thrown. It extracts the value from a successful result.
   * @returns the value of the successful result
   */
  unsafeGetValue(): A {
    switch (this.state._tag) {
      case 'Failure':
        throw new Error('Trying to get the value of a failed Result')
      case 'Success':
        return this.state.value
    }
  }

  /**
   * WARNING: use this only when testing or fter having called `isSuccess`, otherwise an exception may be thrown. It extracts the error from a failed result.
   * @returns the error of the failed result
   */
  unsafeGetError(): E {
    switch (this.state._tag) {
      case 'Failure':
        return this.state.error
      case 'Success':
        throw new Error('Trying to get the error of a succeeded Result')
    }
  }

  /**
   * Turns a Result into a value of a type, no matter if it's a success or a failure
   * @param whenFailure what to return in case of failure. It takes the error as an argument
   * @param whenSuccess what to return in case of success. It takes the value as an argument
   * @returns either the result of `whenFailure` or `whenSuccess`, depending on the state of the result
   */
  async fold<T>(
    whenFailure: (error: E) => T | Promise<T>,
    whenSuccess: (value: A) => T | Promise<T>,
  ): Promise<T> {
    switch (this.state._tag) {
      case 'Failure':
        return whenFailure(this.state.error)
      case 'Success':
        return whenSuccess(this.state.value)
    }
  }

  /**
   * Transforms both the error and value of a result
   * @param whenFailure what to transform the error into. It takes the error as an argoment
   * @param whenSuccess what to transform the value into. It takes the value as an argoment
   * @returns a Result with the transformed error and value
   */
  async bimap<E1, B>(
    whenFailure: (error: E) => E1 | Promise<E1>,
    whenSuccess: (value: A) => B | Promise<B>,
  ): Promise<Result<E1, B>> {
    return await this.fold(
      error => Result.failure(() => whenFailure(error)),
      value => Result.success(() => whenSuccess(value)),
    )
  }

  /**
   * Transformes the value of a successful result, leaving the error unaltered
   * @param fn the transforming function
   * @returns a Result with the transformed value
   */
  async map<B>(fn: (value: A) => B | Promise<B>): Promise<Result<E, B>> {
    return this.bimap(_ => _, fn)
  }

  /**
   * Transformes the error of a failed result, leaving the value unaltered
   * @param fn the transforming function
   * @returns a Result with the transformed error
   */
  async mapError<E1>(
    fn: (error: E) => E1 | Promise<E1>,
  ): Promise<Result<E1, A>> {
    return this.bimap(fn, _ => _)
  }

  /**
   * Chains an operation to this result. If the current result is a failure, it keeps the error and does not execute the next operation. If the current result is a success, it returns the result of the next operation
   * @param fn the operation that returnes the next result
   * @returns the result of both the chained operations
   */
  async flatMap<B>(
    fn: (value: A) => Result<E, B> | Promise<Result<E, B>>,
  ): Promise<Result<E, B>> {
    return this.fold(
      error => Result.failure(() => error),
      value => fn(value),
    )
  }

  /**
   * Chains an operation to this result. If the current result is a failure, it returns the result of the next operation. If the current result is a success, it keeps the value and does not execute the next operation
   * @param fn the operation that returnes the next result
   * @returns the result of both the chained operations
   */
  async flatMapError<E1>(
    fn: (value: E) => Result<E1, A> | Promise<Result<E1, A>>,
  ): Promise<Result<E1, A>> {
    return this.fold(
      error => fn(error),
      value => Result.success(() => value),
    )
  }

  /**
   * Extracts the value of this result, providing a default value in case of failure
   * @param defaultValue the value to be returned in case of failure
   * @returns the value of this result if it is successful, `defaultValue` otherwise
   */
  async getOrElse(defaultValue: (error: E) => A | Promise<A>): Promise<A> {
    return this.fold(defaultValue, _ => _)
  }
}
