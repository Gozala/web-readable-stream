export default class Constants {
  static get CanNotCancelLocked() {
    const error = new TypeError(
      "Cannot cancel a stream that already has a reader"
    )
    const value = Promise.reject(error)
    Object.defineProperty(this, "CanNotCancelLocked", { value })
    return value
  }
  static get CanNotCancelReleased() {
    const error = new TypeError(
      `Failed to execute 'cancel' on reader: This readable stream reader has been released and cannot be used to cancel its previous owner stream`
    )
    const value = Promise.reject(error)
    Object.defineProperty(this, "CanNotCancelReleased", { value })
    return value
  }
  static get CanNotReadReleased() {
    const error = new TypeError(
      `Failed to execute 'read' on 'ReadableStreamDefaultReader': This readable stream reader has been released and cannot be used to read from its previous owner stream`
    )
    const value = Promise.reject(error)
    Object.defineProperty(this, "CanNotReadReleased", { value })
    return value
  }
  static get voidPromise() {
    const value = Promise.resolve()
    Object.defineProperty(this, "voidPromise", { value })
    return value
  }
  static get neverPromise() {
    /** @type {Promise<never>} */
    const value = new Promise(() => {})
    Object.defineProperty(this, "neverPromise", { value })
    return value
  }

  static get Done() {
    /** @type {IteratorReturnResult<void> & ReadableStreamReadDoneResult<any>} */
    const value = Object.freeze({ done: true, value: undefined })
    Object.defineProperty(this, "Done", { value })
    return value
  }

  static get EmptyObject() {
    const value = Object.freeze({})
    Object.defineProperty(this, "EmptyObject", { value })
    return value
  }
}
