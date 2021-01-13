import { AbortError } from "./readable/error.js"

/**
 * @template T
 * @extends {Promise<T>}
 */
export default class AbortablePromise extends Promise {
  /**
   *
   * @param {AbortSignal} signal
   */
  static from(signal) {
    const promise = new AbortablePromise()
    if (signal.aborted) {
      promise.abort()
    } else {
      signal.addEventListener("abort", promise.abort, { once: true })
    }

    return promise
  }

  /**
   *
   * @param {(succeed:(value:T) => void, fail:(error:Error) => void) => void} [executor]
   */
  constructor(executor) {
    super((resolve, reject) => {
      this.abort = () => {
        reject(new AbortError())
        this.aborted = true
      }

      if (executor) {
        executor(resolve, reject)
      }
    })
    this.aborted = false
  }

  /**
   * @param {Event} event
   */
  handleEvent(event) {
    if (event.type === "abort") {
      this.abort()
    }
  }
  /**
   * @template U
   * @param {PromiseLike<U>} other
   * @returns {Promise<T|U>}
   */
  or(other) {
    if (this.aborted) {
      return this
    } else {
      return Promise.race([this, other])
    }
  }
}
