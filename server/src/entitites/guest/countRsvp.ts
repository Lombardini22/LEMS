import { Result } from '../../../../shared/Result'
import { Path } from '../../routing/Path'
import { ServerError } from '../../ServerError'
import { guestsCollection } from './guestsCollection'

export const countRsvpPath = Path.start().literal('count-rsvp')

export interface CountRsvpResponse {
  count: number
}

export async function countRsvp(): Promise<
  Result<ServerError, CountRsvpResponse>
> {
  const count = await guestsCollection.raw(collection =>
    Result.tryCatch(
      () => collection.countDocuments({ status: 'RSVP' }),
      error => new ServerError(500, 'Unable to count RSVP guests', { error }),
    ),
  )

  return count.map(count => ({ count }))
}
