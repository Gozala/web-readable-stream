import * as Stream from "./stream.js"
import Read from "./read.js"
import Async from "../async.js"

/**
 * @template T
 * @typedef {import('../types/readable').ReaderState<T>} State<T>
 */
/**
 * @template T
 * @implements {ReadableStreamDefaultReader<T>}
 */
export class Reader {
  /**
   * @param {State<T>} state
   */
  constructor(state) {
    /** @private */
    this.state = state
  }

  get closed() {
    return closed(this.state)
  }
  releaseLock() {
    return releaseLock(this.state)
  }
  read() {
    return read(this.state)
  }

  /**
   * @param {Error} [reason]
   */
  cancel(reason) {
    return cancel(this.state, reason)
  }
}

/**
 * @template T
 * @typedef {import('../types/readable').StreamState<T>} StreamState<T>
 */

/**
 * @template T
 * @param {StreamState<T>} stream
 * @returns {State<T>}
 */
export const init = (stream) => ({
  stream,
  closed: new Async(),
})

/**
 * Returns stream for this reader or throws an exception if reader has released
 * a lock.
 *
 * @template T
 * @param {State<T>} state
 * @returns {StreamState<T>}
 */
export const streamOf = ({ stream }) => {
  if (stream) {
    return stream
  } else {
    throw Error("This reader does not have associated stream")
  }
}

/**
 * @template T
 * @param {State<T>} state
 * @returns {Promise<void>}
 */
export const closed = (state) => {
  // `closed` promise is allocated lazily because it is only used by the
  // user of the high level API. Which is why if `state.closed` is present
  // it is returned
  if (state.closed) {
    return state.closed.result
    // Otherwise new async is allocated saved into a state and it's result is
    // returned.
  } else {
    const closed = new Async()
    state.closed = closed
    return closed.result
  }
}

/**
 * Releases the reader’s lock on the corresponding stream.
 *
 * @template T
 * @param {State<T>} state
 * @returns {void}
 */
export const releaseLock = (state) => Stream.releaseLock(streamOf(state))

/**
 * @template T
 * @param {State<T>} state
 * @returns {Promise<ReadableStreamReadResult<T>>}
 * @see https://streams.spec.whatwg.org/#default-reader-read
 */
export const read = async (state) => {
  const stream = streamOf(state)
  /** @type {Read<T>} */
  const request = new Read()
  /** @see https://streams.spec.whatwg.org/#readable-stream-default-reader-read */
  stream.disturbed = true

  switch (stream.status) {
    case "closed": {
      request.close()
      break
    }
    case "errored": {
      request.throw(stream.error)
      break
    }
    case "readable": {
      pull(stream, request)
      break
    }
  }

  return request.result
}

/**
 * @template T
 * @param {State<T>} state
 * @param {Error|undefined} reason
 * @return {Promise<void>}
 */
export const cancel = async (state, reason) =>
  Stream.cancel(streamOf(state), reason)

/**
 * @template T
 * @param {import('../types/readable').Readable<T>} state
 * @param {import('../types/readable').ReadRequest<T>} request
 */
const pull = (state, request) => {
  if (state.queue.length > 0) {
    const chunk = /** @type {T} */ (state.queue.shift())
    if (state.closeRequested && state.queue.length === 0) {
      // Stream.clearController(state)
      Stream.close(state)
    } else {
      Stream.pull(state)
    }
    request.return(chunk)
  } else {
    state.readRequests.push(request)
    Stream.pull(state)
  }
}
