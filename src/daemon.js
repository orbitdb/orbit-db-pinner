import { join } from 'path'
import { createLibp2p } from 'libp2p'
import { createHelia } from 'helia'
import { createOrbitDB, Identities, KeyStore } from '@orbitdb/core'
import { LevelBlockstore } from 'blockstore-level'
import { LevelDatastore } from 'datastore-level'
import { pipe } from 'it-pipe'
import Orbiter from './lib/orbiter.js'
import { voyagerRPCProtocol } from './rpc/protocol.js'
import { handleCommand } from './rpc/index.js'
import { Access } from './lib/authorization.js'
import { config as libp2pConfig } from './utils/libp2p-config.js'
import { rpc as rpcId, appPath, rpcPath, app, orbiter as orbiterId, orbiterPath } from './utils/id.js'
import { saveConfig } from './utils/config-manager.js'
import { createFromPrivKey } from '@libp2p/peer-id-factory'
import { logger, enable } from '@libp2p/logger'

export default async ({ options }) => {
  options = options || {}

  const log = logger('voyager:daemon')

  if (options.verbose > 0) {
    enable('voyager:daemon' + (options.verbose > 1 ? '*' : ':error'))
  }

  const defaultAccess = options.allow ? Access.ALLOW : Access.DENY

  options.verbose = options.verbose || 0
  options.silent = options.silent || false
  options.port = options.port || 0
  options.wsport = options.wsport || 0

  const id = orbiterId

  log('id:', id)

  const appDirectory = appPath(options.directory)
  const orbiterDirectory = orbiterPath(options.directory)

  log('app:', app)
  log('directory:', orbiterDirectory)

  const path = join(orbiterDirectory, '/', 'keystore')

  const blockstore = new LevelBlockstore(join(orbiterDirectory, '/', 'ipfs', '/', 'blocks'))
  const datastore = new LevelDatastore(join(orbiterDirectory, '/', 'ipfs', '/', 'data'))

  const keystore = await KeyStore({ path })
  let identities = await Identities({ keystore })
  await identities.createIdentity({ id })

  const peerId = await createFromPrivKey(await keystore.getKey(id))
  await keystore.close()

  const libp2p = await createLibp2p(await libp2pConfig({ peerId, port: options.port, websocketPort: options.wsport }))

  log('peerid:', libp2p.peerId.toString())
  for (const addr of libp2p.getMultiaddrs().map(e => e.toString())) {
    options.silent || console.log(addr)
  }

  for (const addr of libp2p.getMultiaddrs().map(e => e.toString())) {
    log('listening on', addr)
  }

  const ipfs = await createHelia({ libp2p, datastore, blockstore })

  identities = await Identities({ keystore, ipfs })

  const orbitdb = await createOrbitDB({ ipfs, directory: orbiterDirectory, identities, id })

  const orbiter = await Orbiter({ defaultAccess, verbose: options.verbose, orbitdb })

  // TODO: we might want to separate the key init to a separate 'init' CLI command
  const initRPCKey = async ({ directory }) => {
    const id = rpcId
    const rpcDirectory = rpcPath(directory)
    const path = join(rpcDirectory, 'keystore')
    const keystore = await KeyStore({ path })
    const identities = await Identities({ keystore })
    const identity = await identities.createIdentity({ id })

    await keystore.close()

    return identity.publicKey
  }

  const authorizedRPCKey = await initRPCKey({ directory: options.directory })

  const config = { orbiter: {}, rpc: {} }
  config.orbiter.peerId = orbiter.orbitdb.ipfs.libp2p.peerId
  config.orbiter.api = orbiter.orbitdb.ipfs.libp2p.getMultiaddrs().shift() // get 127.0.0.1 address
  config.rpc.publicKeys = [authorizedRPCKey]
  await saveConfig({ path: appDirectory, config })

  const handleRPCMessages = async ({ stream }) => {
    await pipe(stream, handleCommand({ config, orbitdb: orbiter.orbitdb, pins: orbiter.pins, dbs: orbiter.dbs, auth: orbiter.auth }), stream)
  }

  await orbiter.orbitdb.ipfs.libp2p.handle(voyagerRPCProtocol, handleRPCMessages)

  process.on('SIGINT', async () => {
    await orbiter.stop()
    process.exit(0)
  })
}
