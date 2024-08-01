import { join } from 'path'
import { createHelia } from 'helia'
import { LevelBlockstore } from 'blockstore-level'
import { LevelDatastore } from 'datastore-level'
import { createLibp2p } from 'libp2p'
import { identify } from '@libp2p/identify'
import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { webSockets } from '@libp2p/websockets'
import { gossipsub } from '@chainsafe/libp2p-gossipsub'
import { createOrbitDB } from '@orbitdb/core'
import Orbiter from '../../src/lib/orbiter.js'
import { orbiter as orbiterId } from '../../src/utils/id.js'

const options = {
  addresses: {
    listen: [
      '/ip4/0.0.0.0/tcp/0/ws'
    ]
  },
  transports: [
    webSockets()
  ],
  connectionEncryption: [
    noise()
  ],
  streamMuxers: [
    yamux()
  ],
  services: {
    identify: identify(),
    pubsub: gossipsub({
      emitSelf: true
    })
  }
}

export const launchOrbiter = async ({ directory } = {}) => {
  directory = directory || './orbiter'

  const id = orbiterId

  const blockstore = new LevelBlockstore(join(directory, '/', 'ipfs', '/', 'blocks'))
  const datastore = new LevelDatastore(join(directory, '/', 'ipfs', '/', 'data'))

  const libp2p = await createLibp2p({ ...options })
  const ipfs = await createHelia({ libp2p, datastore, blockstore })
  const orbitdb = await createOrbitDB({ ipfs, directory, id })
  const orbiter = await Orbiter({ orbitdb })

  // Helper function for tests
  orbiter.shutdown = async () => {
    await orbiter.stop()
    await orbitdb.stop()
    await ipfs.stop()
    await datastore.close()
    await blockstore.close()
  }

  return orbiter
}
