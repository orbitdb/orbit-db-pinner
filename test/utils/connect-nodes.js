const defaultFilter = () => true

const connectIpfsNodes = async (ipfs1, ipfs2, options = {
  filter: defaultFilter
}) => {
  await ipfs2.libp2p.peerStore.save(ipfs1.libp2p.peerId, { multiaddrs: ipfs1.libp2p.getMultiaddrs().filter(options.filter) })
  await ipfs2.libp2p.dial(ipfs1.libp2p.peerId)
}

export default connectIpfsNodes
