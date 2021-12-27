// const IpfsApi = require('ipfs-http-client')
// const ipfsHttp = IpfsApi.create()

const IPFS = require('ipfs')
const ipfs = IPFS.create({
  'repo': './orbitdb/pinner',
  'start': true,
  'EXPERIMENTAL': {
    'pubsub': true
  },
  'config': {}
}) // Inject my config

module.exports = () => {
  return {
    'http': {
      'port': 3000,
      'enabled': true
    },
    'ipfsHttpModule': ipfsHttp,
    'ipfsModule': ipfs
  }
}

