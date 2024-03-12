import { pipe } from 'it-pipe'
import drain from 'it-drain'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import Message from './message-types.js'

const pinnerProtocol = '/orbitdb/pinner/v1.0.0'

export const createPins = async (howMany, client, pinner) => {
  const dbs = []

  for (let i = 1; i <= howMany; i++) {
    dbs.push(await client.open(`db${i}`))
  }

  const pinDBs = source => {
    const values = [
      uint8ArrayFromString(JSON.stringify({ message: Message.PIN, id: client.identity.id, addresses: dbs.map(p => p.address) }))
    ]

    return (async function * () {
      for await (const value of values) {
        yield value
      }
    })()
  }

  const stream = await client.ipfs.libp2p.dialProtocol(pinner.registry.orbitdb.ipfs.libp2p.peerId, pinnerProtocol)

  await pipe(pinDBs, stream, async source => {
    await drain(source)
  })

  return dbs
}
