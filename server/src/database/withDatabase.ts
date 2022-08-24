import { MongoClient, Db } from 'mongodb'
import { ServerError } from '../ServerError'
import { withEnv } from '../withEnv'

let client: MongoClient | null = null

export async function withDatabase<T>(op: (db: Db) => T): Promise<T> {
  return await withEnv(async env => {
    if (!client) {
      try {
        client = client || (await new MongoClient(env.MONGO_URI).connect())
      } catch (e) {
        throw new ServerError(500, 'Unable to connect to database')
      }
    }

    const result = await op(client.db(env.MONGO_DB_NAME))

    try {
      if (process.env['NODE_ENV'] === 'test') {
        await client.close()
        client = null
      }
    } catch (e) {
      throw new ServerError(500, 'Unable to disconnect from database')
    }

    return result
  })
}
