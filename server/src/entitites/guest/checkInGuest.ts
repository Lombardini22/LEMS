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

type CheckedInGuest = WithId<Guest> & {
  previousStatus: Guest['status']
}

export async function checkInGuest(
  req: Request<CheckInGuestParams, unknown, unknown>,
): Promise<Result<ServerError, CheckedInGuest>> {
  const guest = await guestsCollection.findOne({
    emailHash: req.params.emailHash,
  })

  const updateResult = await guest.flatMap(async guest => {
    const previousStatus = guest.status

    const result = await guestsCollection.update(
      { _id: guest._id },
      {
        ...guest,
        status: 'CHECKED_IN',
      },
    )

    return result.map(result => ({
      ...result,
      previousStatus,
    }))
  })

  return updateResult.mapError(error => {
    if (error.status === 404) {
      return new ServerError(404, 'Guest not found', error.extra)
    } else {
      return error
    }
  })
}
