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
import { database } from '../resources/database'
import { Result } from '../../../shared/Result'

export class Collection<I extends { _id?: ObjectId }> {
  readonly name: string

  constructor(name: string) {
    this.name = name
  }

  protected getCollection(): Promise<MongoCollection<I>> {
    return database.use(db => Promise.resolve(db.collection(this.name)))
  }

  async raw<T>(
    op: (collection: MongoCollection<I>) => Promise<T>,
  ): Promise<Result<ServerError, T>> {
    const collection = await this.getCollection()

    return await Result.asyncTryCatch(
      () => op(collection),
      e =>
        new ServerError(
          500,
          `Unable to perform raw operation on collection ${this.name}`,
          { error: e },
        ),
    )
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

    const insertResult = await Result.asyncTryCatch(
      () => collection.insertMany(docs),
      e =>
        new ServerError(
          500,
          `Unable to insert document(s) in collection ${this.name}`,
          e,
        ),
    )

    const insertedIds = insertResult.map(_ => Object.values(_.insertedIds))

    const result = await insertedIds.asyncFlatMap<WithId<I>[]>(insertedIds => {
      if (insertedIds.length === docs.length) {
        return Result.asyncTryCatch(
          () =>
            collection
              .find({ _id: { $in: insertedIds } } as unknown as Filter<I>)
              .toArray(),
          e =>
            new ServerError(
              500,
              `Unable to find inserted document in collection ${this.name}`,
              { insertedIds, error: e },
            ),
        )
      } else {
        return Result.asyncFailure(
          new ServerError(
            500,
            `Failed to insert document(s) in collection "${this.name}"`,
            { insertedIds, docs },
          ),
        )
      }
    })

    return result.flatMap(newDocs => {
      if (Array.isArray(doc)) {
        return Result.success(newDocs)
      } else if (newDocs[0]) {
        return Result.success(newDocs[0])
      } else {
        return Result.failure(
          new ServerError(
            500,
            `Unable to find inserted document in collection ${this.name}`,
            { doc, insertedIds },
          ),
        )
      }
    })
  }

  async findOne(filter: Filter<I>): Promise<Result<ServerError, WithId<I>>> {
    const collection = await this.getCollection()

    const result = await Result.asyncTryCatch(
      () => collection.findOne(filter),
      e =>
        new ServerError(
          500,
          `Unable to execute query on collection "${this.name}"`,
          { error: e, filter },
        ),
    )

    return result.flatMap(doc =>
      Result.fromNullable(
        doc,
        () => new ServerError(404, 'Document not found'),
      ),
    )
  }

  getById(_id: ObjectId): Promise<Result<ServerError, WithId<I>>> {
    return this.findOne({ _id } as Filter<I>)
  }

  find<T = I>(
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

      return result
        .map(_ => _[0])
        .flatMap(doc =>
          Result.fromNullable(
            doc,
            () =>
              new ServerError(
                500,
                `Empty response for find in collection "${this.name}"`,
                { query },
              ),
          ),
        )
    }
  }

  async aggregate<T>(pipeline: Document[]): Promise<Result<ServerError, T[]>> {
    const collection = await this.getCollection()

    return await Result.asyncTryCatch(
      () => collection.aggregate<T>(pipeline).toArray(),
      e =>
        new ServerError(
          500,
          `Unable to perform aggregation on collection "${this.name}"`,
          { error: e, pipeline },
        ),
    )
  }

  async update(
    _id: ObjectId,
    doc: OptionalUnlessRequiredId<I>,
  ): Promise<Result<ServerError, WithId<I>>> {
    const collection = await this.getCollection()

    const result = await Result.asyncTryCatch(
      () =>
        collection.findOneAndUpdate(
          { _id } as Filter<I>,
          { $set: doc },
          {
            returnDocument: 'after',
          },
        ) as Promise<ModifyResult<I>>,
      e =>
        new ServerError(
          500,
          `Unable to update a document in collection ${this.name}`,
          { error: e, _id, doc },
        ),
    )

    return result.flatMap(result => {
      if (!result.ok || result.value === null) {
        return Result.failure(new ServerError(404, 'Document not found'))
      } else {
        return Result.success(result.value)
      }
    })
  }

  async delete(_id: ObjectId): Promise<Result<ServerError, WithId<I>>> {
    const collection = await this.getCollection()

    const result = await Result.asyncTryCatch(
      () => collection.findOneAndDelete({ _id } as Filter<I>),
      e =>
        new ServerError(
          500,
          `Unable to delete a document in collection ${this.name}`,
          { error: e, _id },
        ),
    )

    return result.flatMap(result => {
      if (!result.ok || result.value === null) {
        return Result.failure(new ServerError(404, 'Document not found'))
      } else {
        return Result.success(result.value)
      }
    })
  }
}
