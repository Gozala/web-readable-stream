import general from "./general.any.js"
import badSource from "./bad-underlying-sources.any.js"
import constructor from "./constructor.any.js"

/**
 * @param {import('../wpt').WPT} wpt
 */
export default (wpt) => {
  general(wpt)
  badSource(wpt)
  constructor(wpt)
}
