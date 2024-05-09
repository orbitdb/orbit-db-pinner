import { pipe } from 'it-pipe'
import { Requests, Responses, createRequestMessage, parseMessage } from './messages/index.js'
import { voyagerProtocol } from './protocol.js'

export default async ({ orbitdb, orbiterAddressOrId }) => {
  const pin = async (dbs) => {
    let pinned = false
    const pinDBs = source => {
      return (async function * () {
        const addresses = dbs.map(p => p.address)
        const message = await createRequestMessage(Requests.PIN, addresses, orbitdb.identity)
        yield message
      })()
    }

    const stream = await orbitdb.ipfs.libp2p.dialProtocol(orbiterAddressOrId, voyagerProtocol)

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

  const unpin = async (dbs) => {
    let unpinned = false

    const unpinDBs = source => {
      return (async function * () {
        const addresses = dbs.map(p => p.address)
        const message = await createRequestMessage(Requests.UNPIN, addresses, orbitdb.identity)
        yield message
      })()
    }

    const stream = await orbitdb.ipfs.libp2p.dialProtocol(orbiterAddressOrId, voyagerProtocol)

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
