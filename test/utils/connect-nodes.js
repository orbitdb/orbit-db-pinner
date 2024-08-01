import { peerIdFromString } from '@libp2p/peer-id'

const connectIpfsNodes = async (ipfs, peerAddress) => {
  const peerId = peerIdFromString(peerAddress.getPeerId())
  await ipfs.libp2p.peerStore.save(peerId, { multiaddrs: [peerAddress] })
  await ipfs.libp2p.dial(peerId)
}

export default connectIpfsNodes
