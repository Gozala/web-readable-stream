// Note it is impossible to implement `ReadableStream` interface in JS
// due to lack of method overload support in TS via JSDoc syntax. Use
// this file to workaround this limitation.
// @see https://github.com/microsoft/TypeScript/issues/25590#issuecomment-759315975
export default globalThis.ReadableStream
