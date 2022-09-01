import { config } from 'dotenv'
import { z, ZodError } from 'zod'
import { Result } from '../../../shared/Result'
import { ServerError } from '../ServerError'
import { Resource } from './Resource'

config()

const Env = z.object({
  SERVER_PORT: z.string(),
  MONGO_URI: z.string(),
  MONGO_DB_NAME: z.string(),
  MAILCHIMP_API_KEY: z.string(),
  MAILCHIMP_SERVER_PREFIX: z.string(),
})
type Env = z.infer<typeof Env>

export const env = Resource.make(
  () =>
    Result.tryCatch(
      () => Env.parse(process.env),
      e =>
        new ServerError(
          500,
          'Invalid environment file',
          (e as ZodError).message,
        ),
    ),
  Promise.resolve,
)
