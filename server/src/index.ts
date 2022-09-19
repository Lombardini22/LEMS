import { Result } from '../../shared/Result'
import { guestsRouter } from './entitites/guest/guestsRouter'
import { usersRouter } from './entitites/user/usersRouter'
import { env } from './resources/env'
import { Server } from './resources/Server'

env
  .use(env =>
    Server.make()
      .withRouter(guestsRouter)
      .withRouter(usersRouter)
      .use(() =>
        Result.success(() =>
          console.log(`Server is listening to port ${env.PORT}`),
        ),
      ),
  )
  .then(result => {
    if (result.isFailure()) {
      console.log(result.unsafeGetError())
    }
  })
