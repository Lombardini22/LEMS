import express, { ErrorRequestHandler } from 'express'
import { Result } from '../../../shared/Result'
import { env } from './env'
import { Router } from '../routing/Router'
import { ServerError } from '../ServerError'
import { Server as HttpServer } from 'http'
import { constVoid } from '../../../shared/utils'
import { Resource } from './Resource'

export class Server extends Resource<express.Express> {
  private readonly routers: Router[]
  private server: HttpServer | null = null

  protected constructor(routers: Router[]) {
    const acquire = async (): Promise<Result<ServerError, express.Express>> => {
      const app = express()
        .use(express.json())
        .use(express.urlencoded({ extended: true }))

      const appWithRouters = this.routers
        .reduce((app, router) => router.attachTo(app), app)
        .use(Server.errorHandler)

      const result = await env.use(env => {
        if (!this.server) {
          this.server = appWithRouters.listen(env.SERVER_PORT)
        }

        return Result.success(() => appWithRouters)
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
