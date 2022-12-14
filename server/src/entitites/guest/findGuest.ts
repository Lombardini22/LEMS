import { Result } from '../../../../shared/Result'
import { Request } from '../../routing/Router'
import { ServerError } from '../../ServerError'
import { WithId } from 'mongodb'
import { Guest, hashGuestEmail } from '../../../../shared/models/Guest'
import { Path } from '../../routing/Path'
import { env } from '../../resources/env'
import { fetchGuest } from './utils/fetchGuest'
import { mailchimpDatabaseListMemberToGuest } from './utils/mailchimpDatabaseListMemberToGuest'

type FindGuestParams = {
  email: string
}

export const findGuestPath = Path.start()
  .param<FindGuestParams>('email')
  .literal('rsvp')

export function findGuest(
  req: Request<FindGuestParams>,
): Promise<Result<ServerError, WithId<Guest>>> {
  return env.use(env => {
    const { email } = req.params
    const emailHash = hashGuestEmail(email)

    return fetchGuest(
      emailHash,
      env.MAILCHIMP_DATABASE_LIST_ID,
      mailchimpDatabaseListMemberToGuest(emailHash),
    )
  })
}
