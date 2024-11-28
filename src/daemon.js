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
import { logger, enable } from '@libp2p/logger'

const createRPCIdentity = async ({ id, directory }) => {
  const keystore = await KeyStore({ path: join(rpcPath(directory), 'keystore') })
  const identities = await Identities({ keystore })
  const identity = await identities.createIdentity({ id })
  await keystore.close()
  return {
    id: identity.id,
    hash: identity.hash,
    publicKey: identity.publicKey
  }
}

export default async ({ options }) => {
  options = options || {}

  const log = logger('voyager:daemon')

  if (options.verbose > 0) {
    enable('voyager:daemon' + (options.verbose > 1 ? '*' : ':error'))
  }

  const defaultAccess = options.allow ? Access.ALLOW : Access.DENY

  options.verbose = options.verbose || 0
  options.port = options.port || 0
  options.wsport = options.wsport || 0

  const id = orbiterId

  log('app:', app)
  log('orbiter:', id)
  log('rpc:', rpcId)

  const appDirectory = appPath(options.directory)
  const orbiterDirectory = orbiterPath(options.directory)

  log('directory:', orbiterDirectory)

  const blockstore = new LevelBlockstore(join(orbiterDirectory, '/', 'ipfs', '/', 'blocks'))
  const datastore = new LevelDatastore(join(orbiterDirectory, '/', 'ipfs', '/', 'data'))

  const libp2p = await createLibp2p(libp2pConfig({ port: options.port, websocketPort: options.wsport }))

  log('peerid:', libp2p.peerId.toString())

  const addresses = libp2p.getMultiaddrs().map(e => e.toString())
  for (const addr of addresses) {
    console.log(addr)
  }
  for (const addr of addresses) {
    log('listening on', addr)
  }

  const ipfs = await createHelia({ libp2p, datastore, blockstore })
  const orbitdb = await createOrbitDB({ ipfs, directory: orbiterDirectory, id })
  const orbiter = await Orbiter({ defaultAccess, verbose: options.verbose, orbitdb })

  const authorizedRPCIdentity = await createRPCIdentity({ id: rpcId, directory: options.directory })

  const rpcConfig = {
    address: orbiter.orbitdb.ipfs.libp2p.getMultiaddrs().shift(), // get 127.0.0.1 address
    identities: [authorizedRPCIdentity]
  }
  await saveConfig({ path: appDirectory, config: rpcConfig })

  const handleRPCMessages = async ({ stream }) => {
    await pipe(stream, handleCommand(rpcConfig, orbiter), stream)
  }

  await orbiter.orbitdb.ipfs.libp2p.handle(voyagerRPCProtocol, handleRPCMessages)

  process.on('SIGINT', async () => {
    await orbiter.stop()
    await blockstore.close()
    await datastore.close()
    process.exit(0)
  })

  console.log('Voyager started')
}
