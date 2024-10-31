import { identify } from '@libp2p/identify'
import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { webSockets } from '@libp2p/websockets'
import { gossipsub } from '@chainsafe/libp2p-gossipsub'
import { tcp } from '@libp2p/tcp'
// import { mdns } from '@libp2p/mdns'

const Libp2pOptions = {
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
  connectionEncrypters: [
    noise()
  ],
  streamMuxers: [
    yamux()
  ],
  connectionGater: {
    denyDialMultiaddr: () => false // allow dialling of private addresses.
  },
  peerDiscovery: [
    /* mdns() */
  ],
  services: {
    identify: identify(),
    pubsub: gossipsub({
      emitSelf: true
    })
  }
}

export default Libp2pOptions
