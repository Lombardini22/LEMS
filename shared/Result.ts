interface Success<A> {
  readonly _tag: 'Success'
  readonly value: A
}

interface Failure<E> {
  readonly _tag: 'Failure'
  readonly error: E
}

export class Result<E, A> {
  private readonly state: Failure<E> | Success<A>

  private constructor(state: Failure<E> | Success<A>) {
    this.state = state
  }

  static async success<E = never, A = never>(
    value: () => A | Promise<A>,
  ): Promise<Result<E, A>> {
    return new Result({ _tag: 'Success', value: await value() })
  }

  static async failure<E = never, A = never>(
    error: () => E | Promise<E>,
  ): Promise<Result<E, A>> {
    return new Result({ _tag: 'Failure', error: await error() })
  }

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

  unsafeGetValue(): A {
    switch (this.state._tag) {
      case 'Failure':
        throw new Error('Trying to get the value of a failed Result')
      case 'Success':
        return this.state.value
    }
  }

  unsafeGetError(): E {
    switch (this.state._tag) {
      case 'Failure':
        return this.state.error
      case 'Success':
        throw new Error('Trying to get the error of a succeeded Result')
    }
  }

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

  async bimap<E1, B>(
    whenFailure: (error: E) => E1 | Promise<E1>,
    whenSuccess: (value: A) => B | Promise<B>,
  ): Promise<Result<E1, B>> {
    return await this.fold(
      error => Result.failure(() => whenFailure(error)),
      value => Result.success(() => whenSuccess(value)),
    )
  }

  async map<B>(fn: (value: A) => B | Promise<B>): Promise<Result<E, B>> {
    return this.bimap(_ => _, fn)
  }

  async mapError<E1>(
    fn: (error: E) => E1 | Promise<E1>,
  ): Promise<Result<E1, A>> {
    return this.bimap(fn, _ => _)
  }

  async flatMap<B>(
    fn: (value: A) => Result<E, B> | Promise<Result<E, B>>,
  ): Promise<Result<E, B>> {
    return this.fold(
      error => Result.failure(() => error),
      value => fn(value),
    )
  }

  async flatMapError<E1>(
    fn: (value: E) => Result<E1, A> | Promise<Result<E1, A>>,
  ): Promise<Result<E1, A>> {
    return this.fold(
      error => fn(error),
      value => Result.success(() => value),
    )
  }

  async getOrElse(defaultValue: (error: E) => A | Promise<A>): Promise<A> {
    return this.fold(defaultValue, _ => _)
  }
}
