import { ReadableStream } from "../../src/lib.js"
import expect from "expect.js"
// import {ReadableStreamBYOBReader} from "./readable_stream_byob_reader.ts";
// import {ReadableStreamDefaultReader} from "./readable_stream_reader.ts";

/**
 * @param {import('../mocha').Mocha} mocha
 */
export default ({ it }) => {
  it("basic", async () => {
    const src = [0, 1, 2, 3, 4, 5, 6]
    let i = 0
    /** @type {ReadableStream<number>} */
    const stream = new ReadableStream({
      start: (controller) => {
        controller.enqueue(src[i++])
      },
      pull: (controller) => {
        controller.enqueue(src[i++])
        if (i >= src.length) {
          controller.close()
          return
        }
      },
    })

    /** @type {ReadableStreamDefaultReader<number>} */
    const reader = stream.getReader()
    for (let i = 0; i < src.length + 1; i++) {
      const { value, done } = await reader.read()
      if (i < 7) {
        expect(value).to.be(i)
      } else {
        expect(done).to.be(true)
      }
    }
  })

  it("queueuing strategy with size", async () => {
    const src = [0, 1, 2, 3, 4, 5]
    let i = 0
    const stream = new ReadableStream(
      {
        pull: (controller) => {
          controller.enqueue(src.slice(i, i + 2))
          i += 2
          if (i >= src.length) {
            controller.close()
            return
          }
        },
      },
      {
        /**
         *
         * @param {number[]} chunk
         */
        size: (chunk) => chunk.length,
      }
    )
    const reader = stream.getReader()
    for (let i = 0; i < src.length + 1; i += 2) {
      const { value, done } = await reader.read()
      if (i < src.length) {
        expect(value).to.eql([i, i + 1])
      } else {
        expect(done).to.be(true)
      }
    }
  })

  it.skip("byob streams", async () => {
    const src = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7])
    const stream = new ReadableStream({
      type: "bytes",
      start: (controller) => {
        controller.enqueue(src)
      },
      pull: (controller) => {
        controller.close()
      },
    })
    const reader = stream.getReader({ mode: "byob" })
    expect(reader).to.be.a(ReadableStreamBYOBReader)
    const buf = new Uint8Array(4)
    const res1 = await reader.read(buf)
    expect(res1.done).to.be(false)
    expect([...buf]).to.be.eql([0, 1, 2, 3])
    const res2 = await reader.read(buf)
    expect(res2.done).to.be(false)
    expect([...buf]).to.be.eql([4, 5, 6, 7])
    const res3 = await reader.read(buf)
    expect(res3.done).to.be(true)
    // expect(stream.state).to.be("closed")
  })

  it.skip("byte stream with Uint16Array", async () => {
    const src = new Uint16Array([0x1234, 0x5678])
    const stream = new ReadableStream({
      type: "bytes",
      start: (controller) => {
        controller.enqueue(src)
      },
      pull: (controller) => {
        controller.close()
      },
    })
    const reader = stream.getReader({ mode: "byob" })
    expect(reader).to.be.a(ReadableStreamBYOBReader)
    const buf = new Uint8Array(2)
    const res1 = await reader.read(buf)
    expect(res1.done).to.be(false)
    let view = new DataView(buf.buffer)
    expect(view.getInt16(0, true)).to.be(0x1234)
    const res2 = await reader.read(buf)
    view = new DataView(buf.buffer)
    expect(res2.done).to.be(false)
    expect(view.getInt16(0, true)).to.be(0x5678)
    const res3 = await reader.read(buf)
    expect(res3.done).to.be(true)
  })
}
