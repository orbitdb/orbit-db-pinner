import { pipe } from 'it-pipe'
import Registry from './registry.js'
import Authorization, { Access } from './authorization.js'
import { processMessage } from './messages/index.js'

export default async ({ defaultAccess } = {}) => {
  const protocol = '/orbitdb/pinner/v1.0.0'

  defaultAccess = defaultAccess || Access.DENY

  const registry = await Registry()
  const auth = await Authorization({ orbitdb: registry.orbitdb, defaultAccess })

  const dbs = []

  const handleMessage = async ({ stream }) => {
    await pipe(stream, processMessage(auth, registry, dbs), stream)
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
    auth,
    dbs,
    stop
  }
}
