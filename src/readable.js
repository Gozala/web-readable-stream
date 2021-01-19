import { init, isLocked, cancel, getReader, tee } from "./readable/readable.js"
import { pipeTo, pipeThrough } from "./readable/pipe.js"

/**
 * @template T
 */
export default class Readable {
  /**
   *
   * @param {UnderlyingSource<T>|UnderlyingByteSource} [underlyingSource]
   * @param {QueuingStrategy<T>} [queuingStrategy]
   */
  constructor(underlyingSource = {}, queuingStrategy = {}) {
    /**
     * @private
     * @type {import('./types').State<T>}
     */
    this.state = init(underlyingSource, queuingStrategy)
  }

  /**
   * @returns {boolean}
   */
  get locked() {
    return isLocked(this.state)
  }

  /**
   * @param {Error} [reason]
   * @returns {Promise<void>}
   */
  cancel(reason) {
    return cancel(this.state, reason)
  }

  /**
   * @template {[{mode:"byob"}]|[]} Args
   * @param {Args} args
   * @returns {Args extends [] ? ReadableStreamDefaultReader<T> : ReadableStreamBYOBReader}
   */
  getReader(...[options]) {
    return getReader(this.state, options)
  }

  /**
   * @template U
   * @param {TransformStream<T, U>} transform
   * @param {PipeOptions} [options]
   * @returns {ReadableStream<U>}
   */
  pipeThrough(transform, options = {}) {
    return pipeThrough(this, transform, options)
  }

  /**
   * @param {WritableStream<T>} destination
   * @param {PipeOptions} [options]
   * @returns {Promise<void>}
   */
  pipeTo(destination, options = {}) {
    return pipeTo(this, destination, options)
  }

  /**
   * @returns {[ReadableStream<T>, ReadableStream<T>]}
   */
  tee() {
    return tee(this.state)
  }
}
