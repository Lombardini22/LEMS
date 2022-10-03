import { WithId } from 'mongodb'
import { Guest } from '../../../../shared/models/Guest'
import { Result } from '../../../../shared/Result'
import { env } from '../../resources/env'
import { Path } from '../../routing/Path'
import { Request } from '../../routing/Router'
import { ServerError } from '../../ServerError'
import { fetchGuest } from './utils/fetchGuest'

type FindGuestParams = {
  emailHash: string
}

export const findGuestPath = Path.start().param<FindGuestParams>('emailHash')

export async function findGuest(
  req: Request<FindGuestParams>,
): Promise<Result<ServerError, WithId<Guest>>> {
  try{
    return env.use(env =>
      fetchGuest(req.params.emailHash, env.MAILCHIMP_EVENT_LIST_ID, member => ({
        firstName: member.merge_fields['FNAME'],
        lastName: member.merge_fields['LNAME'],
        email: member.email_address,
        emailHash: req.params.emailHash,
        companyName: member.merge_fields['MMERGE4'] || null,
        source: 'RSVP',
        status: 'RSVP',
        accountManager: null,
      })),
    )
  } catch (error) {
    throw new Error(`error: ${error}`)
  }

}
