import { identify } from '@libp2p/identify'
import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { webSockets } from '@libp2p/websockets'
import { gossipsub } from '@chainsafe/libp2p-gossipsub'

export const config = ({ peerId, port } = {}) => {
  const conf = {
    addresses: {
      listen: [
      `/ip4/0.0.0.0/tcp/${port || 0}/ws`
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

  if (peerId) {
    conf.peerId = peerId
  }

  return conf
}
