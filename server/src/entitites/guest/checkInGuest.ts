import { WithId } from 'mongodb'
import { Guest } from '../../../../shared/models/Guest'
import { Result } from '../../../../shared/Result'
import { Path } from '../../routing/Path'
import { Request } from '../../routing/Router'
import { ServerError } from '../../ServerError'
import { guestsCollection } from './guestsCollection'

type CheckInGuestParams = {
  emailHash: string
}

export const checkInGuestPath = Path.start()
  .param<CheckInGuestParams>('emailHash')
  .literal('check-in')

export async function checkInGuest(
  req: Request<CheckInGuestParams, unknown, unknown>,
): Promise<Result<ServerError, WithId<Guest>>> {
  const guest = await guestsCollection.findOne({
    emailHash: req.params.emailHash,
  })

  const updateResult = await guest.flatMap(guest =>
    guestsCollection.update(
      { _id: guest._id },
      {
        ...guest,
        status: 'CHECKED_IN',
      },
    ),
  )

  return updateResult.mapError(error => {
    if (error.status === 404) {
      return new ServerError(404, 'Guest not found', error.extra)
    } else {
      return error
    }
  })
}
