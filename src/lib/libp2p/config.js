import { identify } from '@libp2p/identify'
import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { webSockets } from '@libp2p/websockets'
import { gossipsub } from '@chainsafe/libp2p-gossipsub'
import { createFromPrivKey } from '@libp2p/peer-id-factory'
import { unmarshalPrivateKey } from '@libp2p/crypto/keys'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'

let peerId

if (process.env.PRIVATE_KEY) {
  const encoded = uint8ArrayFromString(process.env.PRIVATE_KEY, 'hex')
  const privateKey = await unmarshalPrivateKey(encoded)
  peerId = await createFromPrivKey(privateKey)
}

export default {
  peerId,
  addresses: {
    listen: [
      '/ip4/0.0.0.0/tcp/43301/ws'
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
