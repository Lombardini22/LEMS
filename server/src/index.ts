import { env } from './resources/env'
import { useServer } from './server'

try {
  env.use(env =>
    Promise.resolve(
      useServer(app => {
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
