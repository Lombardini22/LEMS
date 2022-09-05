import { Cursor, CursorQuery, foldCursorQuery } from './../../../shared/Cursor'
import {
  ObjectId,
  OptionalUnlessRequiredId,
  WithId,
  Collection as MongoCollection,
  Filter,
  Document,
  MatchKeysAndValues,
} from 'mongodb'
import { ServerError } from '../ServerError'
import { database } from '../resources/database'
import { Result } from '../../../shared/Result'
import { constant } from '../../../shared/utils'

export class Collection<I extends { _id?: ObjectId }> {
  readonly name: string

  constructor(name: string) {
    this.name = name
  }

  protected getCollection(): Promise<Result<ServerError, MongoCollection<I>>> {
    return database.use(db => Result.success(() => db.collection(this.name)))
  }

  async raw<T>(
    op: (collection: MongoCollection<I>) => Promise<Result<ServerError, T>>,
  ): Promise<Result<ServerError, T>> {
    const collection = await this.getCollection()
    return collection.flatMap(op)
  }

  async insert(
    doc: OptionalUnlessRequiredId<I>,
  ): Promise<Result<ServerError, WithId<I>>>
  async insert(
    docs: OptionalUnlessRequiredId<I>[],
  ): Promise<Result<ServerError, WithId<I>[]>>
  async insert(
    doc: OptionalUnlessRequiredId<I> | OptionalUnlessRequiredId<I>[],
  ): Promise<Result<ServerError, WithId<I> | WithId<I>[]>> {
    const docs = Array.isArray(doc) ? doc : [doc]
    const collection = await this.getCollection()

    const insertResult = await collection.flatMap(c =>
      Result.tryCatch(
        () => c.insertMany(docs),
        error =>
          new ServerError(
            500,
            `Unable to insert documents in collection ${this.name}`,
            { error },
          ),
      ),
    )

    const insertedIds = await insertResult.map(_ =>
      Object.values(_.insertedIds),
    )

    return await insertedIds.flatMap(async insertedIds => {
      if (insertedIds.length !== docs.length) {
        return Result.failure(
          () =>
            new ServerError(
              500,
              `Failed to insert document(s) in collection "${this.name}"`,
              { doc },
            ),
        )
      }

      const result = await collection.flatMap(c =>
        Result.tryCatch(
          () =>
            c
              .find({ _id: { $in: insertedIds } } as unknown as Filter<I>)
              .toArray(),
          error =>
            new ServerError(
              500,
              `Unable to execute find in collection ${this.name}`,
              { error, doc },
            ),
        ),
      )

      if (Array.isArray(doc)) {
        return result
      } else {
        const firstDocResult = await result.map(_ => _[0])
        const firstDoc = await firstDocResult.getOrElse(() => undefined)

        if (firstDoc) {
          return await Result.success(() => firstDoc)
        } else {
          return await Result.failure(
            () =>
              new ServerError(
                500,
                `Unable to find inserted document in collection ${this.name}`,
                { doc, insertedIds },
              ),
          )
        }
      }
    })
  }

  async findOne(filter: Filter<I>): Promise<Result<ServerError, WithId<I>>> {
    const collection = await this.getCollection()

    const result = await collection.flatMap(c =>
      Result.tryCatch(
        () => c.findOne(filter),
        error =>
          new ServerError(
            500,
            `Unable to execute query on collection "${this.name}"`,
            { error, filter },
          ),
      ),
    )

    return await result.flatMap(doc => {
      if (doc === null) {
        return Result.failure(() => new ServerError(404, 'Document not found'))
      } else {
        return Result.success(() => doc)
      }
    })
  }

  findById(_id: ObjectId): Promise<Result<ServerError, WithId<I>>> {
    return this.findOne({ _id } as Filter<I>)
  }

  find<T = WithId<I>>(
    searchField: string,
    initialFilters: Document[] = [],
  ): (query: CursorQuery) => Promise<Result<ServerError, Cursor<T>>> {
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

      return await result.flatMap(result => {
        if (!result[0]) {
          return Result.failure(
            () =>
              new ServerError(
                500,
                `Empty response for find in collection "${this.name}"`,
                { query },
              ),
          )
        } else {
          return Result.success(constant(result[0]))
        }
      })
    }
  }

  async aggregate<T extends Document>(
    pipeline: Document[],
  ): Promise<Result<ServerError, T[]>> {
    const collection = await this.getCollection()

    return collection.flatMap(c =>
      Result.tryCatch(
        () => c.aggregate<T>(pipeline).toArray(),
        error =>
          new ServerError(
            500,
            `Unable to perform aggregation on collection "${this.name}"`,
            { error, pipeline },
          ),
      ),
    )
  }

  async update(
    _id: ObjectId,
    doc: OptionalUnlessRequiredId<I>,
  ): Promise<Result<ServerError, WithId<I>>> {
    const collection = await this.getCollection()

    const result = await collection.flatMap(c =>
      Result.tryCatch(
        () => {
          return c.findOneAndUpdate(
            { _id } as Filter<I>,
            {
              $set: Object.entries(doc)
                .filter(([key]) => key !== '_id')
                .reduce(
                  (res, [key, value]) => ({ ...res, [key]: value }),
                  {} as MatchKeysAndValues<I>,
                ),
            },
            { returnDocument: 'after' },
          )
        },
        error =>
          new ServerError(
            500,
            `Unable to update a document in collection ${this.name}`,
            { error, _id, doc },
          ),
      ),
    )

    return result.flatMap(result => {
      if (!result.ok || result.value === null) {
        return Result.failure(() => new ServerError(404, 'Document not found'))
      } else {
        return Result.success(constant(result.value))
      }
    })
  }

  async delete(_id: ObjectId): Promise<Result<ServerError, WithId<I>>> {
    const collection = await this.getCollection()

    const result = await collection.flatMap(c =>
      Result.tryCatch(
        () => c.findOneAndDelete({ _id } as Filter<I>),
        error =>
          new ServerError(
            500,
            `Unable to delete a document in collection ${this.name}`,
            { error, _id },
          ),
      ),
    )

    return await result.flatMap(result => {
      if (!result.ok || result.value === null) {
        return Result.failure(() => new ServerError(404, 'Document not found'))
      } else {
        return Result.success(constant(result.value))
      }
    })
  }
}
