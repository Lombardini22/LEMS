import { Db, MongoClient } from 'mongodb'
import { ServerError } from '../ServerError'
import { Resource } from './Resource'
import { env } from './env'

export const database = Resource.make<MongoClient, Db>(
  () =>
    env.use(async env => {
      try {
        return await new MongoClient(env.MONGO_URI).connect()
      } catch (e) {
        throw new ServerError(500, 'Unable to connect to database', e)
      }
    }),
  async client => {
    try {
      await client.close()
    } catch (e) {
      throw new ServerError(500, 'Unable to disconnect from database', e)
    }
  },
  client => env.use(env => Promise.resolve(client.db(env.MONGO_DB_NAME))),
)
