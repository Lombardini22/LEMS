import { Result } from '../../shared/Result'
import { guestsRouter } from './entitites/guest/guestsRouter'
import { Server } from './resources/Server'

Server.make()
  .withRouter(guestsRouter)
  .use(() => Result.success(() => console.log('Server is ready')))
