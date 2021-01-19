export interface ReadableStreamLike<R> {
  readonly locked: boolean
  cancel(reason?: any): Promise<void>
  getReader(): ReadableStreamDefaultReader<R>
}

export interface ReadRequest<T> {
  result: Promise<ReadableStreamReadResult<T>>
  return(chunk: T): void
  throw(reason?: Error): void
  close(): void
}

export interface ReaderState<T> {
  stream: StreamState<T> | null
  closed: Async<void> | null
}
export interface Reader<T> {
  state: ReaderState<T>

  closed: Promise<void>

  cancel(reason?: Error): Promise<void>

  read(): Promise<ReadableStreamReadResult<T>>
  releaseLock(): void
}

export type StreamState<T> = Readable<T> | Closed<T> | Errored<T>

export interface StreamController<T> extends ReadableStreamDefaultController {}

export interface BaseState<T> {
  reader: ReaderState<T> | null
  controller: StreamController<T> | null

  source: UnderlyingSource<T>

  disturbed: boolean

  chunkSize: QueuingStrategySizeCallback<T>
  highWaterMark: number
}

export interface Readable<T> extends BaseState<T> {
  started: boolean
  status: "readable"

  readRequests: ReadRequest<T>[]
  closeRequested: boolean

  queueTotalSize: number
  queue: T[]

  pulling: boolean
  pullAgain: boolean

  error: null
}

export interface Closed<T> extends BaseState<T> {
  status: "closed"
}

export interface Errored<T> extends BaseState<T> {
  status: "errored"
  error: Error
}

export interface Async<T> {
  readonly result: Promise<T>
  succeed(value: T): void
  fail(error: Error): void
}
