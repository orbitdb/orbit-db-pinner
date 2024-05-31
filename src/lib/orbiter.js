import { pipe } from 'it-pipe'
import { createLibp2p } from 'libp2p'
import { createHelia } from 'helia'
import { createOrbitDB, Identities, KeyStore, KeyValueIndexed } from '@orbitdb/core'
import { LevelBlockstore } from 'blockstore-level'
import { LevelDatastore } from 'datastore-level'
import { join } from 'path'
import { config as libp2pConfig } from './libp2p/config.js'
import Authorization, { Access } from './authorization.js'
import { handleRequest } from './handlers/index.js'
import { handleControllerRequest } from './controller/handlers/index.js'
import { voyagerProtocol, voyagerControllerProtocol } from './protocol.js'
import { logger, enable } from '@libp2p/logger'
import { app, orbiter, controller, appPath, orbiterPath, controllerPath } from './utils/id.js'
import { saveConfig } from './utils/config-manager.js'
import { createFromPrivKey } from '@libp2p/peer-id-factory'

export default async ({ directory, verbose, defaultAccess } = {}) => {
  const log = logger('orbitdb:voyager:orbiter')
  const id = orbiter

  if (verbose > 0) {
    enable('orbitdb:voyager:orbiter' + (verbose > 1 ? '*' : ':error'))
  }

  const appDirectory = appPath(directory)
  const orbiterDirectory = orbiterPath(directory)

  defaultAccess = defaultAccess || Access.DENY

  log('app:', app)
  log('id:', id)
  log('directory:', orbiterDirectory)

  log('default access:', defaultAccess === Access.ALLOW ? 'allow all' : 'deny all')

  const path = join(orbiterDirectory, '/', 'keystore')

  const blockstore = new LevelBlockstore(join(orbiterDirectory, '/', 'ipfs', '/', 'blocks'))
  const datastore = new LevelDatastore(join(orbiterDirectory, '/', 'ipfs', '/', 'data'))

  const keystore = await KeyStore({ path })
  const identities = await Identities({ keystore })
  await identities.createIdentity({ id })

  const peerId = await createFromPrivKey(await keystore.getKey(id))
  const libp2p = await createLibp2p(await libp2pConfig({ peerId }))

  const config = { orbiter: {}, controller: {} }
  config.orbiter.peerId = libp2p.peerId
  config.orbiter.api = libp2p.getMultiaddrs().shift() // get 127.0.0.1 address

  const initController = async ({ directory }) => {
    const id = controller
    const controllerDirectory = controllerPath(directory)
    const path = join(controllerDirectory, 'keystore')
    const keystore = await KeyStore({ path })
    const identities = await Identities({ keystore })
    const identity = await identities.createIdentity({ id })

    const peerId = await createFromPrivKey(await keystore.getKey(id))
    const publicKey = identity.publicKey

    await keystore.close()

    return { peerId, publicKey }
  }

  const controllerInit = await initController({ directory })
  config.controller.peerId = controllerInit.peerId.toString()
  config.controller.publicKey = controllerInit.publicKey
  await saveConfig({ path: appDirectory, config })

  log('peer id', libp2p.peerId.toString())
  log('listening on', libp2p.getMultiaddrs())

  const ipfs = await createHelia({ libp2p, datastore, blockstore })
  console.log(orbiterDirectory)
  const orbitdb = await createOrbitDB({ ipfs, directory: orbiterDirectory, identities, id })

  const pins = await orbitdb.open('pins', { Database: KeyValueIndexed() })

  const auth = await Authorization({ orbitdb, defaultAccess })

  const dbs = []

  const handleMessages = async ({ stream }) => {
    await pipe(stream, handleRequest({ log, orbitdb, pins, dbs, auth }), stream)
  }

  const handleControllerMessages = async ({ stream }) => {
    await pipe(stream, handleControllerRequest({ log, config, orbitdb, pins, dbs, auth }), stream)
  }

  await orbitdb.ipfs.libp2p.handle(voyagerProtocol, handleMessages)
  await orbitdb.ipfs.libp2p.handle(voyagerControllerProtocol, handleControllerMessages)

  for await (const db of pins.iterator()) {
    dbs[db.value] = await orbitdb.open(db.value)
    log('db opened', db.value)
  }

  log(dbs.length, 'dbs loaded')

  const stop = async () => {
    await orbitdb.ipfs.libp2p.unhandle(voyagerProtocol)
    await orbitdb.stop()
    await ipfs.stop()
    await blockstore.close()
    await datastore.close()
  }

  return {
    log,
    config,
    pins,
    dbs,
    orbitdb,
    ipfs,
    auth,
    stop
  }
}
