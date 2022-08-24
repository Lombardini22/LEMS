export class ServerError extends Error {
  readonly status: number
  readonly extra?: any

  constructor(status: number, message: string, extra?: any) {
    super(message)

    this.status = status
    this.message = message

    if (extra) {
      this.extra = extra
    }
  }
}
