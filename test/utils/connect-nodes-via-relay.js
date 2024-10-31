import { multiaddr } from '@multiformats/multiaddr'
import { WebRTC } from '@multiformats/multiaddr-matcher'
import { peerIdFromString } from '@libp2p/peer-id'
import waitFor from './wait-for.js'

const defaultFilter = () => true

const isBrowser = () => typeof window !== 'undefined'

const connectIpfsNodes = async (ipfs, peerAddress, options = {
  filter: defaultFilter
}) => {
  if (isBrowser()) {
    const relayId = '12D3KooWAJjbRkp8FPF5MKgMU53aUTxWkqvDrs4zc1VMbwRwfsbE'

    await ipfs.libp2p.dial(multiaddr(`/ip4/127.0.0.1/tcp/12345/ws/p2p/${relayId}`))

    let address1

    await waitFor(() => {
      address1 = ipfs.libp2p.getMultiaddrs().filter(ma => WebRTC.matches(ma)).pop()
      return address1 != null
    }, () => true)
    await ipfs.libp2p.dial(peerAddress)
  } else {
    if (peerAddress) {
      const peerId = peerIdFromString(peerAddress.getPeerId())
      await ipfs.libp2p.peerStore.save(peerId, { multiaddrs: [peerAddress] })
      await ipfs.libp2p.dial(peerAddress)
    }
  }
}

export default connectIpfsNodes
