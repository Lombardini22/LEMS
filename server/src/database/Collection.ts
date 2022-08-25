import { Cursor, CursorQuery, foldCursorQuery } from './../../../shared/Cursor'
import {
  ObjectId,
  OptionalUnlessRequiredId,
  WithId,
  Collection as MongoCollection,
  Filter,
  Document,
  ModifyResult,
} from 'mongodb'
import { ServerError } from '../ServerError'
import { withDatabase } from './withDatabase'

export class Collection<I extends { _id?: ObjectId }> {
  name: string

  constructor(name: string) {
    this.name = name
  }

  protected async getCollection(): Promise<MongoCollection<I>> {
    const [result] = await withDatabase(db => db.collection<I>(this.name))
    return result
  }

  async raw<T>(op: (collection: MongoCollection<I>) => T): Promise<T> {
    return op(await this.getCollection())
  }

  async insert(doc: OptionalUnlessRequiredId<I>): Promise<WithId<I>>
  async insert(docs: OptionalUnlessRequiredId<I>[]): Promise<WithId<I>[]>
  async insert(
    doc: OptionalUnlessRequiredId<I> | OptionalUnlessRequiredId<I>[],
  ): Promise<WithId<I> | WithId<I>[]> {
    const docs = Array.isArray(doc) ? doc : [doc]
    const collection = await this.getCollection()
    const insertResult = await collection.insertMany(docs)

    const insertedIds = Object.values(insertResult.insertedIds)
    let result: WithId<I>[]

    if (insertedIds.length === docs.length) {
      result = await collection
        .find({ _id: { $in: insertedIds } } as unknown as Filter<I>)
        .toArray()
    } else {
      throw new ServerError(
        500,
        `Failed to insert document(s) in collection "${this.name}"`,
        { doc },
      )
    }

    if (Array.isArray(doc)) {
      return result
    } else if (result[0]) {
      return result[0]
    } else {
      throw new ServerError(
        500,
        `Unable to find inserted document in collection ${this.name}`,
        { doc, insertedIds },
      )
    }
  }

  async findOne(filter: Filter<I>): Promise<WithId<I>> {
    const collection = await this.getCollection()

    try {
      const result = await collection.findOne(filter)

      if (result === null) {
        throw new ServerError(404, 'Document not found')
      }

      return result
    } catch (e) {
      throw new ServerError(
        500,
        `Unable to execute query on collection "${this.name}"`,
        { error: e, filter },
      )
    }
  }

  getById(_id: ObjectId): Promise<WithId<I>> {
    return this.findOne({ _id } as Filter<I>)
  }

  find<T = I>(
    searchField: string,
    initialFilters: Document[] = [],
  ): (query: CursorQuery) => Promise<Cursor<T>> {
    return async query => {
      const queryMatchStage = query.query
        ? [
            {
              $match: {
                [searchField]: {
                  $regex: query.query,
                  $options: 'i',
                },
              },
            },
          ]
        : []

      const sortingOrder = foldCursorQuery(query, {
        ASC: () => 1,
        DESC: () => -1,
      })

      const minCriteria = foldCursorQuery<Document>(query, {
        ASC: () => ({ $min: `$${searchField}` }),
        DESC: () => ({ $max: `$${searchField}` }),
      })

      const maxCriteria = foldCursorQuery<Document>(query, {
        ASC: () => ({ $max: `$${searchField}` }),
        DESC: () => ({ $min: `$${searchField}` }),
      })

      const skipCriteria = foldCursorQuery<Document>(query, {
        ASC: ({ after }) => (after ? { [searchField]: { $gt: after } } : {}),
        DESC: ({ before }) =>
          before ? { [searchField]: { $lt: before } } : {},
      })

      const limit = foldCursorQuery(query, {
        ASC: ({ first }) => first,
        DESC: ({ last }) => last,
      })

      const otherStages = [
        {
          $sort: { [searchField]: sortingOrder },
        },
        {
          $facet: {
            global: [
              {
                $group: {
                  _id: null,
                  totalCount: { $sum: 1 },
                  min: minCriteria,
                  max: maxCriteria,
                },
              },
            ],
            data: [
              {
                $match: skipCriteria,
              },
              {
                $limit: limit,
              },
            ],
          },
        },
        {
          $project: {
            edges: {
              $map: {
                input: '$data',
                as: 'item',
                in: {
                  node: '$$item',
                  cursor: `$$item.${searchField}`,
                },
              },
            },
            global: {
              $arrayElemAt: ['$global', 0],
            },
            order: {
              $map: {
                input: '$data',
                as: 'item',
                in: `$$item.${searchField}`,
              },
            },
          },
        },
        {
          $project: {
            edges: '$edges',
            global: '$global',
            min: {
              $arrayElemAt: [{ $slice: ['$order', 1] }, 0],
            },
            max: {
              $arrayElemAt: [{ $slice: ['$order', -1] }, 0],
            },
          },
        },
        {
          $project: {
            edges: '$edges',
            pageInfo: {
              totalCount: {
                $ifNull: ['$global.totalCount', 0],
              },
              startCursor: {
                $ifNull: ['$min', null],
              },
              endCursor: {
                $ifNull: ['$max', null],
              },
              hasPreviousPage: {
                $ne: ['$global.min', '$min'],
              },
              hasNextPage: {
                $ne: ['$global.max', '$max'],
              },
            },
          },
        },
      ]

      const aggregation = [
        ...initialFilters,
        ...queryMatchStage,
        ...otherStages,
      ]

      const result = await this.aggregate<Cursor<T>>(aggregation)

      if (!result[0]) {
        throw new ServerError(
          500,
          `Empty response for find in collection "${this.name}"`,
          { query },
        )
      }

      return result[0]
    }
  }

  async aggregate<T>(pipeline: Document[]): Promise<T[]> {
    const collection = await this.getCollection()

    try {
      return collection.aggregate<T>(pipeline).toArray()
    } catch (e) {
      throw new ServerError(
        500,
        `Unable to perform aggregation on collection "${this.name}"`,
        { error: e, pipeline },
      )
    }
  }

  async update(
    _id: ObjectId,
    doc: OptionalUnlessRequiredId<I>,
  ): Promise<WithId<I>> {
    const collection = await this.getCollection()

    const result = await (async () => {
      try {
        return await (collection.findOneAndUpdate(
          { _id } as Filter<I>,
          { $set: doc },
          {
            returnDocument: 'after',
          },
        ) as Promise<ModifyResult<I>>)
      } catch (e) {
        throw new ServerError(
          500,
          `Unable to update a document in collection ${this.name}`,
          { error: e, _id, doc },
        )
      }
    })()

    if (!result.ok || result.value === null) {
      throw new ServerError(404, 'Document not found')
    }

    return result.value
  }

  async delete(_id: ObjectId): Promise<WithId<I>> {
    const collection = await this.getCollection()

    const result = await (async () => {
      try {
        return await collection.findOneAndDelete({ _id } as Filter<I>)
      } catch (e) {
        throw new ServerError(
          500,
          `Unable to delete a document in collection ${this.name}`,
          { error: e, _id },
        )
      }
    })()

    if (!result.ok || result.value === null) {
      throw new ServerError(404, 'Document not found')
    }

    return result.value
  }
}
