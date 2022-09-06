import { Result } from './Result'
import { constVoid } from './utils'

export function expectResult<E, A>(result: Result<E, A>) {
  return {
    toHaveSucceeded() {
      expect(result.isSuccess()).toBe(true)
      return Result.success(constVoid)
    },
    toHaveFailed() {
      expect(result.isFailure()).toBe(true)
      return Result.success(constVoid)
    },
    toHaveSucceededWith(value: A) {
      expect(result.unsafeGetValue()).toEqual(value)
      return Result.success(constVoid)
    },
    toHaveFailedWith(error: E) {
      expect(result.unsafeGetError()).toEqual(error)
      return Result.success(constVoid)
    },
  }
}
