import { Result } from './Result'

export function expectResult<E, A>(result: Result<E, A>) {
  return {
    toHaveSucceeded() {
      expect(result.isSuccess()).toBe(true)
    },
    toHaveFailed() {
      expect(result.isFailure()).toBe(true)
    },
    toHaveSucceededWith(value: A) {
      expect(result.isSuccess()).toBe(true)
      expect(result.unsafeGetValue()).toEqual(value)
    },
    toHaveFailedWith(error: E) {
      expect(result.isFailure()).toBe(true)
      expect(result.unsafeGetError()).toEqual(error)
    },
  }
}
