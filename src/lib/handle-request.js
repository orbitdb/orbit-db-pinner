import handleAddRequest from './handlers/add.js'
import handleRemoveRequest from './handlers/remove.js'
import { createResponseMessage, parseMessage, Requests, Responses } from './messages/index.js'

export const handleRequest = (orbiter) => source => {
  return (async function * () {
    for await (const chunk of source) {
      const { type, signature, id, addresses } = parseMessage(chunk.subarray())

      let response

      try {
        // check that the given identity is valid
        const identity = await orbiter.orbitdb.identities.getIdentity(id)
        if (!identity) {
          throw Object.assign(new Error('invalid identity'), { type: Responses.E_INVALID_IDENTITY })
        } else {
          await orbiter.orbitdb.identities.verifyIdentity(identity)
        }

        // check that the identity is authorized to store their dbs on this orbiter.
        if (!await orbiter.auth.hasAccess(identity.id)) {
          throw Object.assign(new Error('user is not authorized to add'), { type: Responses.E_NOT_AUTHORIZED })
        }

        // verify that the params have come from the user who owns the identity's pubkey.
        if (!await orbiter.orbitdb.identity.verify(signature, identity.publicKey, JSON.stringify(addresses))) {
          throw Object.assign(new Error('invalid signature'), { type: Responses.E_INVALID_SIGNATURE })
        }

        const { orbitdb, pins, dbs } = orbiter

        switch (type) {
          case Requests.PIN_ADD:
            await handleAddRequest({ orbitdb, pins, dbs, id, addresses })
            response = createResponseMessage(Responses.OK)
            break
          case Requests.PIN_REMOVE:
            await handleRemoveRequest({ orbitdb, pins, dbs, id, addresses })
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
