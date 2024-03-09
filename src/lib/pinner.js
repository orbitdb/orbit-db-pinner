import { pipe } from 'it-pipe'
import Registry from './registry.js'
import { processMessage } from './messages/index.js'

export default async () => {
  const protocol = '/orbitdb/pinner/v1.0.0'

  const registry = await Registry()

  const dbs = []

  const handleMessage = async ({ stream }) => {
    await pipe(stream, processMessage(registry, dbs), stream)
  }

  for await (const db of registry.pins.iterator()) {
    dbs[db.value] = await registry.orbitdb.open(db.value)
    console.log('db opened', db.value)
  }
  console.log('dbs loaded')

  await registry.orbitdb.ipfs.libp2p.handle(protocol, handleMessage)

  const stop = async () => {
    await registry.orbitdb.ipfs.libp2p.unhandle(protocol)
    await registry.stop()
  }

  return {
    registry,
    dbs,
    stop
  }
}
