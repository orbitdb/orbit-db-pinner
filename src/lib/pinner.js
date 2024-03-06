import Registry from './registry.js'
import PinHandler from './handlers/pin.js'
import UnpinHandler from './handlers/unpin.js'

export default async () => {
  const registry = await Registry()

  const dbs = []

  const pinHandler = PinHandler(registry, dbs)
  await pinHandler.register()
  const unpinHandler = UnpinHandler(registry, dbs)
  await unpinHandler.register()
  
  for await (const db of registry.pins.iterator()) {
    dbs[db.value] = await registry.orbitdb.open(db.value)
    console.log('db opened', db.value)
  }

  console.log('dbs loaded')

  const stop = async () => {
    await pinHandler.deregister()
    await unpinHandler.deregister()
    await registry.stop()
  }

  return {
    registry,
    dbs,
    stop
  }
}