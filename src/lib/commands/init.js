import { createLibp2p } from 'libp2p'
import { LevelBlockstore } from 'blockstore-level'
import { LevelDatastore } from 'datastore-level'
import { createHelia } from 'helia'
import { createOrbitDB, Identities, KeyStore } from '@orbitdb/core'
import { join } from 'path'
import libp2pConfig from '../libp2p/config.js'
import libp2pControllerConfig from '../libp2p/controller/config.js'
import { orbiter, controller, orbiterPath, controllerPath } from '../utils/id.js'

export default async (argv) => {
  const id = orbiter

  const directory = orbiterPath(argv.directory)
  const path = join(directory, 'keystore')
  const keystore = await KeyStore({ path })
  const identities = await Identities({ keystore })
  await identities.createIdentity({ id })

  const blockstore = new LevelBlockstore(join(directory, 'ipfs', 'blocks'))
  const datastore = new LevelDatastore(join(directory, 'ipfs', 'data'))
  const libp2p = await createLibp2p(libp2pConfig)
  const ipfs = await createHelia({ libp2p, datastore, blockstore })

  const orbitdb = await createOrbitDB({ ipfs, directory, identities, id })

  const addresses = libp2p.getMultiaddrs()

  const controllerPubKey = await initController({ addresses, rootDir: argv.directory })

  const config = await orbitdb.open('config', { type: 'keyvalue' })
  await config.put('controller-pubkey', controllerPubKey)
  await orbitdb.stop()

  return { addresses }
}

const initController = async ({ addresses, rootDir }) => {
  const id = controller

  const directory = controllerPath(rootDir)
  const path = join(directory, 'keystore')
  const keystore = await KeyStore({ path })
  const identities = await Identities({ keystore })
  const identity = await identities.createIdentity({ id })

  const blockstore = new LevelBlockstore(join(directory, 'ipfs', 'blocks'))
  const datastore = new LevelDatastore(join(directory, 'ipfs', 'data'))
  const libp2p = await createLibp2p(libp2pControllerConfig)
  const ipfs = await createHelia({ libp2p, datastore, blockstore })
  const orbitdb = await createOrbitDB({ ipfs, directory, identities, id })

  const config = await orbitdb.open('config', { type: 'keyvalue' })
  await config.put('orbiter-addresses', JSON.stringify(addresses))
  await orbitdb.stop()

  return identity.publicKey
}
