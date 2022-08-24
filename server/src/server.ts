import express from 'express'
import { withDatabase } from './database/withDatabase'
import dotenv from 'dotenv'

dotenv.config()

const port = process.env['SERVER_PORT']

if (!port) {
  throw new Error('Environment variable SERVER_PORT not found')
}

const app = express()

withDatabase(() => {
  app.get('/', (_, res) => res.send('Hello World!'))
  app.listen(port, () => console.log(`Server ready at port ${port}`))
})
