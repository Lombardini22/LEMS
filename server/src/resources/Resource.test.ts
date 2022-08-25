import { expectT } from '../testUtils'
import { Resource } from './Resource'

describe('Resource', () => {
  it('should acquire one time only', async () => {
    const acquire = jest.fn(() => Promise.resolve(42))
    const release = () => Promise.resolve()
    const resource = Resource.make(acquire, release)

    await resource.use(() => Promise.resolve())
    await resource.use(() => Promise.resolve())
    await resource.use(() => Promise.resolve())

    expect(acquire).toHaveBeenCalledTimes(1)
  })

  it('should allow to map it', async () => {
    expect.assertions(1)

    const acquire = jest.fn(() => Promise.resolve(42))
    const release = () => Promise.resolve()
    const mapFn = (n: number) => Promise.resolve(n.toString(10))
    const resource = Resource.make(acquire, release, mapFn)

    await resource.use(input => {
      expectT(input).toEqual('42')
      return Promise.resolve()
    })
  })
})
