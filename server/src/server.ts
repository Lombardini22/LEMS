import express from 'express'

const app = express()

app.get('/', (_, res) => res.send('Hello World!'))

export function useServer<T>(op: (app: express.Express) => T): T {
  return op(app)
}
