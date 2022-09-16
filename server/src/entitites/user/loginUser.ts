import { Result } from '../../../../shared/Result'
import { env } from '../../resources/env'
import { Path } from '../../routing/Path'
import { Request } from '../../routing/Router'
import { ServerError } from '../../ServerError'

export const loginUserPath = Path.start().literal('login')

interface LoginUserData {
  username: string
  password: string
}

interface LoginUserResponse {
  accessToken: string
}

export function loginUser(
  req: Request<unknown, unknown, LoginUserData>,
): Promise<Result<ServerError, LoginUserResponse>> {
  return env.use(env => {
    if (
      req.body.username === env.BASIC_USERNAME &&
      req.body.password === env.BASIC_PASSWORD
    ) {
      return Result.success(() => ({
        accessToken: Buffer.from(
          `${req.body.username}:${req.body.password}`,
        ).toString('base64'),
      }))
    } else {
      return Result.failure(() => new ServerError(401, 'Invalid credentials'))
    }
  })
}
