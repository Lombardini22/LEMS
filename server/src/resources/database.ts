import { Db, MongoClient } from 'mongodb'
import { ServerError } from '../ServerError'
import { Resource } from './Resource'
import { env } from './env'
import { Result } from '../../../shared/Result'

export const database = Resource.make<MongoClient, Db>(
  () =>
    env.use(env =>
      Result.asyncTryCatch(
        () => new MongoClient(env.MONGO_URI).connect(),
        error =>
          new ServerError(500, 'Unable to connect to database', { error }),
      ),
    ),
  client =>
    Result.asyncTryCatch(
      () => client.close(),
      error =>
        new ServerError(500, 'Unable to disconnect from database', { error }),
    ),
  client => env.use(env => Result.asyncSuccess(client.db(env.MONGO_DB_NAME))),
)
