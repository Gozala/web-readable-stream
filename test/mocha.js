/**
 * @typedef {{
 *  describe: {
 *    (name: string, group: Function): void
 *    skip(name: string, group: Function): void
 *   }
 *  it: {
 *    (name: string, unit: Function): void
 *    skip(name: string, unit: Function): void
 *  }
 * }} Mocha
 *
 * @type {Mocha}
 */
// @ts-ignore
const mocha = { describe, it }
export default mocha
