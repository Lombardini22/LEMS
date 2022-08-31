import { Result } from '../../shared/Result'
import { Server } from './resources/Server'
import { Path } from './routing/Path'
import { Router } from './routing/Router'

const tmpRouter = Router.make('/').get(Path.start(), () =>
  Result.success(() => ({ message: 'Hello World!' })),
)

Server.make()
  .withRouter(tmpRouter)
  .use(() => Result.success(() => console.log('Server is ready')))
