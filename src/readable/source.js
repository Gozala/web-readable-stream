/**
 * @template T
 * @param {UnderlyingSource<T>} underlyingSource
 * @returns {import('../types/readable').Source<T>}
 */
export const from = (underlyingSource) => {
  return {
    start: bindMethod(underlyingSource, "start") || noop,
    pull: bindMethod(underlyingSource, "pull") || noop,
    cancel: bindMethod(underlyingSource, "cancel") || noop,
  }
}

const noop = () => {}

/**
 * @template T
 * @template {'start'|'cancel'|'pull'} Name
 * @param {UnderlyingSource<T>} source
 * @param {Name} name
 * @returns {UnderlyingSource<T>[Name]}
 */
const bindMethod = (source, name) => {
  const method = source[name]
  switch (typeof method) {
    case "undefined":
      return undefined
    case "function":
      return method.bind(source)
    default:
      throw new TypeError(
        `ReadbleStream source.{name} method is not a function`
      )
  }
}
