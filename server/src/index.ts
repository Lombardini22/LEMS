import { Result } from '../../shared/Result'
import { guestsRouter } from './entitites/guest/guestsRouter'
import { env } from './resources/env'
import { Server } from './resources/Server'

env.use(env =>
  Server.make()
    .withRouter(guestsRouter)
    .use(() =>
      Result.success(() =>
        console.log(`Server is listening to port ${env.PORT}`),
      ),
    ),
)
