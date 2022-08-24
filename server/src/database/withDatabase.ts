import { MongoClient, Db } from 'mongodb'
import { withEnv } from '../withEnv'

let client: MongoClient | null = null

export async function withDatabase(op: (db: Db) => unknown): Promise<void> {
  return await withEnv(async env => {
    try {
      client = await getClient()
    } catch (_) {
      throw new Error('Unable to connect to database')
    }

    // Null check is done before this function can even run
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    await op(client.db(env.MONGO_DB_NAME))
    await client.close()
  })
}

async function getClient(): Promise<MongoClient> {
  return await withEnv(async env => {
    // Null check is done before this function can even run
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const res = new MongoClient(env.MONGO_URI)
    await res.connect()
    return res
  })
}
