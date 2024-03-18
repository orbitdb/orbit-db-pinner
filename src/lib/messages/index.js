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
          throw new Error({ type: Messages.E_NOT_AUTHORIZED, response: 'user is not authorized to pin' })
        }

        // verify that the params have come from the user who owns the pubkey.
        if (!await pinner.orbitdb.identity.verify(signature, pubkey, params)) {
          throw new Error({ type: Messages.E_INVALID_SIGNATURE, response: 'invalid signature' })
        }

        const func = Messages[message]

        if (func) {
          await func(pinner, params)
          response = { type: Responses.OK }
        } else {
          throw new Error({ type: Messages.E_INTERNAL_ERROR, response: `unknown function ${func}` })
        }
      } catch (err) {
        response = err
      } finally {
        yield uint8ArrayFromString(JSON.stringify(response))
      }
    }
  })()
}
