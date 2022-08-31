import { Db, MongoClient } from 'mongodb'
import { ServerError } from '../ServerError'
import { Resource } from './Resource'
import { env } from './env'
import { Result } from '../../../shared/Result'

if (process.env['NODE_ENV'] === 'test') {
  afterAll(async () => {
    await database.use(db => Result.success(() => db.dropDatabase()))
    await database.release()
  })
}

export const database = Resource.make<MongoClient, Db>(
  () =>
    env.use(env =>
      Result.tryCatch(
        () => new MongoClient(env.MONGO_URI).connect(),
        error =>
          new ServerError(500, 'Unable to connect to database', { error }),
      ),
    ),
  client =>
    Result.tryCatch(
      () => client.close(),
      error =>
        new ServerError(500, 'Unable to disconnect from database', { error }),
    ),
  client => env.use(env => Result.success(() => client.db(env.MONGO_DB_NAME))),
)
