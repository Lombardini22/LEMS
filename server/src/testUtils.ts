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
