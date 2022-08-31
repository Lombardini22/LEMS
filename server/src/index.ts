import { Result } from '../../shared/Result'
import { guestsRouter } from './guests/guestsRouter'
import { Server } from './resources/Server'

Server.make()
  .withRouter(guestsRouter)
  .use(() => Result.success(() => console.log('Server is ready')))
