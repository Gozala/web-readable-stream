/**
 * @param {string} message
 * @returns {never}
 */
const throwStreamError = (message) => {
  throw new StreamError(message)
}

export class StreamError extends TypeError {
  /**
   * @returns {(message:string) => never}
   */
  static get throw() {
    if (this === StreamError) {
      return throwStreamError
    } else {
      const Error = this
      /**
       * @param {string} message
       * @returns {never}
       */
      const value = (message) => {
        throw new Error(message)
      }
      Object.defineProperty(this, "throw", { value })
      return value
    }
  }
  get name() {
    return this.constructor.name
  }
}

export class CloseError extends StreamError {}
export class ReleaseError extends StreamError {
  constructor(
    message = `The ReadableStream reader method 'releaseLock' may not be called on a reader with read requests`
  ) {
    super(message)
  }
}

export class EnqueueError extends StreamError {}
export class CancelError extends StreamError {}
export class LockError extends StreamError {}

export class AbortError extends Error {
  /**
   * @param {string} message
   * @returns {never}
   */
  static throw(message) {
    throw new AbortError(message)
  }

  constructor(message = "Aborted") {
    super(message)
  }

  /**
   * @type {'AbortError'}
   */
  get name() {
    return "AbortError"
  }
}

/**
 * @param {Error} error
 * @returns {never}
 */
const throwWrappedError = (error) => {
  throw new WrappedError(error)
}

/**
 * @template {string} Name
 */
export class WrappedError extends Error {
  /**
   * @returns {(error:Error) => never}
   */
  static get throw() {
    if (this === WrappedError) {
      return throwWrappedError
    } else {
      const Error = this
      /**
       * @param {Error} error
       * @returns {never}
       */
      const value = (error) => {
        throw new Error(error)
      }
      Object.defineProperty(this, "throw", { value })
      return value
    }
  }
  /**
   * @param {Error} reason
   */
  constructor(reason) {
    super(reason.message)
    this.reason = reason
  }
  /**
   * @returns {Name}
   */
  get name() {
    // @ts-ignore
    return this.constructor.name
  }
  get stack() {
    return this.reason.stack
  }
}
