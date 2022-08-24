import { config } from 'dotenv'
import { z, ZodError } from 'zod'

config()

const Env = z.object({
  SERVER_PORT: z.string(),
  MONGO_URI: z.string(),
  MONGO_DB_NAME: z.string(),
})
type Env = z.infer<typeof Env>

let env: Env | null

export function withEnv<T>(op: (env: Env) => T): T {
  if (!env) {
    try {
      env = Env.parse(process.env)
    } catch (e) {
      console.log('Invalid environment file')
      console.log((e as ZodError).message)
      throw new Error('Invalid environment file: information above')
    }
  }

  return op(env)
}
