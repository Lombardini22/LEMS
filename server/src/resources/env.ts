import { config } from 'dotenv'
import { z, ZodError } from 'zod'
import { Result } from '../../../shared/Result'
import { ServerError } from '../ServerError'
import { Resource } from './Resource'

config(
  process.env['NODE_ENV'] === 'test'
    ? {
        path: '.env.testing',
      }
    : {},
)

const Env = z.object({
  BASIC_USERNAME: z.string(),
  BASIC_PASSWORD: z.string(),
  CLIENT_URL: z.string(),
  MAILCHIMP_API_KEY: z.string(),
  MAILCHIMP_DATABASE_LIST_ID: z.string(),
  MAILCHIMP_EVENT_LIST_ID: z.string(),
  MAILCHIMP_SERVER_PREFIX: z.string(),
  MONGO_DB_NAME: z.string(),
  MONGO_URI: z.string(),
  PORT: z.string(),
  VUE_APP_SERVER_URL: z.string(),
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
