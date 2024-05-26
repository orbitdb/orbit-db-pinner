import { createHelia } from 'helia'
import { createLibp2p } from 'libp2p'
import { identify } from '@libp2p/identify'
import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { tcp } from '@libp2p/tcp'
import { webSockets } from '@libp2p/websockets'
import { gossipsub } from '@chainsafe/libp2p-gossipsub'
import { mdns } from '@libp2p/mdns'
import { createOrbitDB } from '@orbitdb/core'
import Lander from '../../src/lib/lander.js'

const options = {
  peerDiscovery: [
    mdns()
  ],
  addresses: {
    listen: [
      '/ip4/0.0.0.0/tcp/0',
      '/ip4/0.0.0.0/tcp/0/ws'
    ]
  },
  transports: [
    tcp(),
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

export const launchLander = async ({ directory, orbiterAddressOrId } = {}) => {
  const libp2p = await createLibp2p({ ...options })
  const ipfs = await createHelia({ libp2p })
  // console.log(ipfs.libp2p.getMultiaddrs())

  directory = directory || './lander'

  const orbitdb = await createOrbitDB({ ipfs, directory })

  return await Lander({ orbitdb, orbiterAddressOrId })
}