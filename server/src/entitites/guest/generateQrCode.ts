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
        env.MAILCHIMP_EVENT_LIST_ID,
        member => ({
          firstName: member.merge_fields['FNAME'],
          lastName: member.merge_fields['LNAME'],
          email: member.email_address,
          emailHash,
          companyName: member.merge_fields['MMERGE4'] || null,
          source: 'RSVP',
          status: 'RSVP',
          accountManager: null,
        }),

      )

      await guest.fold(
        error => {
          Router.handleError(error, res)
        },
        async () => {
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
