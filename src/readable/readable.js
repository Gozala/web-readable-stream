import * as Reader from "./reader.js"
import * as Stream from "./stream.js"
import { CancelError, LockError } from "./error.js"

/**
 * @template T
 * @typedef {import('../types/readable').StreamState<T>} State
 */

export const isLocked = Stream.isLocked
export const init = Stream.create

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
 * @returns {ReadableStreamDefaultReader<T>}
 */
export const getReader = (stream) => {
  if (isLocked(stream)) {
    throw new LockError(
      "A Reader may only be created for an unlocked ReadableStream"
    )
  } else {
    const state = Reader.init(stream)
    stream.reader = state
    return new Reader.Reader(state)
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
