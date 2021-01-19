import expect from "expect.js"

/**
 * @param {any} actual
 * @param {any} expected
 * @param {string} [message]
 */
export const assert_equals = (actual, expected, message) =>
  expect(actual, message).to.equal(expected)

/**
 *
 * @param {Function} type - A class error should be instance of
 * @param {Function} ex - Function that should throw
 * @param {string} [title]
 */
export const assert_throws_js = (type, ex, title) =>
  expect(ex, title).to.throw((error) => expect(error).to.be.a(type))

/**
 *
 * @param {any} error
 * @param {Function} ex
 * @param {string} [title]
 */
export const assert_throws_exactly = (error, ex, title) =>
  expect(ex, title).to.throw((e) => expect(e).to.be(error))

/**
 * @param {any} value
 * @param {string} [title]
 */
export const assert_true = (value, title) => expect(value, title).to.be(true)

/**
 * @param {any} value
 * @param {string} [title]
 */
export const assert_false = (value, title) => expect(value, title).to.be(false)

/**
 * @param {any} actual
 * @param {any} expected
 * @param {string} title
 */
export const assert_array_equals = (actual, expected, title) => {
  expect(expected).to.be.a("array")
  expect(actual).to.be.a("array")
  expect(actual, title).to.be.eql(expected)
}

/**
 *
 * @param {any} actual
 * @param {any} expected
 * @param {string} [title]
 */
export const assert_not_equals = (actual, expected, title) =>
  expect(actual, title).to.not.equal(expected)

/**
 * @param {number} ms
 * @returns {Promise<void>}
 */
export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 *
 * @param {any} actual
 * @param {any} expected
 * @param {string} [title]
 */
export const assert_object_equals = (actual, expected, title) =>
  expect(expected, title).to.eql(actual)

/**
 * @param {string} message
 */
export const assert_unreached = (message) => expect().fail(message)

/**
 *
 * @param {any} _unit
 * @param {any} error
 * @param {Promise<any>} promise
 */
export const promise_rejects_exactly = async (_unit, error, promise) =>
  promise.catch((reason) => expect(reason).to.be(error))

// For tests which verify that the implementation doesn't do something it shouldn't, it's better not to use a
// timeout. Instead, assume that any reasonable implementation is going to finish work after 2 times around the event
// loop, and use flushAsyncEvents().then(() => assert_array_equals(...));
// Some tests include promise resolutions which may mean the test code takes a couple of event loop visits itself. So go
// around an extra 2 times to avoid complicating those tests.
export const flushAsyncEvents = () =>
  delay(0)
    .then(() => delay(0))
    .then(() => delay(0))
    .then(() => delay(0))

/**
 * @typedef {{
 *   test(unit: Function, title:string): void
 *   promise_test(unit: (test:Test) => void, title?:string): void
 * }} WPT
 */

/**
 * @param {(wpt:WPT) => void} test
 */
export const adapt = (test) =>
  /**
   * @param {import('./mocha.js').Mocha} mocha
   */
  ({ it }) => {
    test({
      test: (unit, title) => it(title, unit),
      promise_test: (unit, title = "") => it(title, () => unit(new Test())),
    })
  }

class Test {
  constructor() {
    this.phases = {
      INITIAL: 0,
      STARTED: 1,
      HAS_RESULT: 2,
      CLEANING: 3,
      COMPLETE: 4,
    }
    this.phase = this.phases.INITIAL
  }
  /**
   * @template {any[]} Args
   * @param {(...args:Args) => any} func
   * @param {any} this_obj
   * @see https://github.com/web-platform-tests/wpt/blob/21d041e20ea00af008b8aee4fc8169d7ad9d1ff9/resources/testharness.js#L2059-L2072
   */
  step_func(func, this_obj = this) {
    /**
     * @param {Args} args
     */
    const func2 = (...args) => {
      this.step(func, this_obj, ...args)
    }
    return func2
  }
  /**
   * @template {any[]} Args
   * @param {(...args:Args) => any} func
   * @param {any} [this_obj]
   * @param {Args} args
   * @see https://github.com/web-platform-tests/wpt/blob/21d041e20ea00af008b8aee4fc8169d7ad9d1ff9/resources/testharness.js#L2021-L2057
   */
  step(func, this_obj, ...args) {
    // if (this.phase > this.phases.STARTED) {
    //   return
    // }
    // this.phase = this.phases.STARTED
    // //If we don't get a result before the harness times out that will be a test timeout
    // this.set_status(this.TIMEOUT, "Test timed out")

    // tests.started = true
    // tests.notify_test_state(this)

    // if (this.timeout_id === null) {
    //   this.set_timeout()
    // }

    // this.steps.push(func)

    // if (arguments.length === 1) {
    //   this_obj = this
    // }

    try {
      return func.apply(this_obj, args)
    } catch (e) {
      expect().fail(e)
      //   if (this.phase >= this.phases.HAS_RESULT) {
      //     return
      //   }
      //   var status =
      //     e instanceof OptionalFeatureUnsupportedError
      //       ? this.PRECONDITION_FAILED
      //       : this.FAIL
      //   var message = String(typeof e === "object" && e !== null ? e.message : e)
      //   var stack = e.stack ? e.stack : null

      //   this.set_status(status, message, stack)
      //   this.phase = this.phases.HAS_RESULT
      //   this.done()
    }
  }
}
