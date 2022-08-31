import { Result } from './Result'
import { expectResult } from './testUtils'

describe('Result', () => {
  describe('sync usage', () => {
    it('turns exceptions into errors', async () => {
      // this doesn't throw: it returns an error
      const error = new Error('Some error')
      const result = await Result.tryCatch(
        () => {
          throw error
        },
        e => e,
      )

      expectResult(result).toHaveFailedWith(error)
    })

    it('could be a success', async () => {
      const success = await Result.success(() => 42)
      expectResult(success).toHaveSucceededWith(42)
    })

    it('could be a failure', async () => {
      const error = new Error('Some error')
      const failure = await Result.failure(() => error)

      expectResult(failure).toHaveFailedWith(error)
    })

    it('supports the fold operation', async () => {
      async function describeResult(
        result: Result<Error, string>,
      ): Promise<string> {
        return await result.fold(
          error => `Result failed: ${error.message}`,
          value => `Result succeeded: ${value}`,
        )
      }

      const success = await Result.success(() => 'success message')
      const failure = await Result.failure(() => new Error('error message'))

      expect(await describeResult(success)).toBe(
        'Result succeeded: success message',
      )

      expect(await describeResult(failure)).toBe('Result failed: error message')
    })

    it('supports the map operation on a success', async () => {
      const error = new Error('Some error')
      const success = await Result.success(() => 42)
      const failure = await Result.failure(() => error)

      expectResult(await success.map(n => n * 2)).toHaveSucceededWith(84)
      expectResult(await failure.map(n => n * 2)).toHaveFailedWith(error)
    })

    it('supports the map operation on a failure', async () => {
      const error = new Error('Some error')
      const success = await Result.success<Error, number>(() => 42)
      const failure = await Result.failure(() => error)

      expectResult(await success.mapError(e => e.message)).toHaveSucceededWith(
        42,
      )

      expectResult(await failure.mapError(e => e.message)).toHaveFailedWith(
        error.message,
      )
    })

    it('supports the flatMap operation on a success', async () => {
      const error = new Error('Some error')
      const success = await Result.success<Error, number>(() => 42)
      const failure = await Result.failure(() => error)

      expectResult(
        await success.flatMap(() => Result.failure(() => error)),
      ).toHaveFailedWith(error)

      expectResult(
        await failure.flatMap(() => Result.success(() => 12)),
      ).toHaveFailedWith(error)
    })

    it('supports the flatMap operation on a failure', async () => {
      const error = new Error('Some error')
      const success = await Result.success(() => 42)
      const failure = await Result.failure<Error, number>(() => error)

      expectResult(
        await success.flatMapError(() => Result.success(() => 12)),
      ).toHaveSucceededWith(42)

      expectResult(
        await failure.flatMapError(() => Result.success(() => 12)),
      ).toHaveSucceededWith(12)
    })

    it('supports folding to a default value', async () => {
      const success = await Result.success(() => 42)

      const failure = await Result.failure<Error, number>(
        () => new Error('Not 42'),
      )

      expect(await success.getOrElse(() => 42)).toBe(42)
      expect(await failure.getOrElse(() => 42)).toBe(42)
    })
  })

  describe('async usage', () => {
    it('turns exceptions into errors', async () => {
      // this doesn't reject: it resolves in an error
      const error = new Error('Some error')
      const result = await Result.tryCatch(
        () => {
          throw error
        }, // same as `() => Promise.reject(error)`
        e => e,
      )

      expectResult(result).toHaveFailedWith(error)
    })

    it('could be a success', async () => {
      const success = await Result.success(() => Promise.resolve(42))
      expectResult(success).toHaveSucceededWith(42)
    })

    it('could be a failure', async () => {
      const error = new Error('Some error')
      // failures resolve in an error, they never reject
      const failure = await Result.failure(() => Promise.resolve(error))

      expectResult(failure).toHaveFailedWith(error)
    })

    it('supports the fold operation', async () => {
      async function describeResult(
        result: Result<Error, string>,
      ): Promise<string> {
        return await result.fold(
          error => `Result failed: ${error.message}`,
          value => `Result succeeded: ${value}`,
        )
      }

      const success = await Result.tryCatch(
        async () => 'success message',
        () => new Error('will never happen'),
      )

      const failure = await Result.tryCatch(
        async () => {
          throw new Error('error message')
        },
        error => error as Error,
      )

      expect(await describeResult(success)).toBe(
        'Result succeeded: success message',
      )

      expect(await describeResult(failure)).toBe('Result failed: error message')
    })

    it('supports the map operation on a success', async () => {
      const error = new Error('Some error')
      const success = await Result.success(() => 42)
      const failure = await Result.failure(() => error)

      expectResult(await success.map(async n => n * 2)).toHaveSucceededWith(84)
      expectResult(await failure.map(async n => n * 2)).toHaveFailedWith(error)
    })

    it('supports the map operation on a failure', async () => {
      const error = new Error('Some error')
      const success = await Result.success<Error, number>(() => 42)
      const failure = await Result.failure(() => error)

      expectResult(
        await success.mapError(async e => e.message),
      ).toHaveSucceededWith(42)

      expectResult(
        await failure.mapError(async e => e.message),
      ).toHaveFailedWith(error.message)
    })

    it('supports the flatMap operation on a success', async () => {
      const error = new Error('Some error')
      const success = await Result.success<Error, number>(() => 42)
      const failure = await Result.failure(() => error)

      expectResult(
        await success.flatMap(async () => Result.failure(() => error)),
      ).toHaveFailedWith(error)

      expectResult(
        await failure.flatMap(async () => Result.success(() => 12)),
      ).toHaveFailedWith(error)
    })

    it('supports the flatMap operation on a failure', async () => {
      const error = new Error('Some error')
      const success = await Result.success(() => 42)
      const failure = await Result.failure<Error, number>(() => error)

      expectResult(
        await success.flatMapError(async () => Result.success(() => 12)),
      ).toHaveSucceededWith(42)

      expectResult(
        await failure.flatMapError(async () => Result.success(() => 12)),
      ).toHaveSucceededWith(12)
    })

    it('supports folding to a default value', async () => {
      const success = await Result.success(() => 42)

      const failure = await Result.failure<Error, number>(
        () => new Error('Not 42'),
      )

      expect(await success.getOrElse(async () => 42)).toBe(42)
      expect(await failure.getOrElse(async () => 42)).toBe(42)
    })
  })
})
