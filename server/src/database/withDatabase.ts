import { MongoClient, Db } from 'mongodb'
import { ServerError } from '../ServerError'
import { withEnv } from '../withEnv'

let client: MongoClient | null = null

export async function withDatabase<T>(
  op: (db: Db) => T,
): Promise<[result: T, release: () => Promise<void>]> {
  return await withEnv(async env => {
    if (!client) {
      try {
        client = client || (await new MongoClient(env.MONGO_URI).connect())
      } catch (e) {
        throw new ServerError(500, 'Unable to connect to database')
      }
    }

    const result = await op(client.db(env.MONGO_DB_NAME))

    const release = async () => {
      try {
        // client will always be non-null as it's assigned above
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        await client!.close()
      } catch (e) {
        throw new ServerError(500, 'Unable to disconnect from database', e)
      }
    }

    return [result, release]
  })
}
