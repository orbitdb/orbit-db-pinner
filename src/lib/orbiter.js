import { pipe } from 'it-pipe'
import { createLibp2p } from 'libp2p'
import { createHelia } from 'helia'
import { createOrbitDB, Identities, KeyStore, KeyValueIndexed } from '@orbitdb/core'
import { LevelBlockstore } from 'blockstore-level'
import { LevelDatastore } from 'datastore-level'
import { join } from 'path'
import libp2pConfig from './libp2p/config.js'
import Authorization, { Access } from './authorization.js'
import { handleRequest } from './handlers/index.js'
import { handleControllerRequest } from './controller/handlers/index.js'
import { voyagerProtocol, voyagerControllerProtocol } from './protocol.js'
import { logger, enable } from '@libp2p/logger'
import { app, orbiter, orbiterPath } from './utils/id.js'

export default async ({ directory, verbose, defaultAccess } = {}) => {
  const log = logger('orbitdb:voyager:orbiter')
  const id = orbiter

  directory = orbiterPath(directory)

  defaultAccess = defaultAccess || Access.DENY

  if (verbose > 0) {
    enable('orbitdb:voyager:orbiter' + (verbose > 1 ? '*' : ':error'))
  }
 
  log('app:', app)
  log('id:', id)
  log('directory:', directory)

  log('default access:', defaultAccess === Access.ALLOW ? 'allow all' : 'deny all')

  const path = join(directory, '/', 'keystore')

  const blockstore = new LevelBlockstore(join(directory, '/', 'ipfs', '/', 'blocks'))
  const datastore = new LevelDatastore(join(directory, '/', 'ipfs', '/', 'data'))
  const libp2p = await createLibp2p(libp2pConfig)
  const ipfs = await createHelia({ libp2p, datastore, blockstore })

  log('listening on', libp2p.getMultiaddrs())

  const keystore = await KeyStore({ path })
  const identities = await Identities({ keystore })

  const orbitdb = await createOrbitDB({ ipfs, directory, identities, id })

  const pins = await orbitdb.open('pins', { Database: KeyValueIndexed() })

  const auth = await Authorization({ orbitdb, defaultAccess })

  const dbs = []

  const handleMessages = async ({ stream }) => {
    await pipe(stream, handleRequest({ orbitdb, pins, dbs, auth }), stream)
  }

  const handleControllerMessages = async ({ stream }) => {
    await pipe(stream, handleControllerRequest({ orbitdb, pins, dbs, auth }), stream)
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
    pins,
    dbs,
    orbitdb,
    ipfs,
    auth,
    stop
  }
}
