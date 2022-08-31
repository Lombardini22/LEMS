import express, { Router as ExpressRouter, Request, Response } from 'express'
import { Result } from '../../../shared/Result'
import { ServerError } from '../ServerError'
import { Path } from './Path'

type RouterMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

interface RouterRequest<Params = unknown, Query = unknown, Body = unknown> {
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
    req: RouterRequest<Params, Query, Body>,
  ) => Promise<Result<ServerError, Output>>
}

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

  get<Output, Query extends Record<string, string>, P extends Path<never>>(
    path: P,
    handler: (
      req: RouterRequest<
        P extends Path<infer Params> ? Params : never,
        Query,
        unknown
      >,
    ) => Promise<Result<ServerError, Output>>,
  ) {
    const newHandler: RouterHandler<
      P extends Path<infer Params> ? Params : never,
      Query,
      unknown,
      Output
    > = {
      method: 'GET',
      path,
      handler,
    }

    return new Router(this.path, [...this.handlers, newHandler])
  }

  post<Output, Body, P extends Path<never>>(
    path: P,
    handler: (
      req: RouterRequest<
        P extends Path<infer Params> ? Params : never,
        unknown,
        Body
      >,
    ) => Promise<Result<ServerError, Output>>,
  ) {
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

    return new Router(this.path, [...this.handlers, newHandler])
  }

  put<Output, Body, P extends Path<never>>(
    path: P,
    handler: (
      req: RouterRequest<
        P extends Path<infer Params> ? Params : never,
        unknown,
        Body
      >,
    ) => Promise<Result<ServerError, Output>>,
  ) {
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

    return new Router(this.path, [...this.handlers, newHandler])
  }

  delete<Output, Query, P extends Path<never>>(
    path: P,
    handler: (
      req: RouterRequest<
        P extends Path<infer Params> ? Params : never,
        Query,
        unknown
      >,
    ) => Promise<Result<ServerError, Output>>,
  ) {
    const newHandler: RouterHandler<
      P extends Path<infer Params> ? Params : never,
      Query,
      unknown,
      Output
    > = {
      method: 'DELETE',
      path,
      handler,
    }

    return new Router(this.path, [...this.handlers, newHandler])
  }

  attachTo(app: express.Express): express.Express {
    const expressRouter = this.handlers.reduce((app, handler) => {
      const path = handler.path.toString()

      const handlerFn = async (req: Request, res: Response) => {
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

    return app.use(this.path, expressRouter)
  }

  static handleError(error: Error, res: Response): Response {
    if (error instanceof ServerError) {
      if (error.status === 500) {
        // TODO: send extras to LogTail or something
        return res.status(500).end()
      } else {
        // TODO: send extras to LogTail or something
        return res.status(error.status).json({ error: error.message })
      }
    } else {
      // TODO: send error message to LogTail or something
      return res.status(500).end()
    }
  }
}
