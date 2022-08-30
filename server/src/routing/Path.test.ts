import { expectT } from '../testUtils'
import { Path } from './Path'

describe('Path', () => {
  it('should work with root', () => {
    const path = Path.start()
    expectT(path.toString()).toEqual('/')
  })

  it('should handle simple paths', () => {
    const path = Path.start().literal('some').literal('path')
    expectT(path.toString()).toEqual('/some/path')
  })

  it('should work with one parameter', () => {
    const path = Path.start().param<{ _id: string }>('_id')
    expectT(path.toString()).toEqual('/:_id')
  })

  it('should handle parameters', () => {
    const path = Path.start()
      .literal('entity')
      .param<{ _id: string }>('_id')
      .literal('count')
      .param<{ count: string }>('count')

    expectT(path.toString()).toEqual('/entity/:_id/count/:count')
  })
})
