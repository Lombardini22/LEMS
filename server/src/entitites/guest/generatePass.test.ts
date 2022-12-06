import { hashGuestEmail } from '../../../../shared/models/Guest'
import { expectResult } from '../../../../shared/testUtils'
import { generatePassStream } from './generatePass'

describe('generatePass', () => {
  it('should work', async () => {
    const result = await generatePassStream(
      hashGuestEmail('john.doe@example.com'),
    )
    expectResult(result).toHaveSucceeded()
  })
})
