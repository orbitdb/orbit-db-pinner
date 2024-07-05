import handlePinRequest from './handlers/pin.js'
import handleUnpinRequest from './handlers/unpin.js'
import { createResponseMessage, parseMessage, Requests, Responses } from './messages/index.js'

export const handleRequest = (orbiter) => source => {
  return (async function * () {
    for await (const chunk of source) {
      const { type, signature, pubkey, addresses } = parseMessage(chunk.subarray())

      let response

      try {
        // check that the user is authorized to store their dbs on this orbiter.
        if (!await orbiter.auth.hasAccess(pubkey)) {
          throw Object.assign(new Error('user is not authorized to pin'), { type: Responses.E_NOT_AUTHORIZED })
        }

        // verify that the params have come from the user who owns the pubkey.
        if (!await orbiter.orbitdb.identity.verify(signature, pubkey, JSON.stringify(addresses))) {
          throw Object.assign(new Error('invalid signature'), { type: Responses.E_INVALID_SIGNATURE })
        }

        const { orbitdb, pins, dbs } = orbiter

        switch (type) {
          case Requests.PIN:
            await handlePinRequest({ orbitdb, pins, dbs, pubkey, addresses })
            response = createResponseMessage(Responses.OK)
            break
          case Requests.UNPIN:
            await handleUnpinRequest({ orbitdb, pins, dbs, pubkey, addresses })
            response = createResponseMessage(Responses.OK)
            break
          default:
            throw Object.assign(new Error(`unknown message type ${type}`), { type: Responses.E_INTERNAL_ERROR })
        }
      } catch (err) {
        response = createResponseMessage(err.type, err.message)
      } finally {
        yield response
      }
    }
  })()
}
