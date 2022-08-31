import { Result } from '../../../shared/Result'
import { expectResult } from '../../../shared/testUtils'
import { Path } from '../routing/Path'
import { Router } from '../routing/Router'
import { sendHttpRequest } from '../testUtils'
import { Server } from './Server'

describe('Server', () => {
  it('should work', async () => {
    type Data = {
      test: boolean
    }

    const router = Router.make('/')
      .get<Data, any, any>(Path.start().literal('get'), () =>
        Result.success(() => ({
          test: true,
        })),
      )
      .post(Path.start().literal('post'), req => Result.success(() => req.body))

    const server = Server.make().withRouter(router)

    await Promise.all([
      server.use(async () => {
        const getResult = await sendHttpRequest<Data>('GET', '/get')
        await server.release()

        return expectResult(
          await getResult.map(_ => _.data),
        ).toHaveSucceededWith({ test: true })
      }),

      server.use(async () => {
        type Body = {
          message: string
        }

        const getResult = await sendHttpRequest<Body, Body>('POST', '/post', {
          message: 'Hello!',
        })
        await server.release()

        return expectResult(
          await getResult.map(_ => _.data),
        ).toHaveSucceededWith({ message: 'Hello!' })
      }),
    ])
  })
})
