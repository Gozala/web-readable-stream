import Constants from "../constants.js"

/**
 * @template T
 * @param {UnderlyingSource<T>} underlyingSource
 * @returns {{
 * start:ReadableStreamDefaultControllerCallback<T>,
 * pull: ReadableStreamDefaultControllerCallback<T>,
 * cancel: ReadableStreamErrorCallback
 * }}
 */
const setup = (underlyingSource) => {
  const { start, pull, cancel } = underlyingSource
  return {
    start: start === undefined ? noop : start.bind(underlyingSource),
    pull: pull === undefined ? noop : pull.bind(underlyingSource),
    cancel: cancel === undefined ? noop : cancel.bind(underlyingSource),
  }
}

const noop = () => {}

/**
 * @template T
 * @param {UnderlyingSource} source
 * @param {ReadableStreamDefaultController<T>} controller
 * @returns {Promise<void>}
 */
export const start = (source, controller) => {
  if (source.start !== undefined) {
    return Promise.resolve(source.start(controller))
  }
  return Constants.voidPromise
}
