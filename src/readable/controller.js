import * as Stream from "./stream.js"
import { CloseError } from "./error.js"
import * as Source from "./source.js"
/**
 * @template T
 * @typedef {import('../types/readable').StreamState<T>} State<T>
 */

/**
 * @template T
 * @implements {ReadableStreamDefaultController<T>}
 */
export class StreamController {
  /**
   * @param {State<T>} state
   */
  constructor(state) {
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
 *
 * @param {UnderlyingSource} source
 * @param {keyof UnderlyingSource} name
 */
const ensureMethod = (source, name) => {
  switch (typeof source[name]) {
    case "undefined":
    case "function":
      break
    default:
      throw new TypeError(
        `ReadbleStream source.{name} method is not a function`
      )
  }
}

/**
 * @template T
 * @param {import('../types/readable').Readable<T>} state
 */
export const start = (state) => {
  const { source } = state
  ensureMethod(source, "pull")
  ensureMethod(source, "cancel")
  const result = Source.start(source, ensureController(state))
  handleStart(state, result)
}

/**
 * @template T
 * @param {State<T>} state
 */
export const ensureController = (state) => {
  if (state.controller) {
    return state.controller
  } else {
    const controller = new StreamController(state)
    state.controller = controller
    return controller
  }
}

/**
 * @template T
 * @param {State<T>} state
 * @param {PromiseLike<unknown>|unknown} ready
 */
const handleStart = async (state, ready) => {
  try {
    await ready
    if (state.status === "readable") {
      state.started = true
      Stream.pull(state)
    }
  } catch (reason) {
    error(state, reason)
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
