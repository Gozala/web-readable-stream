import general from "./general.js"
import badSource from "./bad-underlying-sources.js"

/**
 * @param {import('../wpt').WPT} wpt
 */
export default (wpt) => {
  general(wpt)
  badSource(wpt)
}
