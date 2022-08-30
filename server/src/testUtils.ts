import { Result } from '../../shared/Result'
import { env } from './resources/env'
import { ServerError } from './ServerError'
import http from 'http'
import express from 'express'

export function expectT<A>(obtained: A) {
  return {
    toEqual: (expected: A) => {
      return expect(obtained).toEqual(expected)
    },
  }
}

interface Response<T> {
  status: number
  data: T
}

export async function sendHttpRequest<O>(
  app: express.Express,
  method: 'GET' | 'DELETE',
  path: string,
): Promise<Result<ServerError, Response<O>>>
export async function sendHttpRequest<I, O>(
  app: express.Express,
  method: 'POST' | 'PUT',
  path: string,
  body: I,
): Promise<Result<ServerError, Response<O>>>
export async function sendHttpRequest<O>(
  app: express.Express,
  method = 'GET',
  path: string,
  body = {},
): Promise<Result<ServerError, Response<O>>> {
  const hasData = (method === 'POST' || method === 'PUT') && body
  const data = hasData ? JSON.stringify(body) : null

  return env.use(
    env =>
      new Promise(done => {
        const server = app.listen(env.SERVER_PORT)

        const request = http.request(
          {
            method,
            host: 'localhost',
            port: env.SERVER_PORT,
            path,
            headers: data
              ? {
                  'Content-Type': 'application/json',
                  'Content-Length': data.length,
                }
              : {},
          },
          response => {
            const status = response.statusCode || 500
            let data = ''

            response.on('data', chunk => {
              data += chunk
            })

            response.on('end', () => {
              server.close()

              Result.tryCatch(
                () => JSON.parse(data),
                () => new ServerError(status, 'JSON parsing error'),
              )
                .then(result => result.map(data => ({ status, data })))
                .then(done)
            })
          },
        )

        request.on('error', () => {
          server.close()

          Result.failure(() => new ServerError(500, 'HTTP request error')).then(
            done,
          )
        })

        if (data) {
          request.write(data)
        }

        request.end()
      }),
  )
}
