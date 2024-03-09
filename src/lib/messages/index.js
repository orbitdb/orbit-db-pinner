import { toString as uint8ArrayToString } from 'uint8arrays/to-string'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import pinMessage from './pin.js'
import unpinMessage from './unpin.js'

export const Messages = Object.freeze({
  PIN: pinMessage,
  UNPIN: unpinMessage
})

export const processMessage = (registry, pinnedDBs) => source => {
  return (async function * () {
    for await (const chunk of source) {
      const { message, ...params } = JSON.parse(uint8ArrayToString(chunk.subarray()))

      const func = Messages[message]
      let response

      if (func) {
        response = await func(registry, pinnedDBs, params)
        yield uint8ArrayFromString(JSON.stringify(response))
      } else {
        throw new Error(`unknown function ${func}`)
      }
    }
  })()
}
