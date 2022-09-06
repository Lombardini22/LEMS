import { Collection } from '../../database/Collection'
import { Guest } from '../../../../shared/models/Guest'
import { Result } from '../../../../shared/Result'
import { ServerError } from '../../ServerError'
import { constVoid } from '../../../../shared/utils'

export const guestsCollection = new Collection<Guest>('guests', collection => {
  if (process.env['NODE_ENV'] === 'test') {
    return Result.success(constVoid)
  } else {
    return Result.tryCatch(
      () => {
        collection.createIndexes([
          {
            key: {
              emailHash: 1,
            },
            unique: true,
            name: 'uniqueEmailHash',
          },
        ])
      },
      error =>
        new ServerError(500, 'Unable to create indexes on guests collection', {
          error,
        }),
    )
  }
})
