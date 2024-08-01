import { identify } from '@libp2p/identify'
import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { tcp } from '@libp2p/tcp'
import { webSockets } from '@libp2p/websockets'
import { gossipsub } from '@chainsafe/libp2p-gossipsub'
import { mdns } from '@libp2p/mdns'

export const config = ({ peerId, port, websocketPort } = {}) => {
  const conf = {
    addresses: {
      listen: [
        `/ip4/0.0.0.0/tcp/${port || 0}`,
        `/ip4/0.0.0.0/tcp/${websocketPort || 0}/ws`
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
    connectionGater: {
      denyDialMultiaddr: () => false // allow dialling of private addresses.
    },
    peerDiscovery: [
      mdns()
    ],
    services: {
      identify: identify(),
      pubsub: gossipsub({
        emitSelf: true
      })
    }
  }

  if (peerId) {
    conf.peerId = peerId
  }

  return conf
}
