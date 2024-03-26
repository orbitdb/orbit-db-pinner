import { pipe } from 'it-pipe'
import drain from 'it-drain'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import { Messages } from './message-types.js'
import { pinnerProtocol } from '../../src/lib/protocol.js'

export const createPins = async (howMany, client, pinner, sink) => {
  const defaultSink = async (source) => { await drain(source) }
  sink = sink || defaultSink

  const dbs = []

  for (let i = 1; i <= howMany; i++) {
    dbs.push(await client.open(`db${i}`))
  }

  const pinDBs = source => {
    return (async function * () {
      const identity = client.identity
      const message = Messages.PIN
      const pubkey = client.identity.publicKey
      const addresses = dbs.map(p => p.address)
      const params = { addresses }
      const signature = await identity.sign(identity, params)

      const values = [
        uint8ArrayFromString(JSON.stringify({ message, signature, pubkey, ...params }))
      ]

      for await (const value of values) {
        yield value
      }
    })()
  }

  const stream = await client.ipfs.libp2p.dialProtocol(pinner.orbitdb.ipfs.libp2p.peerId, pinnerProtocol)

  await pipe(pinDBs, stream, sink)

  return dbs
}
