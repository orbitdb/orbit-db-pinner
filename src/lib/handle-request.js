import handleAddRequest from './handlers/add.js'
import handleRemoveRequest from './handlers/remove.js'
import { ResponseMessage, parseMessage, Requests, Responses } from './messages/index.js'

export const handleRequest = (orbiter) => source => {
  return (async function * () {
    for await (const chunk of source) {
      const { type, signature, id, addresses } = parseMessage(chunk.subarray())
      const { orbitdb, auth, databases, log } = orbiter

      log('handle request', type, signature, id, addresses)

      let response

      try {
        // check that the given identity is valid
        const identity = await orbitdb.identities.getIdentity(id)
        if (!identity) {
          throw Object.assign(new Error('invalid identity'), { type: Responses.E_INVALID_IDENTITY })
        } else {
          await orbitdb.identities.verifyIdentity(identity)
        }

        // check that the identity is authorized to store their databases on this orbiter
        if (!await auth.hasAccess(identity.id)) {
          throw Object.assign(new Error('user is not authorized to add'), { type: Responses.E_NOT_AUTHORIZED })
        }

        // verify that the params have come from the user who owns the identity's pubkey
        if (!await orbitdb.identity.verify(signature, identity.publicKey, JSON.stringify(addresses))) {
          throw Object.assign(new Error('invalid signature'), { type: Responses.E_INVALID_SIGNATURE })
        }

        switch (type) {
          case Requests.ADD: {
            await handleAddRequest({ orbitdb, databases, id, addresses })
            response = ResponseMessage(Responses.OK)
            break
          }
          case Requests.REMOVE: {
            await handleRemoveRequest({ orbitdb, databases, id, addresses })
            response = ResponseMessage(Responses.OK)
            break
          }
          default: {
            throw Object.assign(new Error(`unknown message type ${type}`), { type: Responses.E_INTERNAL_ERROR })
          }
        }
      } catch (err) {
        response = ResponseMessage(err.type, err.message)
        log.error(err.type, err.message)
      } finally {
        yield response
      }
    }
  })()
}
