import express, { Router as ExpressRouter, ErrorRequestHandler } from 'express'
import cors from 'cors'
import { Result } from '../../../shared/Result'
import { env } from './env'
import { Router } from '../routing/Router'
import { ServerError } from '../ServerError'
import { Server as HttpServer } from 'http'
import { constVoid } from '../../../shared/utils'
import { Resource } from './Resource'
import { cron } from '../cron'

export class Server extends Resource<express.Express> {
  private readonly routers: Router[]
  private server: HttpServer | null = null

  protected constructor(routers: Router[]) {
    const acquire = async (): Promise<Result<ServerError, express.Express>> => {
      const app = express()
        .use(express.json())
        .use(express.urlencoded({ extended: true }))
        .use(
          cors(
            process.env['NODE_ENV'] === 'production'
              ? {
                  origin: [
                    'https://iscrizioni.foresightmilano.it/',
                    'https://lems-staging.herokuapp.com/',
                  ],
                }
              : {},
          ),
        )
        .use(cron)

      const apiRouter = this.routers
        .reduce(
          (apiRouter, router) => router.attachTo(apiRouter),
          ExpressRouter(),
        )
        .use(Server.errorHandler)

      app.use('/api', apiRouter)
      app.use('/', express.static(`${process.cwd()}/dist`))
      app.use('*', express.static(`${process.cwd()}/dist/index.html`))

      const result = await env.use(env => {
        if (!this.server) {
          this.server = app.listen(env.PORT)
        }

        return Result.success(() => app)
      })

      if (result.isSuccess()) {
        return result
      } else {
        throw result.unsafeGetError()
      }
    }

    const release = (): Promise<Result<ServerError, void>> => {
      if (this.server) {
        this.server.close()
        this.server = null
      }

      return Result.success(constVoid)
    }

    super(acquire, release)
    this.routers = routers
  }

  static override make(): Server {
    return new Server([])
  }

  withRouter(router: Router): Server {
    return new Server([...this.routers, router])
  }

  private static errorHandler: ErrorRequestHandler = (error, _, res, next) => {
    if (error) {
      return Router.handleError(error, res)
    } else {
      return next()
    }
  }
}
