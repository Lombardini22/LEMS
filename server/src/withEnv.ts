import { config } from 'dotenv'
import { z, ZodError } from 'zod'
import { ServerError } from './ServerError'

config()

const Env = z.object({
  SERVER_PORT: z.string(),
  MONGO_URI: z.string(),
  MONGO_DB_NAME: z.string(),
})
type Env = z.infer<typeof Env>

let env: Env | null = null

export function withEnv<T>(op: (env: Env) => T): T {
  if (env) {
    return op(env)
  }

  try {
    env = Env.parse(process.env)
    return op(env)
  } catch (e) {
    throw new ServerError(
      500,
      'Invalid environment file',
      (e as ZodError).message,
    )
  }
}
