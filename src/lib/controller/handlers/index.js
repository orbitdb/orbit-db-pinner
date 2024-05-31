import handleAuthAddRequest from './auth/add.js'
import handleAuthDelRequest from './auth/del.js'
import handleAuthListRequest from './auth/list.js'
import { createResponseMessage, parseMessage, ControllerRequests, Responses } from '../../messages/index.js'

export const handleControllerRequest = (orbiter) => source => {
  return (async function * () {
    for await (const chunk of source) {
      const { type, signature, pubkey, addresses } = parseMessage(chunk.subarray())

      let response

      try {
        const { auth, config } = orbiter
        // check that the user is authorized to store their dbs on this orbiter.
        if (pubkey !== config.controller.publicKey) {
          throw Object.assign(new Error('user is not authorized'), { type: Responses.E_NOT_AUTHORIZED })
        }

        // verify that the params have come from the user who owns the pubkey.
        if (!await orbiter.orbitdb.identity.verify(signature, pubkey, addresses)) {
          throw Object.assign(new Error('invalid signature'), { type: Responses.E_INVALID_SIGNATURE })
        }

        switch (type) {
          case ControllerRequests.AUTH_ADD:
            await handleAuthAddRequest({ auth, addresses })
            response = createResponseMessage(Responses.OK)
            break
          case ControllerRequests.AUTH_DEL:
            await handleAuthDelRequest({ auth, addresses })
            response = createResponseMessage(Responses.OK)
            break
          case ControllerRequests.AUTH_LIST: {
            const list = await handleAuthListRequest({ auth })
            response = createResponseMessage(Responses.OK, list)
            break
          }
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
