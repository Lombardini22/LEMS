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

interface RouterHandler<
  Params = unknown,
  Query = unknown,
  Body = unknown,
  Output = unknown,
> {
  method: RouterMethod
  path: Path<Params>
  handler: (
    req: Request<Params, Query, Body>,
  ) => Promise<Result<ServerError, Output>>
}

interface CustomHandler<Params = unknown, Query = unknown, Body = unknown> {
  method: RouterMethod
  path: Path
  handler: RequestHandler<Params, Promise<void>, Body, Query>
}

export class Router {
  private readonly path: string
  private readonly restfulHandlers: RouterHandler[]
  private readonly customHandlers: CustomHandler[]

  private constructor(
    path: string,
    restfulHandlers: RouterHandler<any, any, any, any>[],
    customHandlers: CustomHandler<any, any, any>[],
  ) {
    this.path = path
    this.restfulHandlers = restfulHandlers
    this.customHandlers = customHandlers
  }

  static make(path: string) {
    return new Router(path, [], [])
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
      method: 'GET',
      path,
      handler,
    }

    return new Router(
      this.path,
      [...this.restfulHandlers, newHandler],
      this.customHandlers,
    )
  }

  post<Output, Body, P extends Path<unknown>>(
    path: P,
    handler: (
      req: Request<
        P extends Path<infer Params> ? Params : never,
        unknown,
        Body
      >,
    ) => Promise<Result<ServerError, Output>>,
  ): Router {
    const newHandler: RouterHandler<
      P extends Path<infer Params> ? Params : never,
      unknown,
      Body,
      Output
    > = {
      method: 'POST',
      path,
      handler,
    }

    return new Router(
      this.path,
      [...this.restfulHandlers, newHandler],
      this.customHandlers,
    )
  }

  put<Output, Body, P extends Path<unknown>>(
    path: P,
    handler: (
      req: Request<
        P extends Path<infer Params> ? Params : never,
        unknown,
        Body
      >,
    ) => Promise<Result<ServerError, Output>>,
  ): Router {
    const newHandler: RouterHandler<
      P extends Path<infer Params> ? Params : never,
      unknown,
      Body,
      Output
    > = {
      method: 'PUT',
      path,
      handler,
    }

    return new Router(
      this.path,
      [...this.restfulHandlers, newHandler],
      this.customHandlers,
    )
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
      method: 'DELETE',
      path,
      handler,
    }

    return new Router(
      this.path,
      [...this.restfulHandlers, newHandler],
      this.customHandlers,
    )
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
    > = { method, path, handler }

    return new Router(this.path, this.restfulHandlers, [
      ...this.customHandlers,
      newHandler,
    ])
  }

  attachTo(app: express.Express): express.Express {
    const withRestfulHandlers = this.restfulHandlers.reduce((app, handler) => {
      const path = handler.path.toString()

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
    }, ExpressRouter())

    const withCustomHandlers = this.customHandlers.reduce((res, handler) => {
      const path = handler.path.toString()

      switch (handler.method) {
        case 'GET':
          return res.get(path, handler.handler)
        case 'POST':
          return res.post(path, handler.handler)
        case 'PUT':
          return res.put(path, handler.handler)
        case 'DELETE':
          return res.delete(path, handler.handler)
      }
    }, withRestfulHandlers)

    return app.use(this.path, withCustomHandlers)
  }

  static handleError(error: Error, res: Response): Response {
    const isTesting = process.env['NODE_ENV'] === 'test'

    if (error instanceof ServerError) {
      if (error.status === 500) {
        // TODO: send extras to LogTail or something
        !isTesting && console.log(error.extra)
        return res.status(500).end()
      } else {
        // TODO: send extras to LogTail or something
        !isTesting && console.log(error.extra)
        return res.status(error.status).json({ error: error.message })
      }
    } else {
      // TODO: send error message to LogTail or something
      !isTesting && console.log(error)
      return res.status(500).end()
    }
  }
}
