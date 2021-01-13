import Async from "../async.js"

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
    this.succeed({ done: true })
  }
}

export default Read
