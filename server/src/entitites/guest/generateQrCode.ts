import { RequestHandler } from 'express'
import { Path } from '../../routing/Path'
import { toFileStream } from 'qrcode'
import { Router } from '../../routing/Router'
import { PassThrough } from 'stream'
import { env } from '../../resources/env'
import { Result } from '../../../../shared/Result'
import { constVoid } from '../../../../shared/utils'
import { fetchGuest } from './utils/fetchGuest'
import { hashGuestEmail } from '../../../../shared/models/Guest'
import { mailchimpDatabaseListMemberToGuest } from './utils/mailchimpDatabaseListMemberToGuest'

type QrCodeParams = { email: string }

export const sendQrCodePath = Path.start()
  .literal('qr')
  .param<QrCodeParams>('email')

export const sendQrCode: RequestHandler<
  QrCodeParams,
  Promise<void>,
  unknown,
  unknown
> = (req, res) => {
  env.use(async env => {
    try {
      const emailHash = hashGuestEmail(req.params.email)

      const guest = await fetchGuest(
        emailHash,
        env.MAILCHIMP_DATABASE_LIST_ID,
        mailchimpDatabaseListMemberToGuest(emailHash),
      )

      await guest.fold(
        function handleError(error) {
          Router.handleError(error, res)
        },
        async function sendQRCodeStream() {
          const stream = new PassThrough()

          await toFileStream(stream, emailHash, {
            type: 'png',
            width: 200,
            margin: 1,
          })

          stream.pipe(res)
        },
      )

      return Result.success(constVoid)
    } catch (e) {
      console.log(e)
      throw new Error(`Errore!!!! - ${e}`)
    }
  })
}
