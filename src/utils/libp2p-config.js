import { identify } from '@libp2p/identify'
import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { tcp } from '@libp2p/tcp'
import { webSockets } from '@libp2p/websockets'
import { gossipsub } from '@chainsafe/libp2p-gossipsub'
// import { mdns } from '@libp2p/mdns'
import { bootstrap } from '@libp2p/bootstrap'

export const config = ({ privateKey, port, websocketPort } = {}) => {
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
      bootstrap({
        list: ['/ip4/127.0.0.1/tcp/54321/p2p/16Uiu2HAmBzKcgCfpJ4j4wJSLkKLbCVvnNBWPnhexrnJWJf1fDu5y']
      })
      /* mdns() */
    ],
    services: {
      identify: identify(),
      pubsub: gossipsub({
        emitSelf: true,
        scoreThresholds: {
          graylistThreshold: -80000000000
        }
      })
    }
  }

  if (privateKey) {
    conf.privateKey = privateKey
  }

  return conf
}
