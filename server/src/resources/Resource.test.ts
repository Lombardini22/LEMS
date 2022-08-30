import { Result } from '../../../shared/Result'
import { constVoid } from '../../../shared/utils'
import { expectT } from '../testUtils'
import { Resource } from './Resource'

describe('Resource', () => {
  it('should acquire one time only', async () => {
    const acquire = jest.fn(() => Result.success(() => 42))
    const release = () => Result.success(constVoid)
    const resource = Resource.make(acquire, release)

    await resource.use(() => Result.success(constVoid))
    await resource.use(() => Result.success(constVoid))
    await resource.use(() => Result.success(constVoid))

    expect(acquire).toHaveBeenCalledTimes(1)
  })

  it('should allow to map it', async () => {
    expect.assertions(1)

    const acquire = jest.fn(() => Result.success(() => 42))
    const release = () => Result.success(constVoid)
    const mapFn = (n: number) => Result.success(() => n.toString(10))
    const resource = Resource.make(acquire, release, mapFn)

    await resource.use(input => {
      expectT(input).toEqual('42')
      return Result.success(constVoid)
    })
  })
})
