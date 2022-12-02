import { PKPass } from 'passkit-generator'

import fs from 'fs'
import path from 'path'

import { Path } from '../../routing/Path'

const certificatesPath = 'server/src/entitites/guest/christmas-party.pass'

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

export const generatePass = async () => {
  try {
    const pass = new PKPass({
      "pass.json": Buffer.from(fs.readFileSync(path.join(process.cwd(), certificatesPath, 'pass.json'))),
    },
    {
      wwdr,
      signerCert,
      signerKey,
      
    },
    {
      // keys to be added or overridden
      serialNumber: "AAGH44625236dddaffbda",
    });

    // Adding some settings to be written inside pass.json
    pass.setBarcodes('36478105430') // Random value

    // Generate the stream .pkpass file stream
    // const stream = pass.getAsStream();
    // // doSomethingWithTheStream(stream);
    // fs.writeFileSync('stream.pkpass', stream.)

    // or

    const buffer = pass.getAsBuffer()
     fs.writeFileSync('buffer.pkpass', buffer, "binary")
    // const blob = new Blob([buffer], { type: "application/vnd.apple.pkpass" });
    console.log('buffer', buffer)
    console.log("buffer" )
  } catch (err) {
    console.error(err)
  }
}
