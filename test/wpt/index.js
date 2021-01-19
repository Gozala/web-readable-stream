import general from "./general.any.js"
import badUnderlyingSources from "./bad-underlying-sources.any.js"
import badStrategies from "./bad-strategies.any.js"
import constructor from "./constructor.any.js"

/**
 * @param {import('../wpt').WPT} wpt
 */
export default (wpt) => {
  badStrategies(wpt)
  badUnderlyingSources(wpt)
  constructor(wpt)
  general(wpt)
}
