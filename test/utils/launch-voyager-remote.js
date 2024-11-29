import { createHelia } from 'helia'
import { createLibp2p } from 'libp2p'
import { bitswap } from '@helia/block-brokers'
import { createOrbitDB } from '@orbitdb/core'
import Voyager_ from '../../src/lib/voyager.js'
// import connectPeers from './connect-nodes.js'
import connect from './connect-nodes-via-relay.js'

import Libp2pOptions from './test-config/voyager-app-libp2p-config.js'

const heliaOptions = {
  blockBrokers: [
    bitswap()
  ],
  routers: [
  ]
}

export const Voyager = async ({ address, directory } = {}) => {
  const options = Libp2pOptions
  const libp2p = await createLibp2p({ ...options })
  const ipfs = await createHelia({ libp2p, ...heliaOptions })

  directory = directory || './app'

  const orbitdb = await createOrbitDB({ ipfs, directory })

  // await connectPeers(ipfs, address)
  await connect(ipfs, address)

  const voyager = await Voyager_({ orbitdb, address })

  // Helper function for tests
  voyager.shutdown = async () => {
    await orbitdb.stop()
    await ipfs.stop()
  }

  return voyager
}
