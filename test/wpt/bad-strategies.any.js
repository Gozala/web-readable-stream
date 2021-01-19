import {
  assert_equals,
  assert_throws_js,
  assert_throws_exactly,
  assert_unreached,
  promise_rejects_exactly,
} from "../wpt.js"

import { ReadableStream, CountQueuingStrategy } from "../../src/lib.js"

/**
 * @param {import('../wpt').WPT} wpt
 */
export default ({ test, promise_test }) => {
  test(() => {
    const theError = new Error("a unique string")

    assert_throws_exactly(
      theError,
      () => {
        // @ts-expect-error
        new ReadableStream(
          {},
          {
            get size() {
              throw theError
            },
            highWaterMark: 5,
          }
        )
      },
      "construction should re-throw the error"
    )
  }, "Readable stream: throwing strategy.size getter")

  promise_test((t) => {
    const controllerError = { name: "controller error" }
    const thrownError = { name: "thrown error" }

    /** @type {ReadableStreamDefaultController<string>} */
    let controller
    const rs = new ReadableStream(
      {
        start(c) {
          controller = c
        },
      },
      {
        size() {
          controller.error(controllerError)
          throw thrownError
        },
        highWaterMark: 5,
      }
    )

    assert_throws_exactly(
      thrownError,
      () => controller.enqueue("a"),
      "enqueue should re-throw the error"
    )

    return promise_rejects_exactly(t, controllerError, rs.getReader().closed)
  }, "Readable stream: strategy.size errors the stream and then throws")

  promise_test((t) => {
    const theError = { name: "my error" }

    /** @type {ReadableStreamDefaultController<string>} */
    let controller
    const rs = new ReadableStream(
      {
        start(c) {
          controller = c
        },
      },
      {
        size() {
          controller.error(theError)
          return Infinity
        },
        highWaterMark: 5,
      }
    )

    assert_throws_js(
      RangeError,
      () => controller.enqueue("a"),
      "enqueue should throw a RangeError"
    )

    return promise_rejects_exactly(
      t,
      theError,
      rs.getReader().closed,
      "closed should reject with the error"
    )
  }, "Readable stream: strategy.size errors the stream and then returns Infinity")

  promise_test(() => {
    const theError = new Error("a unique string")
    const rs = new ReadableStream(
      {
        start(c) {
          assert_throws_exactly(
            theError,
            () => c.enqueue("a"),
            "enqueue should throw the error"
          )
        },
      },
      {
        size() {
          throw theError
        },
        highWaterMark: 5,
      }
    )

    return rs.getReader().closed.catch((e) => {
      assert_equals(e, theError, "closed should reject with the error")
    })
  }, "Readable stream: throwing strategy.size method")

  test(() => {
    const theError = new Error("a unique string")

    assert_throws_exactly(
      theError,
      () => {
        // @ts-expect-error
        new ReadableStream(
          {},
          {
            size() {
              return 1
            },
            get highWaterMark() {
              throw theError
            },
          }
        )
      },
      "construction should re-throw the error"
    )
  }, "Readable stream: throwing strategy.highWaterMark getter")

  test(() => {
    for (const highWaterMark of [-1, -Infinity, NaN, "foo", {}]) {
      assert_throws_js(
        RangeError,
        () => {
          // @ts-expect-error
          new ReadableStream(
            {},
            {
              size() {
                return 1
              },
              highWaterMark,
            }
          )
        },
        "construction should throw a RangeError for " + highWaterMark
      )
    }
  }, "Readable stream: invalid strategy.highWaterMark")

  promise_test(() => {
    const promises = []
    for (const size of [NaN, -Infinity, Infinity, -1]) {
      /** @type {any} */
      let theError
      const rs = new ReadableStream(
        {
          start(c) {
            try {
              c.enqueue("hi")
              assert_unreached("enqueue didn't throw")
            } catch (error) {
              assert_equals(
                error.name,
                "RangeError",
                "enqueue should throw a RangeError for " + size
              )
              theError = error
            }
          },
        },
        {
          size() {
            return size
          },
          highWaterMark: 5,
        }
      )

      promises.push(
        rs.getReader().closed.catch((e) => {
          assert_equals(
            e,
            theError,
            "closed should reject with the error for " + size
          )
        })
      )
    }

    return Promise.all(promises)
  }, "Readable stream: invalid strategy.size return value")
}
