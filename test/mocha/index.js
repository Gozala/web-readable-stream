import basic from "./basic.js"
import readable from "./use.js"

/**
 * @param {import('../mocha.js').Mocha} mocha
 */
export default (mocha) => {
  mocha.describe("basic tests", () => basic(mocha))
  mocha.describe("less basic", () => readable(mocha))
}
