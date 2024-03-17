import { toString as uint8ArrayToString } from 'uint8arrays/to-string'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import pinMessage from './pin.js'
import unpinMessage from './unpin.js'

export const Messages = Object.freeze({
  PIN: pinMessage,
  UNPIN: unpinMessage
})

export const processMessage = (pinner) => source => {
  return (async function * () {
    for await (const chunk of source) {
      const { message, signature, pubkey, ...params } = JSON.parse(uint8ArrayToString(chunk.subarray()))
      // check that the user is authorized to store their dbs on this pinner.
      if (!await pinner.auth.hasAccess(pubkey)) {
        throw new Error('user is not authorized to pin')
      }

      // verify that the params have come from the user who owns the pubkey.
      if (!await pinner.orbitdb.identity.verify(signature, pubkey, params)) {
        throw new Error('invalid signature')
      }

      const func = Messages[message]

      let response

      if (func) {
        response = await func(pinner, params)
        yield uint8ArrayFromString(JSON.stringify(response))
      } else {
        throw new Error(`unknown function ${func}`)
      }
    }
  })()
}
