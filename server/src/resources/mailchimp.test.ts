import { Result } from '../../../shared/Result'
import { expectResult } from '../../../shared/testUtils'
import { constVoid } from '../../../shared/utils'
import { mailchimp } from './mailchimp'

describe('mailchimp', () => {
  it('should work', async () => {
    const result = await mailchimp.use(() => Result.success(constVoid))
    expectResult(result).toHaveSucceeded()
  })
})
