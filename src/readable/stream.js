import { EnqueueError, ReleaseError } from "./error.js"
import Async from "../async.js"
import * as Controller from "./controller.js"
import { one } from "../util.js"
/**
 * @template T
 * @typedef {import('../types/readable').StreamState<T>} State
 */

/**
 * @template T
 * @param {State<T>} stream
 */
export const isLocked = (stream) => stream.reader != null

/**
 * @template T
 * @param {State<T>} stream
 * @param {Error|undefined} reason
 * @returns {Promise<void>}
 */
export const cancel = async (stream, reason) => {
  stream.disturbed = true
  switch (stream.status) {
    case "closed": {
      return undefined
    }
    case "errored": {
      throw stream.error
    }
    case "readable": {
      close(stream)
      await Controller.cancel(stream, reason)
      return undefined
    }
  }
}

/**
 * @template T
 * @param {State<T>} state
 * @returns {void}
 * @see https://streams.spec.whatwg.org/#readable-stream-reader-generic-release
 */
export const releaseLock = (state) => {
  switch (state.status) {
    case "readable": {
      if (state.readRequests.length > 0) {
        throw new ReleaseError(`Can not releaseLock with pending read requests`)
      }
    }
  }

  if (state.reader) {
    state.reader.stream = null
    state.reader = null
  }
}

/**
 * @template T
 * @param {State<T>} state
 * @param {T} chunk
 * @see https://streams.spec.whatwg.org/#readable-stream-default-controller-enqueue
 */
export const enqueue = (state, chunk) => {
  switch (state.status) {
    case "readable": {
      if (state.closeRequested) {
        throw new EnqueueError(`'enqueue' called on a stream already closing.`)
      } else if (state.readRequests.length > 0) {
        const request =
          /** @type {import('../types/readable').ReadRequest<T>} */
          (state.readRequests.shift())
        request.return(chunk)
      } else {
        try {
          // `chunkSize` may throw exception in which case we fail the stream.
          state.queueTotalSize += state.chunkSize(chunk)
          state.queue.push(chunk)

          if (typeof state.source.pull === "function") {
            pull(state)
          }
        } catch (reason) {
          error(state, reason)
        }
      }
      break
    }
    default: {
      throw new EnqueueError(
        `'enqueue' may only be called on a stream in the 'readable' state.`
      )
    }
  }
}

/**
 * @template T
 * @param {import('../types/readable').Readable<T>} state
 * @returns {Promise<void>}
 * @see https://streams.spec.whatwg.org/#readable-stream-default-controller-call-pull-if-needed
 */
export const pull = async (state) => {
  const { source, controller } = state
  if (typeof source.pull === "function") {
    if (needsPull(state)) {
      if (state.pulling) {
        state.pullAgain = true
      } else if (state.pullAgain) {
        throw Error(`'pullAgain' should not be true unless 'pulling' is`)
      } else {
        state.pulling = true
        try {
          await source.pull(controller)
          state.pulling = false
        } catch (reason) {
          state.pulling = false
          state.pullAgain = false
          error(state, reason)
        }

        // If another pull was scheduled during await repull.
        if (state.pullAgain) {
          state.pullAgain = false
          pull(state)
        }
      }
    }
  }
}

/**
 * @template T
 * @param {import('../types/readable').Readable<T>} state
 * @param {Error} reason
 */
export const error = (state, reason) => {
  const errored = asErrored(state, reason)
  for (const request of state.readRequests) {
    request.throw(reason)
  }
  state.readRequests.length = 0

  if (state.reader) {
    failClose(state.reader, reason)
  }
  void errored
}

/**
 * @template T
 * @param {import('../types/readable').Readable<T>} state
 */
export const clearQueue = (state) => {
  state.queue.length = 0
  state.queueTotalSize = 0
}

/**
 * @template T
 * @param {UnderlyingSource<T>} source
 * @param {QueuingStrategy<T>} strategy
 * @returns {State<T>}
 */
