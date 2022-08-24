import express from 'express'

const app = express()

app.get('/', (_, res) => res.send('Hello World!'))

export function withServer<T>(op: (app: express.Express) => T): T {
  return op(app)
}
