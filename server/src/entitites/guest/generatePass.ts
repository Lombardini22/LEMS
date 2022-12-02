import { PKPass } from 'passkit-generator'
import { Result } from '../../../../shared/Result'
import { ServerError } from '../../ServerError'
import fs from 'fs'
import path from 'path'
import { RequestHandler } from 'express'
import { Router } from '../../routing/Router'
import { Stream } from 'stream'
import { Path } from '../../routing/Path'

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

export async function generatePassStream(): Promise<
  Result<ServerError, Stream>
> {
  const pass = await Result.tryCatch(
    () =>
      PKPass.from({
        model: modelDirectory,
        certificates: { signerCert, signerKey, wwdr },
      }),
    error => new ServerError(500, 'Unable to generate pass', { error }),
  )

  return pass.flatMap(pass =>
    Result.tryCatch(
      () => pass.getAsStream(),
      error =>
        new ServerError(500, 'Unable to turn the pass into a stream', {
          error,
        }),
    ),
  )
}

export async function generatePassBuffer(): Promise<
  Result<ServerError, Buffer>
> {
  const pass = await Result.tryCatch(
    () =>
      PKPass.from({
        model: modelDirectory,
        certificates: { signerCert, signerKey, wwdr },
      }),
    error => new ServerError(500, 'Unable to generate pass', { error }),
  )

  return pass.flatMap(pass =>
    Result.tryCatch(
      () => pass.getAsBuffer(),
      error =>
        new ServerError(500, 'Unable to turn the pass into a buffer', {
          error,
        }),
    ),
  )
}

export const generatePass: RequestHandler<
  unknown,
  Promise<void>,
  unknown,
  unknown
> = async (_req, res) => {
  const passAsStream = await generatePassStream()

  await passAsStream.fold(
    function handleError(error) {
      Router.handleError(error, res)
    },
    function sendStream(stream) {
      stream.pipe(res)
    },
  )
}

export const generatePassBufferHandler: RequestHandler<
  unknown,
  Promise<void>,
  unknown,
  unknown
> = async (_req, res) => {
  const passAsBuffer = await generatePassBuffer()

  await passAsBuffer.fold(
    function handleError(error) {
      Router.handleError(error, res)
    },
    function sendBuffer(buffer: Buffer) {
      res.send(buffer as any)
    },
  )
}
