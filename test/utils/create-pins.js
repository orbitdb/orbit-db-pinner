import { pipe } from 'it-pipe'
import drain from 'it-drain'
import { Requests, createRequestMessage } from '../../src/lib/messages/index.js'
import { pinnerProtocol } from '../../src/lib/protocol.js'

export const createPins = async (howMany, client) => {
  const dbs = []

  for (let i = 1; i <= howMany; i++) {
    dbs.push(await client.orbitdb.open(`db${i}`))
  }

  const pinned = await client.pin(dbs)

  return { pinned, dbs }
}
