interface Success<A> {
  readonly _tag: 'Success'
  readonly value: A
}

interface Failure<E> {
  readonly _tag: 'Failure'
  readonly error: E
}

type ResultI<E, A> = Failure<E> | Success<A>

export class Result<E extends Error, A> {
  private readonly state: ResultI<E, A>

  private constructor(state: ResultI<E, A>) {
    this.state = state
  }

  static success<E extends Error, A = never>(value: A): Result<E, A>
  static success<E extends Error>(): Result<E, void>
  static success<E extends Error, A = never>(value?: A): Result<E, A | void> {
    return new Result({ _tag: 'Success', value })
  }

  static asyncSuccess<E extends Error, A = never>(
    value: A,
  ): Promise<Result<E, A>>
  static asyncSuccess<E extends Error>(): Promise<Result<E, void>>
  static asyncSuccess<E extends Error, A = never>(
    value?: A,
  ): Promise<Result<E, A | void>> {
    return Promise.resolve(new Result({ _tag: 'Success', value }))
  }

  static failure<A, E extends Error = never>(error: E): Result<E, A> {
    return new Result({ _tag: 'Failure', error })
  }

  static asyncFailure<A, E extends Error = never>(
    error: E,
  ): Promise<Result<E, A>> {
    return Promise.resolve(new Result({ _tag: 'Failure', error }))
  }

  static tryCatch<E extends Error, A>(
    fn: () => A,
    errorHandler: (error: unknown) => E,
  ): Result<E, A> {
    try {
      return Result.success(fn())
    } catch (e) {
      return Result.failure(errorHandler(e))
    }
  }

  static async asyncTryCatch<E extends Error, A>(
    fn: () => Promise<A>,
    errorHandler: (error: unknown) => E,
  ): Promise<Result<E, A>> {
    try {
      return Result.success(await fn())
    } catch (e) {
      return Result.failure(errorHandler(e))
    }
  }

  static fromNullable<E extends Error, A>(
    nullable: A | null | undefined,
    nullHandler: () => E,
  ): Result<E, NonNullable<A>> {
    if (nullable === null || nullable === undefined) {
      return Result.failure(nullHandler())
    } else {
      return Result.success(nullable as NonNullable<A>)
    }
  }

  static async fromPromise<E extends Error, A>(
    promise: Promise<A>,
    errorHandler: (e: unknown) => E,
  ): Promise<Result<E, A>> {
    try {
      return Result.success(await promise)
    } catch (e) {
      return Result.failure(errorHandler(e))
    }
  }

  isSuccess(): boolean {
    return this.fold(
      () => false,
      () => true,
    )
  }

  isFailure(): boolean {
    return this.fold(
      () => true,
      () => false,
    )
  }

  fold<T>(whenFailure: (error: E) => T, whenSuccess: (value: A) => T): T {
    switch (this.state._tag) {
      case 'Failure':
        return whenFailure(this.state.error)
      case 'Success':
        return whenSuccess(this.state.value)
    }
  }

  map<B>(fn: (value: A) => B): Result<E, B> {
    return this.fold(
      error => Result.failure(error),
      value => Result.success(fn(value)),
    )
  }

  async asyncMap<B>(fn: (value: A) => Promise<B>): Promise<Result<E, B>> {
    return await this.fold(
      error => Result.asyncFailure(error),
      async value => Result.asyncSuccess(await fn(value)),
    )
  }

  flatMap<B>(fn: (value: A) => Result<E, B>): Result<E, B> {
    return this.fold(error => Result.failure(error), fn)
  }

  asyncFlatMap<B>(
    fn: (value: A) => Promise<Result<E, B>>,
  ): Promise<Result<E, B>> {
    return this.fold(error => Result.asyncFailure(error), fn)
  }

  getOrElse(defaultFn: (error: E) => A): A {
    return this.fold(
      error => defaultFn(error),
      _ => _,
    )
  }

  unsafeGetValue(): A {
    return this.fold(
      error => {
        throw error
      },
      _ => _,
    )
  }

  unsafeGetError(): E {
    return this.fold(
      _ => _,
      value => {
        throw new Error(`Expected error, instead got success: ${value}`)
      },
    )
  }
}
