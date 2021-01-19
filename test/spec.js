import mocha from "./mocha.js"
import { adapt } from "./wpt.js"

import mochaTests from "./mocha/index.js"
import wptTests from "./wpt/index.js"

mochaTests(mocha)
adapt(wptTests)(mocha)
