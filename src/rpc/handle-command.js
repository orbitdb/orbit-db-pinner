import { Commands } from './commands.js'
import handleAuthAddRequest from './handlers/auth/add.js'
import handleAuthDelRequest from './handlers/auth/del.js'
import handleAuthListRequest from './handlers/auth/list.js'
import handleIdRequest from './handlers/id.js'
import handleAddressRequest from './handlers/address.js'
import { ResponseMessage, parseMessage, Responses } from '../lib/messages/index.js'

export const handleCommand = (rpcConfig, orbiter) => source => {
  return (async function * () {
    for await (const chunk of source) {
      const { type, signature, id, addresses } = parseMessage(chunk.subarray())
      const { orbitdb, auth, log } = orbiter

      log('handle command', type, signature, id, addresses)

      let response

      try {
        // check that the user is authorized to call this RPC
        const identity = rpcConfig.identities.find((identity) => identity.hash === id)

        if (!identity) {
          throw Object.assign(new Error('user is not authorized'), { type: Responses.E_NOT_AUTHORIZED })
        }

        // verify that the params are signed by the authorized pubkey
        if (!await orbitdb.identity.verify(signature, identity.publicKey, JSON.stringify(addresses))) {
          throw Object.assign(new Error('invalid signature'), { type: Responses.E_INVALID_SIGNATURE })
        }

        switch (type) {
          case Commands.AUTH_ADD:
            await handleAuthAddRequest({ auth, addresses })
            response = ResponseMessage(Responses.OK)
            break
          case Commands.AUTH_DEL:
            await handleAuthDelRequest({ auth, addresses })
            response = ResponseMessage(Responses.OK)
            break
          case Commands.AUTH_LIST: {
            const list = await handleAuthListRequest({ auth })
            response = ResponseMessage(Responses.OK, list)
            break
          }
          case Commands.GET_ID: {
            const id = handleIdRequest({ orbitdb })
            response = ResponseMessage(Responses.OK, id)
            break
          }
          case Commands.GET_ADDRESS: {
            const libp2p = orbitdb.ipfs.libp2p
            const addresses = handleAddressRequest({ libp2p })
            response = ResponseMessage(Responses.OK, addresses)
            break
          }
          default:
            throw Object.assign(new Error(`unknown message type ${type}`), { type: Responses.E_INTERNAL_ERROR })
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
