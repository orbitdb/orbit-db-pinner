import { pipe } from 'it-pipe'
import { Requests, Responses, RequestMessage, parseMessage } from './messages/index.js'
import { voyagerProtocol } from './protocol.js'

export default async ({ orbitdb, orbiterAddressOrId }) => {
  const add = async (addresses) => {
    let added = false

    const addDBs = source => {
      return (async function * () {
        addresses = Array.isArray(addresses) ? addresses : [addresses]
        const message = await RequestMessage(Requests.PIN_ADD, addresses, orbitdb.identity)
        yield message
      })()
    }

    const stream = await orbitdb.ipfs.libp2p.dialProtocol(orbiterAddressOrId, voyagerProtocol, { runOnLimitedConnection: true })

    await pipe(addDBs, stream, async (source) => {
      for await (const chunk of source) {
        const message = parseMessage(chunk.subarray())

        if (message.type === Responses.OK) {
          added = true
        }
      }
    })

    return added
  }

  const remove = async (addresses) => {
    let removed = false

    const removeDBs = source => {
      return (async function * () {
        addresses = Array.isArray(addresses) ? addresses : [addresses]
        const message = await RequestMessage(Requests.PIN_REMOVE, addresses, orbitdb.identity)
        yield message
      })()
    }

    const stream = await orbitdb.ipfs.libp2p.dialProtocol(orbiterAddressOrId, voyagerProtocol, { runOnLimitedConnection: true })

    await pipe(removeDBs, stream, async source => {
      for await (const chunk of source) {
        const message = parseMessage(chunk.subarray())

        if (message.type === Responses.OK) {
          removed = true
        }
      }
    })

    return removed
  }

  return {
    orbitdb,
    add,
    remove
  }
}
