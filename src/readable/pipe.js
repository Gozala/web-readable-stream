import { AbortError, WrappedError } from "./error.js"
import AbortablePromise from "../abortable.js"
import Constants from "../constants.js"

/**
 * @template I, O
 * @param {import('../types/readable.js').ReadableStreamLike<I>} source
 * @param {TransformStream<I, O>} transform
 * @param {PipeOptions} options
 * @returns {ReadableStream<O>}
 */
export const pipeThrough = (source, { readable, writable }, options) => {
  pipeTo(source, writable, options).finally()
  return readable
}

/**
 * @template T
 * @param {import('../types/readable.js').ReadableStreamLike<T>} source
 * @param {WritableStream<T>} destination
 * @param {PipeOptions} options
 */
export const pipeTo = async (source, destination, options) => {
  const reader = source.getReader()
  const writer = destination.getWriter()
  const aborted = options.signal
    ? AbortablePromise.from(options.signal)
    : new AbortablePromise()
  try {
    while (true) {
      await aborted.or(writer.ready.catch(WriterError.throw))
      const read = await aborted.or(reader.read().catch(ReaderError.throw))
      if (read.done) {
        if (!options.preventClose) {
          await aborted.or(writer.close().catch(WriterError.throw))
        }
        return
      } else {
        await aborted.or(writer.write(read.value).catch(WriterError.throw))
      }
    }
  } catch (exception) {
    /** @type {ReaderError|WriterError|AbortError} */
    const error = exception
    switch (error.name) {
      case "ReaderError": {
        await cancel(reader, error.reason, options).finally()
        throw error.reason
      }
      case "WriterError": {
        await abort(writer, error.reason, options).finally()
        throw error.reason
      }
      case "AbortError": {
        await Promise.all([
          abort(writer, error, options).finally(),
          cancel(reader, error, options).finally(),
        ])
        throw error
      }
    }
  } finally {
    reader.releaseLock()
    writer.releaseLock()
  }
}

/**
 * @template T
 * @param {WritableStreamDefaultWriter<T>} writer
 * @param {Error} error
 * @param {PipeOptions} options
 */
const abort = async (writer, error, { preventAbort, preventClose }) => {
  if (!preventAbort) {
    return writer.abort(error)
  } else if (!preventClose) {
    return writer.close()
  } else {
    return Constants.voidPromise
  }
}

/**
 * @template T
 * @param {ReadableStreamDefaultReader<T>} reader
 * @param {Error} error
 * @param {PipeOptions} options
 */
const cancel = (reader, error, { preventCancel }) =>
  !preventCancel ? reader.cancel(error) : Constants.voidPromise

/**
 * @extends {WrappedError<'WriterError'>}
 */
class WriterError extends WrappedError {}
/**
 * @extends {WrappedError<'ReaderError'>}
 */
class ReaderError extends WrappedError {}
