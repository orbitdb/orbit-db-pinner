import { createHelia } from 'helia'
import { createLibp2p } from 'libp2p'
import { bitswap } from '@helia/block-brokers'
import { createOrbitDB } from '@orbitdb/core'
import Lander from '../../src/lib/lander.js'
// import connectPeers from './connect-nodes.js'
import connect from './connect-nodes-via-relay.js'

import Libp2pOptions from './test-config/lander-libp2p-config.js'

const heliaOptions = {
  blockBrokers: [
    bitswap()
  ],
  routers: [
  ]
}

export const launchLander = async ({ directory, orbiterAddress } = {}) => {
  const options = Libp2pOptions
  const libp2p = await createLibp2p({ ...options })
  const ipfs = await createHelia({ libp2p, ...heliaOptions })

  directory = directory || './lander'

  const orbitdb = await createOrbitDB({ ipfs, directory })

  // await connectPeers(ipfs, orbiterAddress)
  await connect(ipfs, orbiterAddress)

  const lander = await Lander({ orbitdb, orbiterAddressOrId: orbiterAddress })

  // Helper function for tests
  lander.shutdown = async () => {
    await orbitdb.stop()
    await ipfs.stop()
  }

  return lander
}
