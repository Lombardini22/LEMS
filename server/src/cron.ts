import { NextFunction } from 'express'
import { Result } from '../../shared/Result'
import { constVoid } from '../../shared/utils'
import { upsertGuestsDatabase } from './entitites/guest/syncGuestsDatabase'
import { env } from './resources/env'

interface CronState {
  upsertLastRun: Date
}

let cronState: CronState | null

export async function cron(
  _req: any,
  _res: any,
  next: NextFunction,
): Promise<void> {
  await env.use(async env => {
    const lastUpsertTimeMs = cronState?.upsertLastRun.getTime() ?? 0
    const timeSinceLastUpsert = Date.now() - lastUpsertTimeMs

    if (timeSinceLastUpsert > 1000 * 60 * 60 * 2) {
      await upsertGuestsDatabase({
        params: {},
        query: {},
        body: { secret: env.SYNC_SECRET },
      })

      cronState = {
        ...(cronState || {}),
        upsertLastRun: new Date(),
      }
    }

    return Result.success(constVoid)
  })

  return next()
}
