import Async from "../async.js"
import Constants from "../constants.js"

/**
 * @template T
 * @extends {Async<ReadableStreamReadResult<T>>}
 */
export class Read extends Async {
  /**
   * @param {T} chunk
   */
  return(chunk) {
    this.succeed({ done: false, value: chunk })
  }
  /**
   * @param {Error} error
   */
  throw(error) {
    this.fail(error)
  }
  close() {
    this.succeed(Constants.done)
  }
}

export default Read
