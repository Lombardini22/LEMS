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

    const router = Router.make().get<Output, Data, typeof path>(path, req => {
      return Result.success(() => ({
        test: req.params.test,
        count: parseInt(req.query.count),
      }))
    })

    const app = router.attachTo(express())
    const result = await sendHttpRequest<Output>(
      app,
      'GET',
      '/get/some-string?count=42',
    )

    expectResult(await result.map(_ => _.data)).toHaveSucceededWith({
      test: 'some-string',
      count: 42,
    })
  })

  it('should handle post requests', async () => {
    const path = Path.start().literal('post').param<Params>('test')

    const router = Router.make().post<Output, Data, typeof path>(path, req => {
      return Result.success(() => ({
        test: req.params.test,
        count: parseInt(req.body.count),
      }))
    })

    const app = router.attachTo(express())
    const result = await sendHttpRequest<Data, Output>(
      app,
      'POST',
      '/post/some-string',
      { count: '42' },
    )

    expectResult(await result.map(_ => _.data)).toHaveSucceededWith({
      test: 'some-string',
      count: 42,
    })
  })

  it('should handle put requests', async () => {
    const path = Path.start().literal('put').param<Params>('test')

    const router = Router.make().put<Output, Data, typeof path>(path, req => {
      return Result.success(() => ({
        test: req.params.test,
        count: parseInt(req.body.count),
      }))
    })

    const app = router.attachTo(express())
    const result = await sendHttpRequest<Data, Output>(
      app,
      'PUT',
      '/put/some-string',
      { count: '42' },
    )

    expectResult(await result.map(_ => _.data)).toHaveSucceededWith({
      test: 'some-string',
      count: 42,
    })
  })

  it('should handle delete requests', async () => {
    const path = Path.start().literal('delete').param<Params>('test')

    const router = Router.make().delete<Output, Data, typeof path>(
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
      app,
      'DELETE',
      '/delete/some-string?count=42',
    )

    expectResult(await result.map(_ => _.data)).toHaveSucceededWith({
      test: 'some-string',
      count: 42,
    })
  })

  describe('error handling', () => {
    it('should handle sync ServerErrors', async () => {
      const path = Path.start().literal('error')

      const router = Router.make().get(path, () => {
        throw new ServerError(404, 'Test error')
      })

      const app = router.attachTo(express())
      const result = await sendHttpRequest(app, 'GET', '/error')

      expectResult(result).toHaveSucceededWith({
        status: 404,
        data: { error: 'Test error' },
      })
    })

    it('should handle async ServerErrors', async () => {
      const path = Path.start().literal('error')

      const router = Router.make().post(path, () => {
        return Result.failure(() => new ServerError(404, 'Test error'))
      })

      const app = router.attachTo(express())
      const result = await sendHttpRequest(app, 'POST', '/error', {})

      expectResult(result).toHaveSucceededWith({
        status: 404,
        data: { error: 'Test error' },
      })
    })

    it('should handle sync Errors', async () => {
      const path = Path.start().literal('error')

      const router = Router.make().put(path, () => {
        throw new Error('Test error')
      })

      const app = router.attachTo(express())
      const result = await sendHttpRequest(app, 'PUT', '/error', {})

      /* This is `sendHttpRequest` that cannot parse the HTML response from Express to JSON, but it forwards the 500 status code */
      expectResult(result).toHaveFailedWith(
        new ServerError(500, 'JSON parsing error'),
      )
    })

    it('should handle async Errors', async () => {
      const path = Path.start().literal('error')

      const router = Router.make().delete(path, async () => {
        throw new Error('Test error')
      })

      const app = router.attachTo(express())
      const result = await sendHttpRequest(app, 'DELETE', '/error')

      /* This is `sendHttpRequest` that cannot parse the HTML response from Express to JSON, but it forwards the 500 status code */
      expectResult(result).toHaveFailedWith(
        new ServerError(500, 'JSON parsing error'),
      )
    })
  })
})
