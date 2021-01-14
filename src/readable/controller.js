import * as Stream from "./stream.js"
import { CloseError } from "./error.js"

/**
 * @template T
 * @typedef {import('../types/readable').StreamState<T>} State<T>
 */

/**
 * @template T
 * @implements {ReadableStreamDefaultController<T>}
 */
export class Controller {
  /**
   * @param {State<T>} state
   */
  constructor(state) {
    /** @private */
    this.state = state
  }

  /**
   * @type {number|null}
   */
  get desiredSize() {
    return desiredSize(this.state)
  }

  /**
   * @returns {void}
   */
  close() {
    return close(this.state)
  }

  /**
   * @param {T} chunk
   * @returns {void}
   */
  enqueue(chunk) {
    return enqueue(this.state, chunk)
  }

  /**
   * @param {Error} reason
   * @returns {void}
   */
  error(reason) {
    return error(this.state, reason)
  }
}

/**
 * @template T
 * @param {State<T>} state
 */
export const close = (state) => {
  switch (state.status) {
    case "errored": {
      throw new CloseError(
        `'close' may only be called on a stream in the 'readable' state`
      )
    }
    case "readable": {
      if (!state.closeRequested) {
        state.closeRequested = true
        // Stream.update
        if (state.queue.length === 0) {
          Stream.close(state)
        }
      }
      return
    }
  }

  throw new CloseError(`'close' called on a stream that is already closing`)
}

/**
 * @template T
 * @param {State<T>} state
 * @param {Error|undefined} reason
 * @returns {PromiseLike<void>|void}
 */
export const cancel = ({ source }, reason) => {
  if (typeof source.cancel === "function") {
    return source.cancel(reason)
  }
}
/**
 * @template T
 * @param {State<T>} state
 * @param {T} chunk
 */
export const enqueue = (state, chunk) => Stream.enqueue(state, chunk)

/**
 * @template T
 * @param {State<T>} state
 * @param {Error} reason
 */
export const error = (state, reason) => {
  if (state.status === "readable") {
    Stream.clearQueue(state)
    Stream.error(state, reason)
  }
}

/**
 * @template T
 * @param {State<T>} state
 */
export const desiredSize = (state) => Stream.getDesiredSize(state)
