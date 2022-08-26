import { Result } from '../../shared/Result'
import { database } from './resources/database'

afterAll(async () => {
  await database.release()
})

export function expectT<A>(obtained: A) {
  return {
    toEqual: (expected: A) => {
      return expect(obtained).toEqual(expected)
    },
  }
}

export function expectResult<E extends Error, A>(result: Result<E, A>) {
  return {
    toHaveSucceeded: () => expect(result.isSuccess()).toBe(true),
    toHaveSucceededWith: (value: A) =>
      expect(result.unsafeGetValue()).toEqual(value),
    toHaveFailed: () => expect(result.isFailure()).toBe(true),
    toHaveFailedWith: (error: E) =>
      expect(result.unsafeGetError()).toEqual(error),
  }
}
