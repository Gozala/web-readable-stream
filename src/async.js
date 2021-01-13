/** @type {(value:any) => void} */
let succeed
/** @type {(error:Error) => void} */
let fail

/**
 * @template T
 * @param {(value: T) => void} resolve
 * @param {(error: Error) => void} reject
 */
const init = (resolve, reject) => {
  succeed = resolve
  fail = reject
}

/**
 * @template T
 */
export default class Async {
  /**
   * @template T
   * @param {T} value
   * @returns {Async<T>}
   */
  static succeed(value) {
    const success = new Async()
    success.succeed(value)
    return success
  }
  /**
   * @param {Error} error
   * @returns {Async<any>}
   */
  static fail(error) {
    const failure = new Async()
    failure.fail(error)
    return failure
  }
  constructor() {
    /** @type {Promise<T>} */
    this.result = new Promise(init)
    /** @type {(value:T) => void} */
    this.succeed = succeed
    /** @type {(error:Error) => void} */
    this.fail = fail
  }
}
