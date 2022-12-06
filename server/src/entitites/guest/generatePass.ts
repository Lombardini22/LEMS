import { PKPass } from 'passkit-generator'
import { Result } from '../../../../shared/Result'
import { ServerError } from '../../ServerError'
import fs from 'fs'
import path from 'path'
import { RequestHandler } from 'express'
import { Router } from '../../routing/Router'
import { Stream } from 'stream'
import { Path } from '../../routing/Path'
import { hashGuestEmail } from '../../../../shared/models/Guest'
import { guestsCollection } from './guestsCollection'

const certificatesPath = 'server/src/entitites/guest/christmas-party.pass'
const modelDirectory = path.join(process.cwd(), certificatesPath)

const signerCert = fs.readFileSync(
  path.join(process.cwd(), certificatesPath, 'signerCert.pem'),
)

const signerKey = fs.readFileSync(
  path.join(process.cwd(), certificatesPath, 'lems.key'),
)

const wwdr = fs.readFileSync(
  path.join(process.cwd(), certificatesPath, 'wwdr.pem'),
)

type PassParams = { email: string }

export const generatePassPath = Path.start()
  .literal('pass')
  .param<PassParams>('email')

export async function generatePassStream(
  emailHash: string,
): Promise<Result<ServerError, Stream>> {
  const pass = await Result.tryCatch(
    () =>
      PKPass.from(
        {
          model: modelDirectory,
          certificates: { signerCert, signerKey, wwdr },
        },
        {
          serialNumber: emailHash,
        },
      ),
    error => new ServerError(500, 'Unable to generate pass', { error }),
  )

  return pass.flatMap(pass =>
    Result.tryCatch(
      () => {
        pass.setBarcodes({
          message: emailHash,
          format: 'PKBarcodeFormatQR',
          messageEncoding: 'iso-8859-1',
        })

        return pass.getAsStream()
      },
      error =>
        new ServerError(500, 'Unable to turn the pass into a stream', {
          error,
        }),
    ),
  )
}

export const generatePass: RequestHandler<
  PassParams,
  Promise<void>,
  unknown,
  unknown
> = async (req, res) => {
  const email = req.params.email
  const emailHash = hashGuestEmail(email)
  const guest = await guestsCollection.findOne({ emailHash })

  const result = await guest.flatMap(function rejectWaitingListOrGenerateStream(
    guest,
  ) {
    if (guest.status === 'WAITING') {
      return Result.failure(
        () => new ServerError(400, 'Guest is in waiting list'),
      )
    } else {
      return generatePassStream(emailHash)
    }
  })

  await result.fold(
    function handleError(error) {
      Router.handleError(error, res)
    },
    function sendStream(stream) {
      res
        .header('Content-Type', 'application/vnd.apple.pkpass')
        .header(
          'Content-Disposition',
          'attachment; filename="l22-christmas-party.pkpass"',
        )

      stream.pipe(res)
    },
  )
}
