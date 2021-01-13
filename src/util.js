
/**
 * @param {any} value
 * @returns {value is number}
 */
export const isNonNegativeNumber = value =>
  typeof value === 'number' &&  value >= 0 && !isNaN(value) && isFinite(value)

/**
 * @returns {number}
 */
export const one = () => 1
