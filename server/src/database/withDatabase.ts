import { MongoClient, Db } from 'mongodb'

let db: Db | null = null

export async function withDatabase<T>(op: (db: Db) => T): Promise<T> {
  try {
    db = db || (await getDatabase())
  } catch (_) {
    throw new Error('Unable to connect to database')
  }

  return op(db)
}

async function getDatabase(): Promise<Db> {
  const dbUri = process.env['MONGO_URI']
  const dbName = process.env['MONGO_DB_NAME']

  if (!dbUri) {
    throw new Error('Environment variable MONGO_URI not found')
  }

  if (!dbName) {
    throw new Error('Environment variable MONGO_DB_NAME not found')
  }

  const res = new MongoClient(dbUri)
  await res.connect()
  return res.db(dbName)
}