export const create = (source, strategy) => {
  /** @type {State<T>} */
  const state = {
    status: "readable",
    source,
    get controller() {
      // TODO: This is ugly, maybe we should use Controller instead of state
      // to avoid circular reference here.
      const controller = new Controller.Controller(state)
      Object.defineProperty(this, "controller", { value: controller })
      return controller
    },

    reader: null,
    disturbed: false,
    pulling: false,
    pullAgain: false,

    closeRequested: false,

    readRequests: [],

    queue: [],
    queueTotalSize: 0,

    highWaterMark: decodeHighWaterMark(strategy.highWaterMark, 1),
    chunkSize: decodeSize(strategy, one),

    error: null,
  }

  return state
}

/**
 * @param {any} highWaterMark
 * @param {number} defaultHighWaterMark
 * @returns {number}
 */
const decodeHighWaterMark = (highWaterMark, defaultHighWaterMark) => {
  if (typeof highWaterMark === "undefined") {
    return defaultHighWaterMark
  } else {
    const n = Number(highWaterMark)
    if (n < 0 || isNaN(n)) {
      throw new TypeError(
        `A queuing strategy's highWaterMark property must be a nonnegative, non-NaN number`
      )
    } else {
      return n
    }
  }
}

/**
 * @template T
 * @param {QueuingStrategy<T>} strategy
 * @param {QueuingStrategySizeCallback<T>} defaultSize
 * @returns {QueuingStrategySizeCallback<T>}
 */
const decodeSize = (strategy, defaultSize) => {
  const { size } = strategy
  switch (typeof size) {
    case "function": {
      return (chunk) => size.call(strategy, chunk)
    }
    case "undefined": {
      return defaultSize
    }
    default: {
      throw new TypeError(
        `A queuing strategy's size property must be a function`
      )
    }
  }
}

/**
 * @template T
 * @param {import('../types/readable').Readable<T>} state
 */
export const close = (state) => {
  const closed = asClosed(state)
  closed.status = "closed"
  for (const request of state.readRequests) {
    request.close()
  }
  state.readRequests.length = 0
  if (state.reader) {
    succeedClose(state.reader)
  }
}

/**
 * @template T
 * @param {import('../types/readable').BaseState<T> & { status: any }} state
 * @returns {import('../types/readable').Closed<T>}
 */
const asClosed = (state) => {
  state.status = "closed"
  return state
}

/**
 * @template T
 * @param {import('../types/readable').BaseState<T> & { status: any, error:any }} state
 * @param {Error} reason
 * @returns {import('../types/readable').Errored<T>}
 */
const asErrored = (state, reason) => {
  state.status = "errored"
  state.error = reason
  return state
}

/**
 * @template T
 * @param {State<T>} stream
 * @returns {number|null}
 */
export const getDesiredSize = (stream) => {
  switch (stream.status) {
    case "errored":
      return null
    case "closed":
      return 0
    case "readable":
      return stream.highWaterMark - stream.queueTotalSize
  }
}

/**
 * @template T
 * @param {State<T>} state
 * @returns {boolean}
 * @see https://streams.spec.whatwg.org/#readable-stream-default-controller-should-call-pull
 */
const needsPull = (state) => {
  if (state.status === "readable" && !state.closeRequested) {
    return (
      (isLocked(state) && state.readRequests.length > 0) ||
      state.queueTotalSize <= state.highWaterMark
    )
  } else {
    return false
  }
}

/**
 * @template T
 * @param {import('../types/readable').ReaderState<T>} state
 * @returns {void}
 */
const succeedClose = (state) => {
  if (state.closed) {
    state.closed.succeed()
  } else {
    state.closed = SUCCEED_CLOSE
  }
}

/**
 * @template T
 * @param {import('../types/readable').ReaderState<T>} state
 * @param {Error} error
 * @returns {void}
 */
const failClose = (state, error) => {
  if (state.closed) {
    state.closed.fail(error)
  } else {
    state.closed = Async.fail(error)
  }
}

const SUCCEED_CLOSE = Async.succeed(/** @type {void} */ (undefined))