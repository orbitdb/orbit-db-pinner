import { pipe } from 'it-pipe'
import { Requests, Responses, createRequestMessage, parseMessage } from './messages/index.js'
import { voyagerProtocol } from './protocol.js'

export default async ({ orbitdb, orbiterAddressOrId }) => {
  const pin = async (addresses) => {
    let pinned = false
    const pinDBs = source => {
      return (async function * () {
        addresses = Array.isArray(addresses) ? addresses : [addresses]
        const message = await createRequestMessage(Requests.PIN, addresses, orbitdb.identity)
        yield message
      })()
    }

    const stream = await orbitdb.ipfs.libp2p.dialProtocol(orbiterAddressOrId, voyagerProtocol, { runOnTransientConnection: true })

    await pipe(pinDBs, stream, async (source) => {
      for await (const chunk of source) {
        const message = parseMessage(chunk.subarray())

        if (message.type === Responses.OK) {
          pinned = true
        }
      }
    })

    return pinned
  }

  const unpin = async (addresses) => {
    let unpinned = false

    const unpinDBs = source => {
      return (async function * () {
        addresses = Array.isArray(addresses) ? addresses : [addresses]
        const message = await createRequestMessage(Requests.UNPIN, addresses, orbitdb.identity)
        yield message
      })()
    }

    const stream = await orbitdb.ipfs.libp2p.dialProtocol(orbiterAddressOrId, voyagerProtocol, { runOnTransientConnection: true })

    await pipe(unpinDBs, stream, async source => {
      for await (const chunk of source) {
        const message = parseMessage(chunk.subarray())

        if (message.type === Responses.OK) {
          unpinned = true
        }
      }
    })

    return unpinned
  }

  return {
    orbitdb,
    pin,
    unpin
  }
}
