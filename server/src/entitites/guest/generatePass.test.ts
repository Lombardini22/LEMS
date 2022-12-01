import { generatePassStream } from './generatePass'

describe('generatePass', () => {
  it('should work', async () => {
    const result = await generatePassStream()

    if (result.isSuccess()) {
      console.log("Looks like it's working so far")
    } else {
      console.log(result.unsafeGetError().extra)
    }
  })
})
