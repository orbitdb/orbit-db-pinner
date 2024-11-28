import { identify } from '@libp2p/identify'
import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { webSockets } from '@libp2p/websockets'
import { gossipsub } from '@chainsafe/libp2p-gossipsub'
import { all } from '@libp2p/websockets/filters'
import { webRTC } from '@libp2p/webrtc'
import { circuitRelayTransport } from '@libp2p/circuit-relay-v2'

const Libp2pBrowserOptions = {
  addresses: {
    listen: [
      '/webrtc',
      '/p2p-circuit'
    ]
  },
  transports: [
    webSockets({
      filter: all // connect to insecure sockets also (E.g. /ws/)
    }),
    webRTC(),
    circuitRelayTransport()
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
  services: {
    identify: identify(),
    pubsub: gossipsub({
      emitSelf: true
    })
  }
}

export default Libp2pBrowserOptions
