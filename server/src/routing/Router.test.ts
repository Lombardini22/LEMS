import { Result } from '../../../shared/Result'
import { Path } from './Path'
import { Router } from './Router'
import express from 'express'
import { expectResult } from '../../../shared/testUtils'
import { sendHttpRequest } from '../testUtils'
import { ServerError } from '../ServerError'

type Params = {
  test: string
}

interface Output {
  test: string
  count: number
}

type Data = {
  count: string
}

describe('Router', () => {
  it('should handle get requests', async () => {
    const path = Path.start().literal('get').param<Params>('test')

    const router = Router.make('/test').get<Output, Data, typeof path>(
      path,
      req => {
        return Result.success(() => ({
          test: req.params.test,
          count: parseInt(req.query.count),
        }))
      },
    )

    const app = router.attachTo(express())
    const result = await sendHttpRequest<Output>(
      'GET',
      '/test/get/some-string?count=42',
      app,
    )

    expectResult(await result.map(_ => _.data)).toHaveSucceededWith({
      test: 'some-string',
      count: 42,
    })
  })

  it('should handle post requests', async () => {
    const path = Path.start().literal('post').param<Params>('test')

    const router = Router.make('/test').post<Output, Data, typeof path>(
      path,
      req => {
        return Result.success(() => ({
          test: req.params.test,
          count: parseInt(req.body.count),
        }))
      },
    )

    const app = router.attachTo(express().use(express.json()))
    const result = await sendHttpRequest<Data, Output>(
      'POST',
      '/test/post/some-string',
      { count: '42' },
      app,
    )

    expectResult(await result.map(_ => _.data)).toHaveSucceededWith({
      test: 'some-string',
      count: 42,
    })
  })

  it('should handle put requests', async () => {
    const path = Path.start().literal('put').param<Params>('test')

    const router = Router.make('/test').put<Output, Data, typeof path>(
      path,
      req => {
        return Result.success(() => ({
          test: req.params.test,
          count: parseInt(req.body.count),
        }))
      },
    )

    const app = router.attachTo(express().use(express.json()))
    const result = await sendHttpRequest<Data, Output>(
      'PUT',
      '/test/put/some-string',
      { count: '42' },
      app,
    )

    expectResult(await result.map(_ => _.data)).toHaveSucceededWith({
      test: 'some-string',
      count: 42,
    })
  })

  it('should handle delete requests', async () => {
    const path = Path.start().literal('delete').param<Params>('test')

    const router = Router.make('/test').delete<Output, Data, typeof path>(
      path,
      req => {
        return Result.success(() => ({
          test: req.params.test,
          count: parseInt(req.query.count),
        }))
      },
    )

    const app = router.attachTo(express())
    const result = await sendHttpRequest<Output>(
      'DELETE',
      '/test/delete/some-string?count=42',
      app,
    )

    expectResult(await result.map(_ => _.data)).toHaveSucceededWith({
      test: 'some-string',
      count: 42,
    })
  })

  describe('error handling', () => {
    it('should handle sync ServerErrors', async () => {
      const path = Path.start().literal('error')

      const router = Router.make('/test').get(path, () => {
        throw new ServerError(404, 'Test error')
      })

      const app = router.attachTo(express())
      const result = await sendHttpRequest('GET', '/test/error', app)

      expectResult(result).toHaveSucceededWith({
        status: 404,
        data: { error: 'Test error' },
      })
    })

    it('should handle async ServerErrors', async () => {
      const path = Path.start().literal('error')

      const router = Router.make('/test').post(path, () => {
        return Result.failure(() => new ServerError(404, 'Test error'))
      })

      const app = router.attachTo(express())
      const result = await sendHttpRequest(
        'POST',
        '/test/error',
        undefined,
        app,
      )

      expectResult(result).toHaveSucceededWith({
        status: 404,
        data: { error: 'Test error' },
      })
    })

    it('should handle sync Errors', async () => {
      const path = Path.start().literal('error')

      const router = Router.make('/test').put(path, () => {
        throw new Error('Test error')
      })

      const app = router.attachTo(express())
      const result = await sendHttpRequest('PUT', '/test/error', undefined, app)

      /* This is `sendHttpRequest` that cannot parse the HTML response from Express to JSON, but it forwards the 500 status code */
      expectResult(result).toHaveFailedWith(
        new ServerError(500, 'JSON parsing error'),
      )
    })

    it('should handle async Errors', async () => {
      const path = Path.start().literal('error')

      const router = Router.make('/test').delete(path, async () => {
        throw new Error('Test error')
      })

      const app = router.attachTo(express())
      const result = await sendHttpRequest('DELETE', '/test/error', app)

      /* This is `sendHttpRequest` that cannot parse the HTML response from Express to JSON, but it forwards the 500 status code */
      expectResult(result).toHaveFailedWith(
        new ServerError(500, 'JSON parsing error'),
      )
    })
  })
})
