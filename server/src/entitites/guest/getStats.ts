import { Result } from '../../../../shared/Result'
import { Path } from '../../routing/Path'
import { ServerError } from '../../ServerError'
import { guestsCollection } from './guestsCollection'

interface Stats {
  totalCount: number
  checkedIn: number
  notCheckedIn: number
}

export const getStatsPath = Path.start().literal('stats')

export async function getStats(): Promise<Result<ServerError, Stats>> {
  const result = await guestsCollection.aggregate<Stats>([
    {
      $facet: {
        totalCount: [
          {
            $count: 'totalCount',
          },
        ],
        checkedIn: [
          {
            $match: {
              status: {
                $eq: 'CHECKED_IN',
              },
            },
          },
          {
            $count: 'checkedIn',
          },
        ],
        notCheckedIn: [
          {
            $match: {
              status: {
                $ne: 'CHECKED_IN',
              },
            },
          },
          {
            $count: 'notCheckedIn',
          },
        ],
      },
    },
    {
      $project: {
        totalCount: {
          $arrayElemAt: ['$totalCount', 0],
        },
        checkedIn: {
          $arrayElemAt: ['$checkedIn', 0],
        },
        notCheckedIn: {
          $arrayElemAt: ['$notCheckedIn', 0],
        },
      },
    },
    {
      $project: {
        totalCount: {
          $ifNull: ['$totalCount.totalCount', 0],
        },
        checkedIn: {
          $ifNull: ['$checkedIn.checkedIn', 0],
        },
        notCheckedIn: {
          $ifNull: ['$notCheckedIn.notCheckedIn', 0],
        },
      },
    },
  ])

  return result.flatMap(result => {
    if (result[0]) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return Result.success(() => result[0]!)
    } else {
      return Result.failure(
        () =>
          new ServerError(
            500,
            'Unable to get stats: received empty array from aggregation',
          ),
      )
    }
  })
}
