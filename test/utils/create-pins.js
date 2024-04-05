import { pipe } from 'it-pipe'
import drain from 'it-drain'
import { Requests, createRequestMessage } from '../../src/lib/messages/index.js'
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
      const addresses = dbs.map(p => p.address)
      const message = await createRequestMessage(Requests.PIN, addresses, client.identity)
      yield message
    })()
  }

  const stream = await client.ipfs.libp2p.dialProtocol(pinner.orbitdb.ipfs.libp2p.peerId, pinnerProtocol)

  await pipe(pinDBs, stream, sink)

  return dbs
}
