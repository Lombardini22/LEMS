import { ObjectId } from 'mongodb'
import { emptyCursor, emptyCursorQuery } from '../../../shared/Cursor'
import { env } from '../resources/env'
import { expectT } from '../testUtils'
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
        const result = await collection.raw(_ => _.dbName)
        expectT(result).toEqual(env.MONGO_DB_NAME)
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

        expectT(await collection.insert(data)).toEqual(data)
      })
    })

    describe('multiple documents', () => {
      it('should work', async () => {
        const data = [
          { _id: new ObjectId(), name: 'InsertMany test 1' },
          { _id: new ObjectId(), name: 'InsertMany test 2' },
        ]

        expectT(await collection.insert(data)).toEqual(data)
      })
    })
  })

  describe('findOne', () => {
    it('should work', async () => {
      const data = {
        _id: new ObjectId(),
        name: 'Unique hdkjhfkjshdkjh screw the law of large numbers',
      }

      await collection.raw(_ => _.insertOne(data))
      const result = await collection.findOne({ name: data.name })

      expectT(result).toEqual(data)
    })
  })

  describe('getById', () => {
    it('should work', async () => {
      const data = {
        _id: new ObjectId(),
        name: 'GetById test',
      }

      const insertResult = await collection.raw(_ => _.insertOne(data))
      const result = await collection.getById(insertResult.insertedId)

      expectT(result).toEqual(data)
    })
  })

  describe('aggregate', () => {
    it('should work', async () => {
      const data = {
        _id: new ObjectId(),
        name: 'Aggregate test',
      }

      const insertResult = await collection.raw(_ => _.insertOne(data))
      const _id = insertResult.insertedId
      const result = await collection.aggregate<TestDoc>([{ $match: { _id } }])

      expectT(result).toEqual([data])
    })
  })

  describe('find', () => {
    describe('with no data', () => {
      beforeEach(() => collection.raw(_ => _.deleteMany({})))

      it('should work', async () => {
        const result = await collection.find('name')(emptyCursorQuery())
        expectT(result).toEqual(emptyCursor())
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

          expectT(result.pageInfo).toEqual({
            totalCount: 6,
            startCursor: 'Some A',
            endCursor: 'Some B',
            hasPreviousPage: false,
            hasNextPage: true,
          })

          expectT(result.edges.map(_ => _.node.name)).toEqual([
            'Some A',
            'Some B',
          ])
        })

        it('should get a middle page', async () => {
          const result = await collection.find('name')({
            order: 'ASC',
            query: 'some',
            first: 2,
            after: 'Some B',
          })

          expectT(result.pageInfo).toEqual({
            totalCount: 6,
            startCursor: 'Some C',
            endCursor: 'Some D',
            hasPreviousPage: true,
            hasNextPage: true,
          })

          expectT(result.edges.map(_ => _.node.name)).toEqual([
            'Some C',
            'Some D',
          ])
        })

        it('should get the last page', async () => {
          const result = await collection.find('name')({
            order: 'ASC',
            query: 'some',
            first: 2,
            after: 'Some D',
          })

          expectT(result.pageInfo).toEqual({
            totalCount: 6,
            startCursor: 'Some E',
            endCursor: 'Some F',
            hasPreviousPage: true,
            hasNextPage: false,
          })

          expectT(result.edges.map(_ => _.node.name)).toEqual([
            'Some E',
            'Some F',
          ])
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

          expectT(result.pageInfo).toEqual({
            totalCount: 6,
            startCursor: 'Some F',
            endCursor: 'Some E',
            hasPreviousPage: false,
            hasNextPage: true,
          })

          expectT(result.edges.map(_ => _.node.name)).toEqual([
            'Some F',
            'Some E',
          ])
        })

        it('should get a middle page', async () => {
          const result = await collection.find('name')({
            order: 'DESC',
            query: 'some',
            last: 2,
            before: 'Some E',
          })

          expectT(result.pageInfo).toEqual({
            totalCount: 6,
            startCursor: 'Some D',
            endCursor: 'Some C',
            hasPreviousPage: true,
            hasNextPage: true,
          })

          expectT(result.edges.map(_ => _.node.name)).toEqual([
            'Some D',
            'Some C',
          ])
        })

        it('should get the last page', async () => {
          const result = await collection.find('name')({
            order: 'DESC',
            query: 'some',
            last: 2,
            before: 'Some C',
          })

          expectT(result.pageInfo).toEqual({
            totalCount: 6,
            startCursor: 'Some B',
            endCursor: 'Some A',
            hasPreviousPage: true,
            hasNextPage: false,
          })

          expectT(result.edges.map(_ => _.node.name)).toEqual([
            'Some B',
            'Some A',
          ])
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
      const insertResult = await collection.raw(_ => _.insertOne(data))

      const result = await collection.update(insertResult.insertedId, {
        name: updatedName,
      })

      expectT(result.name).toEqual(updatedName)
    })
  })

  describe('delete', () => {
    it('should work', async () => {
      const data: TestDoc = {
        name: 'Delete test',
      }

      const insertResult = await collection.raw(_ => _.insertOne(data))
      const result = await collection.delete(insertResult.insertedId)

      expectT(result.name).toEqual(data.name)
    })
  })
})
