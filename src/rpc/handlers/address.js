export default ({ libp2p }) => {
  return libp2p.getMultiaddrs().map(a => a.toString())
}
