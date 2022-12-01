import { expectResult } from '../../../../shared/testUtils'
import { generatePassStream } from './generatePass'

describe('generatePass', () => {
  it('should work', async () => {
    const result = await generatePassStream()
    expectResult(result).toHaveSucceeded()
  })
})
