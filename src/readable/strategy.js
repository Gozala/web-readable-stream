import { isNonNegativeNumber } from "../util.js"
export class CountQueuingStrategy {
  /**
   *
   * @param {Object} options
   * @param {number} options.highWaterMark
   */
  constructor({ highWaterMark }) {
    if (!isNonNegativeNumber(highWaterMark)) {
      throw new RangeError(
        `A queuing strategy's highWaterMark property must be a nonnegative, non-NaN number`
      )
    }
    /**
     * @readonly
     */
    this.highWaterMark = highWaterMark
  }
  size() {
    return 1
  }
}
