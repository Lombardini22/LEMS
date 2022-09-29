import express, {
  Router as ExpressRouter,
  Request as ExpressRequest,
  Response,
  RequestHandler,
} from 'express'
import { Result } from '../../../shared/Result'
import { ServerError } from '../ServerError'
import { Path } from './Path'

type RouterMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

export interface Request<Params = unknown, Query = unknown, Body = unknown> {
  params: Params
  query: Query
  body: Body
}

interface RestfulHandler<
  Params = unknown,
  Query = unknown,
  Body = unknown,
  Output = unknown,
> {
  readonly _tag: 'Restful'
  method: RouterMethod
  path: Path<Params>
  handler: (
    req: Request<Params, Query, Body>,
  ) => Promise<Result<ServerError, Output>>
}

interface CustomHandler<Params = unknown, Query = unknown, Body = unknown> {
  readonly _tag: 'Custom'
  method: RouterMethod
  path: Path
  handler: RequestHandler<Params, Promise<void>, Body, Query>
}

type RouterHandler<
  Params = unknown,
  Query = unknown,
  Body = unknown,
  Output = unknown,
> =
  | RestfulHandler<Params, Query, Body, Output>
  | CustomHandler<Params, Query, Body>

export class Router {
  private readonly path: string
  private readonly handlers: RouterHandler[]

  private constructor(
    path: string,
    handlers: RouterHandler<any, any, any, any>[],
  ) {
    this.path = path
    this.handlers = handlers
  }

  static make(path: string) {
    return new Router(path, [])
  }

  get<Output, P extends Path<never, never>>(
    path: P,
    handler: (
      req: Request<
        P extends Path<infer Params> ? Params : never,
        P extends Path<any, infer Query> ? Query : never,
        unknown
      >,
    ) => Promise<Result<ServerError, Output>>,
  ): Router {
    const newHandler: RouterHandler<
      P extends Path<infer Params> ? Params : never,
      P extends Path<any, infer Query> ? Query : never,
      unknown,
      Output
    > = {
      _tag: 'Restful',
      method: 'GET',
      path,
      handler,
    }

    return new Router(this.path, [...this.handlers, newHandler])
  }

  post<Output, Body, P extends Path<unknown>>(
    path: P,
    handler: (
      req: Request<
        P extends Path<infer Params> ? Params : never,
        P extends Path<any, infer Query> ? Query : never,
        Body
      >,
    ) => Promise<Result<ServerError, Output>>,
  ): Router {
    const newHandler: RouterHandler<
      P extends Path<infer Params> ? Params : never,
      P extends Path<any, infer Query> ? Query : never,
      Body,
      Output
    > = {
      _tag: 'Restful',
      method: 'POST',
      path,
      handler,
    }

    return new Router(this.path, [...this.handlers, newHandler])
  }

  put<Output, Body, P extends Path<unknown>>(
    path: P,
    handler: (
      req: Request<
        P extends Path<infer Params> ? Params : never,
        P extends Path<any, infer Query> ? Query : never,
        Body
      >,
    ) => Promise<Result<ServerError, Output>>,
  ): Router {
    const newHandler: RouterHandler<
      P extends Path<infer Params> ? Params : never,
      P extends Path<any, infer Query> ? Query : never,
      Body,
      Output
    > = {
      _tag: 'Restful',
      method: 'PUT',
      path,
      handler,
    }

    return new Router(this.path, [...this.handlers, newHandler])
  }

  delete<Output, P extends Path<unknown>>(
    path: P,
    handler: (
      req: Request<
        P extends Path<infer Params> ? Params : never,
        P extends Path<any, infer Query> ? Query : never,
        unknown
      >,
    ) => Promise<Result<ServerError, Output>>,
  ): Router {
    const newHandler: RouterHandler<
      P extends Path<infer Params> ? Params : never,
      P extends Path<any, infer Query> ? Query : never,
      unknown,
      Output
    > = {
      _tag: 'Restful',
      method: 'DELETE',
      path,
      handler,
    }

    return new Router(this.path, [...this.handlers, newHandler])
  }

  custom<Body, P extends Path<unknown>>(
    method: RouterMethod,
    path: P,
    handler: RequestHandler<
      P extends Path<infer Params> ? Params : never,
      Promise<void>,
      P extends Path<any, infer Query> ? Query : never,
      Body
    >,
  ): Router {
    const newHandler: CustomHandler<
      P extends Path<infer Params> ? Params : never,
      Body,
      P extends Path<any, infer Query> ? Query : never
    > = { _tag: 'Custom', method, path, handler }

    return new Router(this.path, [...this.handlers, newHandler])
  }

  attachTo(app: express.Express): express.Express
  attachTo(router: ExpressRouter): ExpressRouter
  attachTo(
    source: express.Express | ExpressRouter,
  ): express.Express | ExpressRouter {
    const withHandlers = this.handlers.reduce((app, handler) => {
      const path = handler.path.toString()

      switch (handler._tag) {
        case 'Restful': {
          const handlerFn = async (req: ExpressRequest, res: Response) => {
            try {
              const result = await handler.handler(req)

              return result.fold(
                error => Router.handleError(error, res),
                value => res.json(value),
              )
            } catch (error) {
              return Router.handleError(error as Error, res)
            }
          }

          switch (handler.method) {
            case 'GET':
              return app.get(path, handlerFn)
            case 'POST':
              return app.post(path, handlerFn)
            case 'PUT':
              return app.put(path, handlerFn)
            case 'DELETE':
              return app.delete(path, handlerFn)
          }

          break
        }
        case 'Custom': {
          switch (handler.method) {
            case 'GET':
              return app.get(path, handler.handler)
            case 'POST':
              return app.post(path, handler.handler)
            case 'PUT':
              return app.put(path, handler.handler)
            case 'DELETE':
              return app.delete(path, handler.handler)
          }
        }
      }
    }, ExpressRouter())

    return source.use(this.path, withHandlers as express.Express)
  }

  static handleError(error: Error, res: Response): Response {
    const isTesting = process.env['NODE_ENV'] === 'test'

    if (error instanceof ServerError) {
      if (error.status === 500) {
        if (!isTesting) {
          console.log(error.message)
          console.log(error.extra)
        }
        
        return res.status(500).end()
      } else {
        if (!isTesting) {
          console.log(error.message)
          console.log(error.extra)
        }

        return res.status(error.status).json({ error: error.message })
      }
    } else {
      !isTesting && console.log(error)
      return res.status(500).end()
    }
  }
}
