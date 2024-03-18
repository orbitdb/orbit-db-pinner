import { toString as uint8ArrayToString } from 'uint8arrays/to-string'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import pinMessage from './pin.js'
import unpinMessage from './unpin.js'

export const Messages = Object.freeze({
  PIN: pinMessage,
  UNPIN: unpinMessage
})

export const Responses = Object.freeze({
  OK: 0,
  E_INVALID_SIGNATURE: 101,
  E_NOT_AUTHORIZED: 200,
  E_INTERNAL_ERROR: 300
})

export const processMessage = (pinner) => source => {
  return (async function * () {
    for await (const chunk of source) {
      const { message, signature, pubkey, ...params } = JSON.parse(uint8ArrayToString(chunk.subarray()))

      let response

      try {
        // check that the user is authorized to store their dbs on this pinner.
        if (!await pinner.auth.hasAccess(pubkey)) {
          throw Object.assign(new Error('user is not authorized to pin'), { type: Responses.E_NOT_AUTHORIZED })
        }

        // verify that the params have come from the user who owns the pubkey.
        if (!await pinner.orbitdb.identity.verify(signature, pubkey, params)) {
          throw Object.assign(new Error('invalid signature'), { type: Responses.E_INVALID_SIGNATURE })
        }

        const func = Messages[message]

        if (func) {
          await func(pinner, params)
          response = { type: Responses.OK }
        } else {
          throw Object.assign(new Error(`unknown function ${message}`), { type: Responses.E_INTERNAL_ERROR })
        }
      } catch (err) {
        response = { type: err.type, response: err.message }
      } finally {
        yield uint8ArrayFromString(JSON.stringify(response))
      }
    }
  })()
}
