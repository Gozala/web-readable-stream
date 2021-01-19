import * as Reader from "./reader.js"
import * as Stream from "./stream.js"
import { CancelError, LockError } from "./error.js"
import * as Controller from "./controller.js"

/**
 * @template T
 * @typedef {import('../types/readable').StreamState<T>} State
 */

export const isLocked = Stream.isLocked

/**
 * @template T
 * @param {UnderlyingSource<T>|UnderlyingByteSource} source
 * @param {QueuingStrategy<T>} strategy
 * @returns {State<T>}
 */
export const init = (source, strategy) => {
  if (source.type === undefined) {
    const state = Stream.create(source, strategy)
    Controller.start(state)
    return state
  } else if (String(source.type) === "bytes") {
    throw new TypeError(
      `support for 'new ReadableStream({ type: "bytes" })' is not yet implemented`
    )
  } else {
    throw new TypeError(`'underlyingSource.type' must be "bytes" or undefined.`)
  }
}

/**
 * @template T
 * @param {State<T>} stream
 * @param {Error|undefined} reason
 * @returns {Promise<void>}
 */
export const cancel = (stream, reason) => {
  if (isLocked(stream)) {
    throw new CancelError(
      `The ReadableStream reader method 'cancel' may only be called on a reader owned by a stream.`
    )
  } else {
    return Stream.cancel(stream, reason)
  }
}

/**
 * @template T
 * @param {State<T>} stream
 * @param {{mode:"byob"}} [options]
 * @returns {ReadableStreamDefaultReader<T>}
 */
export const getReader = (stream, options) => {
  if (isLocked(stream)) {
    throw new LockError(
      "A Reader may only be created for an unlocked ReadableStream"
    )
  } else if (!options || options.mode === undefined) {
    const state = Reader.init(stream)
    stream.reader = state
    return new Reader.Reader(state)
  } else if (options.mode === "byob") {
    throw new TypeError("byob readers ar not supported")
  } else {
    throw new TypeError(
      `Invalid mode "${options.mode}" passed to a getReader method of ReadableStream`
    )
  }
}

/**
 * @template T
 * @param {State<T>} state
 * @returns {[ReadableStream<T>, ReadableStream<T>]}
 */
export const tee = (state) => {
  void state
  throw new Error("Not implemented")
}
