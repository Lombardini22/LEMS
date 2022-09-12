import { RequestHandler } from 'express'
import { Path } from '../../routing/Path'
import { toFileStream } from 'qrcode'
import { guestsCollection } from './guestsCollection'
import { Router } from '../../routing/Router'
import { PassThrough } from 'stream'
import { env } from '../../resources/env'
import { Result } from '../../../../shared/Result'
import { constVoid } from '../../../../shared/utils'

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
    const guest = await guestsCollection.findOne({
      email: req.params.email,
    })

    await guest.fold(
      error => {
        Router.handleError(error, res)
      },
      async () => {
        const stream = new PassThrough()

        await toFileStream(stream, env.CLIENT_URL, {
          type: 'png',
          width: 200,
          margin: 1,
        })

        stream.pipe(res)
      },
    )

    return Result.success(constVoid)
  })
}
