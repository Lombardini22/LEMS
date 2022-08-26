import { Result } from '../../../shared/Result'
import { ServerError } from '../ServerError'
import { expectT } from '../testUtils'
import { Resource } from './Resource'

describe('Resource', () => {
  it('should acquire one time only', async () => {
    const acquire = jest.fn(() => Result.asyncSuccess<ServerError, number>(42))
    const release = () => Result.asyncSuccess<ServerError>()
    const resource = Resource.make(acquire, release)

    await resource.use(() => Result.asyncSuccess())
    await resource.use(() => Result.asyncSuccess())
    await resource.use(() => Result.asyncSuccess())

    expect(acquire).toHaveBeenCalledTimes(1)
  })

  it('should allow to map it', async () => {
    expect.assertions(1)

    const acquire = jest.fn(() => Result.asyncSuccess<ServerError, number>(42))
    const release = () => Result.asyncSuccess<ServerError>()

    const mapFn = (n: number) =>
      Result.asyncSuccess<ServerError, string>(n.toString(10))

    const resource = Resource.make(acquire, release, mapFn)

    await resource.use(input => {
      expectT(input).toEqual('42')
      return Result.asyncSuccess()
    })
  })
})
