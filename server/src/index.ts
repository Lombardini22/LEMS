import { withServer } from './withServer'
import { withEnv } from './withEnv'
import { withDatabase } from './database/withDatabase'

try {
  withDatabase(() =>
    withEnv(env =>
      withServer(app => {
        app.listen(env.SERVER_PORT, () =>
          console.log(`Server ready at port ${env.SERVER_PORT}`),
        )
      }),
    ),
  )
} catch (e) {
  // TODO: sensible exception handling here
  console.log(e)
}
