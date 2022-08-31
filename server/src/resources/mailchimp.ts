import mailchimpLib from '@mailchimp/mailchimp_marketing'
import { Result } from '../../../shared/Result'
import { constVoid } from '../../../shared/utils'
import { ServerError } from '../ServerError'
import { env } from './env'
import { Resource } from './Resource'

export const mailchimp = Resource.make<typeof mailchimpLib>(
  () =>
    env.use(async env => {
      mailchimpLib.setConfig({
        apiKey: env.MAILCHIMP_API_KEY,
        server: env.MAILCHIMP_SERVER_PREFIX,
      })

      const pingResult = await Result.tryCatch(
        // Straight out of the official guide, tested and working, clearly not typed
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        () => mailchimpLib.ping.get(),
        error =>
          new ServerError(500, 'Unable to connect to MailChimp', { error }),
      )

      return await pingResult.flatMap(result => {
        if (result.health_status === "Everything's Chimpy!") {
          return Result.success(() => mailchimpLib)
        } else {
          return Result.failure(
            () => new ServerError(500, 'Unable to ping MailChimp API'),
          )
        }
      })
    }),
  () => Result.success(constVoid),
)
