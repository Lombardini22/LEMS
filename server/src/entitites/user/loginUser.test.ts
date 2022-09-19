import { expectResult } from '../../../../shared/testUtils'
import { env } from '../../resources/env'
import { ServerError } from '../../ServerError'
import { expectT } from '../../testUtils'
import { loginUser } from './loginUser'

describe('loginUser', () => {
  it('should work', () =>
    env.use(async env => {
      const result = await loginUser({
        params: {},
        query: {},
        body: {
          username: env.BASIC_USERNAME,
          password: env.BASIC_PASSWORD,
        },
      })

      expectResult(result).toHaveSucceeded()

      const token = result.unsafeGetValue().accessToken
      const credentials = Buffer.from(token, 'base64').toString('utf8')

      expectT(credentials).toEqual(
        `${env.BASIC_USERNAME}:${env.BASIC_PASSWORD}`,
      )

      return result
    }))

  it('should fail if credentials are invalid', async () => {
    const result = await loginUser({
      params: {},
      query: {},
      body: {
        username: 'jfhakdhkagdkfdskjh',
        password: 'jksdgfkajdgkgadskk',
      },
    })

    expectResult(result).toHaveFailedWith(
      new ServerError(401, 'Invalid credentials'),
    )
  })
})
