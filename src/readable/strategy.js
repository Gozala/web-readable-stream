import { isNonNegativeNumber, one } from "../util.js"

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

/**
 * @template T
 * @param {QueuingStrategy<T>} strategy
 * @returns {Required<QueuingStrategy<T>>}
 */
export const from = (strategy) => ({
  highWaterMark: decodeHighWaterMark(strategy.highWaterMark, 1),
  size: decodeSize(strategy, one),
})

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
      throw new RangeError(
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
      return (chunk) => {
        const n = size.call(strategy, chunk)
        if (isNonNegativeNumber(n)) {
          return n
        } else {
          throw new RangeError(`'size' must be a finite, non-negative number`)
        }
      }
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
