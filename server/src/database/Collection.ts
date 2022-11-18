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

interface Doc {
  _id?: ObjectId
  createdAt: Date
  updatedAt: Date
}

export type NoTimestamps<I> = OptionalUnlessRequiredId<
  Omit<I, 'createdAt' | 'updatedAt'>
>

export class Collection<I extends Doc> {
  readonly name: string
  private init:
    | ((collection: MongoCollection<I>) => Promise<Result<ServerError, void>>)
    | null

  /**
   * Creates a new Collection
   * @param name the name of the collection
   * @param init optional async init function. It will take the native MongoDB collection as an argument and return an empty Result. Can perform operations, e.g. create indexes on the collection
   */
  constructor(
    name: string,
    init?: (
      collection: MongoCollection<I>,
    ) => Promise<Result<ServerError, void>>,
  ) {
    this.name = name
    this.init = init || null
  }

  protected getCollection(): Promise<Result<ServerError, MongoCollection<I>>> {
    return database.use(async db => {
      const collection = db.collection<I>(this.name)

      if (this.init) {
        const initResult = await this.init(collection)
        this.init = null
        return initResult.map(() => collection)
      } else {
        return Result.success(() => collection)
      }
    })
  }

  /**
   * Attempts to execute an operation on the native MongoDB collection
   * @param op async operation on the native MongoDB collection
   * @returns the result of the operation, or a failure if the collection cannot be accessed
   */
  async raw<T>(
    op: (collection: MongoCollection<I>) => Promise<Result<ServerError, T>>,
  ): Promise<Result<ServerError, T>> {
    const collection = await this.getCollection()
    return collection.flatMap(op)
  }

  /**
   * Attempts to insert one or many document(s)
   * @param doc the document or documents to be inserted
   */
  async insert(doc: NoTimestamps<I>): Promise<Result<ServerError, WithId<I>>>
  async insert(
    docs: NoTimestamps<I>[],
  ): Promise<Result<ServerError, WithId<I>[]>>
  async insert(
    doc: NoTimestamps<I> | NoTimestamps<I>[],
  ): Promise<Result<ServerError, WithId<I> | WithId<I>[]>> {
    const docs = Array.isArray(doc) ? doc : [doc]
    const collection = await this.getCollection()

    const insertResult = await collection.flatMap(collection =>
      Result.tryCatch(
        () =>
          collection.insertMany(
            docs.map(
              doc =>
                ({
                  ...doc,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                } as unknown as OptionalUnlessRequiredId<I>),
            ),
          ),
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

      const result = await collection.flatMap(collection =>
        Result.tryCatch(
          () =>
            collection
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

  /**
   * Attempts to find a single document in the collection
   * @param filter the MongoDB filter to be used to find the document
   * @returns the found document, or a failure if it was impossible to find it
   */
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

  /**
   * Attempts to find a document by its _id
   * @param _id the _id of the document to be found
   * @returns the found document, or a failure if the document could not be found
   */
  findById(_id: ObjectId): Promise<Result<ServerError, WithId<I>>> {
    return this.findOne({ _id } as Filter<I>)
  }

  /**
   * Creates a search and paginate function based on cursors pagination
   * @param searchField the field that will be used both to search and order the documents, and to create the cursors
   * @param initialFilters an array of aggregation stages to be executed before the actual search. Useful for filtering based on permissions, add or remove fields, do lookups, etc.
   * @returns a search function. It takes the query and executes the actual search and pagination based on how the operation has been set
   */
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

  /**
   * Attempts to perform an aggregation operation on the MongoDB collection
   * @param pipeline the MongoDB aggregation pipeline
   * @returns the result of the aggregation, or a failure if an error was raised
   */
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

  /**
   * Attempts to update a single document
   * @param filter the filter to be used to find the document
   * @param doc the fields to be updated and their new values
   * @returns the updated document, or a failure of it was impossible to perform the update operation
   */
  async update(
    filter: Filter<I>,
    doc: NoTimestamps<I>,
  ): Promise<Result<ServerError, WithId<I>>> {
    const collection = await this.getCollection()

    const result = await collection.flatMap(c =>
      Result.tryCatch(
        () => {
          return c.findOneAndUpdate(
            filter,
            {
              $set: {
                ...Object.entries(doc)
                  .filter(([key]) => key !== '_id')
                  .reduce(
                    (res, [key, value]) => ({ ...res, [key]: value }),
                    {} as MatchKeysAndValues<I>,
                  ),
                updatedAt: new Date(),
              },
            },
            { returnDocument: 'after' },
          )
        },
        error =>
          new ServerError(
            500,
            `Unable to update a document in collection ${this.name}`,
            { error, filter, doc },
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

  /**
   * Attempts to delete a single document
   * @param filter the filter to be used to find the document
   * @returns the deleted document, or a failure if it was impossible to perform the delete operation
   */
  async delete(filter: Filter<I>): Promise<Result<ServerError, WithId<I>>> {
    const collection = await this.getCollection()

    const result = await collection.flatMap(c =>
      Result.tryCatch(
        () => c.findOneAndDelete(filter),
        error =>
          new ServerError(
            500,
            `Unable to delete a document in collection ${this.name}`,
            { error, filter },
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
