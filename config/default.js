const IpfsApi = require('ipfs-http-client');
const ipfsHttp = IpfsApi.create({host: IPFS_NODE, port: '5001', protocol: 'http'});

const IPFS = require('ipfs')
const ipfs = IPFS.create({}) // Inject my config

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

