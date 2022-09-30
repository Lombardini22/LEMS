import { Result } from '../../shared/Result'
import { constVoid } from '../../shared/utils'
import { cron } from './cron'
import { upsertGuestsDatabase } from './entitites/guest/syncGuestsDatabase'

jest.useFakeTimers()

jest.mock('./entitites/guest/syncGuestsDatabase', () => ({
  upsertGuestsDatabase: jest.fn(() => Result.success(constVoid)),
}))

describe('cron', () => {
  it('should call upasertDatabase once every two hours', async () => {
    const next = jest.fn()
    const upsertGuestsDatabaseMock = upsertGuestsDatabase as jest.Mock

    jest.setSystemTime(new Date(2000, 0, 1, 9, 30))
    await cron(null, null, next)

    jest.setSystemTime(new Date(2000, 0, 1, 11, 29))
    await cron(null, null, next)

    expect(next).toHaveBeenCalledTimes(2)
    expect(upsertGuestsDatabaseMock).toHaveBeenCalledTimes(1)

    jest.setSystemTime(new Date(2000, 0, 1, 11, 31))
    await cron(null, null, next)

    expect(next).toHaveBeenCalledTimes(3)
    expect(upsertGuestsDatabaseMock).toHaveBeenCalledTimes(2)
  })
})
