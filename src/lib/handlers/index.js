import handlePinRequest from './pin.js'
import handleUnpinRequest from './unpin.js'
import { createResponseMessage, parseMessage, Requests, Responses } from '../messages/index.js'

export const handleRequest = (pinner) => source => {
  return (async function * () {
    for await (const chunk of source) {
      const { type, signature, pubkey, addresses } = parseMessage(chunk.subarray())

      let response

      try {
        // check that the user is authorized to store their dbs on this pinner.
        if (!await pinner.auth.hasAccess(pubkey)) {
          throw Object.assign(new Error('user is not authorized to pin'), { type: Responses.E_NOT_AUTHORIZED })
        }

        // verify that the params have come from the user who owns the pubkey.
        if (!await pinner.orbitdb.identity.verify(signature, pubkey, addresses)) {
          throw Object.assign(new Error('invalid signature'), { type: Responses.E_INVALID_SIGNATURE })
        }

        const { orbitdb, pins, dbs } = pinner

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
