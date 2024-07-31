import { createHelia } from 'helia'
import { createLibp2p } from 'libp2p'
import { bitswap } from '@helia/block-brokers'
import { identify } from '@libp2p/identify'
import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { webSockets } from '@libp2p/websockets'
import { gossipsub } from '@chainsafe/libp2p-gossipsub'
import { createOrbitDB } from '@orbitdb/core'
import Lander from '../../src/lib/lander.js'
import connectPeers from './connect-nodes.js'
import { all } from '@libp2p/websockets/filters'

const options = {
  transports: [
    webSockets({
      filter: all // connect to insecure sockets also (E.g. /ws/)
    })
  ],
  connectionEncryption: [
    noise()
  ],
  streamMuxers: [
    yamux()
  ],
  connectionGater: {
    denyDialMultiaddr: () => false // allow dialling of private addresses.
  },
  services: {
    identify: identify(),
    pubsub: gossipsub({
      emitSelf: true
    })
  }
}

const heliaOptions = {
  blockBrokers: [
    bitswap()
  ],
  routers: [
  ]
}
export const launchLander = async ({ directory, orbiter } = {}) => {
  const libp2p = await createLibp2p({ ...options })
  const ipfs = await createHelia({ libp2p, ...heliaOptions })

  directory = directory || './lander'

  const orbitdb = await createOrbitDB({ ipfs, directory })

  await connectPeers(orbiter.orbitdb.ipfs, ipfs)

  const lander = await Lander({ orbitdb, orbiterAddressOrId: orbiter.orbitdb.ipfs.libp2p.peerId })

  // Helper function for tests
  lander.shutdown = async () => {
    await orbitdb.stop()
    await ipfs.stop()
  }

  return lander
}
