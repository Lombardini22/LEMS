import { ObjectId } from 'mongodb'
import { emptyCursor, emptyCursorQuery } from '../../../shared/Cursor'
import { Result } from '../../../shared/Result'
import { expectResult } from '../../../shared/testUtils'
import { env } from '../resources/env'
import { ServerError } from '../ServerError'
import { Collection } from './Collection'

interface TestDoc {
  _id?: ObjectId
  name: string
}

describe('Collection', () => {
  const collection = new Collection<TestDoc>('collection-test')

  describe('raw', () => {
    it('should work', async () => {
      return await env.use(async env => {
        const result = await collection.raw(_ =>
          Result.tryCatch(
            () => _.dbName,
            () => new ServerError(500, 'Failed'),
          ),
        )

        return expectResult(result).toHaveSucceededWith(env.MONGO_DB_NAME)
      })
    })
  })

  describe('insert', () => {
    describe('single document', () => {
      it('should work', async () => {
        const data = {
          _id: new ObjectId(),
          name: 'Insert test',
        }

        expectResult(await collection.insert(data)).toHaveSucceededWith(data)
      })
    })

    describe('multiple documents', () => {
      it('should work', async () => {
        const data = [
          { _id: new ObjectId(), name: 'InsertMany test 1' },
          { _id: new ObjectId(), name: 'InsertMany test 2' },
        ]

        expectResult(await collection.insert(data)).toHaveSucceededWith(data)
      })
    })
  })

  describe('findOne', () => {
    it('should work', async () => {
      const data = {
        _id: new ObjectId(),
        name: 'Unique hdkjhfkjshdkjh screw the law of large numbers',
      }

      await collection.raw(_ =>
        Result.tryCatch(
          () => _.insertOne(data),
          () => new ServerError(500, 'Failed'),
        ),
      )

      expectResult(
        await collection.findOne({ name: data.name }),
      ).toHaveSucceededWith(data)
    })
  })

  describe('getById', () => {
    it('should work', async () => {
      const data = {
        _id: new ObjectId(),
        name: 'GetById test',
      }

      const insertResult = await collection.raw(_ =>
        Result.tryCatch(
          () => _.insertOne(data),
          () => new ServerError(500, 'Failed'),
        ),
      )

      const result = await insertResult.flatMap(insertResult =>
        collection.getById(insertResult.insertedId),
      )

      expectResult(result).toHaveSucceededWith(data)
    })
  })

  describe('aggregate', () => {
    it('should work', async () => {
      const data = {
        _id: new ObjectId(),
        name: 'Aggregate test',
      }

      const insertResult = await collection.raw(_ =>
        Result.tryCatch(
          () => _.insertOne(data),
          () => new ServerError(500, 'Failed'),
        ),
      )

      const result = await insertResult.flatMap(({ insertedId }) =>
        collection.aggregate<TestDoc>([{ $match: { _id: insertedId } }]),
      )

      expectResult(result).toHaveSucceededWith([data])
    })
  })

  describe('find', () => {
    describe('with no data', () => {
      beforeEach(() =>
        collection.raw(_ =>
          Result.tryCatch(
            () => _.deleteMany({}),
            () => new ServerError(500, 'Failed'),
          ),
        ),
      )

      it('should work', async () => {
        const result = await collection.find('name')(emptyCursorQuery())
        expectResult(result).toHaveSucceededWith(emptyCursor())
      })
    })

    describe('with data', () => {
      beforeAll(async () => {
        await collection.insert([
          { name: 'Some A' },
          { name: 'Some B' },
          { name: 'Some C' },
          { name: 'Some D' },
          { name: 'Some E' },
          { name: 'Some F' },
          { name: 'None' },
        ])
      })

      describe('ascendent', () => {
        it('should get the first page', async () => {
          const result = await collection.find('name')({
            order: 'ASC',
            query: 'some',
            first: 2,
            after: null,
          })

          expectResult(await result.map(_ => _.pageInfo)).toHaveSucceededWith({
            totalCount: 6,
            startCursor: 'Some A',
            endCursor: 'Some B',
            hasPreviousPage: false,
            hasNextPage: true,
          })

          expectResult(
            await result.map(_ => _.edges.map(_ => _.node.name)),
          ).toHaveSucceededWith(['Some A', 'Some B'])
        })

        it('should get a middle page', async () => {
          const result = await collection.find('name')({
            order: 'ASC',
            query: 'some',
            first: 2,
            after: 'Some B',
          })

          expectResult(await result.map(_ => _.pageInfo)).toHaveSucceededWith({
            totalCount: 6,
            startCursor: 'Some C',
            endCursor: 'Some D',
            hasPreviousPage: true,
            hasNextPage: true,
          })

          expectResult(
            await result.map(_ => _.edges.map(_ => _.node.name)),
          ).toHaveSucceededWith(['Some C', 'Some D'])
        })

        it('should get the last page', async () => {
          const result = await collection.find('name')({
            order: 'ASC',
            query: 'some',
            first: 2,
            after: 'Some D',
          })

          expectResult(await result.map(_ => _.pageInfo)).toHaveSucceededWith({
            totalCount: 6,
            startCursor: 'Some E',
            endCursor: 'Some F',
            hasPreviousPage: true,
            hasNextPage: false,
          })

          expectResult(
            await result.map(_ => _.edges.map(_ => _.node.name)),
          ).toHaveSucceededWith(['Some E', 'Some F'])
        })
      })

      describe('descendent', () => {
        it('should get the first page', async () => {
          const result = await collection.find('name')({
            order: 'DESC',
            query: 'some',
            last: 2,
            before: null,
          })

          expectResult(await result.map(_ => _.pageInfo)).toHaveSucceededWith({
            totalCount: 6,
            startCursor: 'Some F',
            endCursor: 'Some E',
            hasPreviousPage: false,
            hasNextPage: true,
          })

          expectResult(
            await result.map(_ => _.edges.map(_ => _.node.name)),
          ).toHaveSucceededWith(['Some F', 'Some E'])
        })

        it('should get a middle page', async () => {
          const result = await collection.find('name')({
            order: 'DESC',
            query: 'some',
            last: 2,
            before: 'Some E',
          })

          expectResult(await result.map(_ => _.pageInfo)).toHaveSucceededWith({
            totalCount: 6,
            startCursor: 'Some D',
            endCursor: 'Some C',
            hasPreviousPage: true,
            hasNextPage: true,
          })

          expectResult(
            await result.map(_ => _.edges.map(_ => _.node.name)),
          ).toHaveSucceededWith(['Some D', 'Some C'])
        })

        it('should get the last page', async () => {
          const result = await collection.find('name')({
            order: 'DESC',
            query: 'some',
            last: 2,
            before: 'Some C',
          })

          expectResult(await result.map(_ => _.pageInfo)).toHaveSucceededWith({
            totalCount: 6,
            startCursor: 'Some B',
            endCursor: 'Some A',
            hasPreviousPage: true,
            hasNextPage: false,
          })

          expectResult(
            await result.map(_ => _.edges.map(_ => _.node.name)),
          ).toHaveSucceededWith(['Some B', 'Some A'])
        })
      })
    })
  })

  describe('update', () => {
    it('should work', async () => {
      const data: TestDoc = {
        name: 'Update test',
      }

      const updatedName = 'Updated name'

      const insertResult = await collection.raw(_ =>
        Result.tryCatch(
          () => _.insertOne(data),
          () => new ServerError(500, 'Failed'),
        ),
      )

      const result = await insertResult.flatMap(({ insertedId }) =>
        collection.update(insertedId, {
          name: updatedName,
        }),
      )

      expectResult(await result.map(_ => _.name)).toHaveSucceededWith(
        updatedName,
      )
    })
  })

  describe('delete', () => {
    it('should work', async () => {
      const data: TestDoc = {
        name: 'Delete test',
      }

      const insertResult = await collection.raw(_ =>
        Result.tryCatch(
          () => _.insertOne(data),
          () => new ServerError(500, 'Failed'),
        ),
      )

      const result = await insertResult.flatMap(({ insertedId }) =>
        collection.delete(insertedId),
      )

      expectResult(await result.map(_ => _.name)).toHaveSucceededWith(data.name)
    })
  })
})
