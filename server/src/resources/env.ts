import { config } from 'dotenv'
import { z, ZodError } from 'zod'
import { ServerError } from '../ServerError'
import { Resource } from './Resource'

config()

const Env = z.object({
  SERVER_PORT: z.string(),
  MONGO_URI: z.string(),
  MONGO_DB_NAME: z.string(),
})
type Env = z.infer<typeof Env>

export const env = Resource.make(async () => {
  try {
    return Env.parse(process.env)
  } catch (e) {
    throw new ServerError(
      500,
      'Invalid environment file',
      (e as ZodError).message,
    )
  }
}, Promise.resolve)
