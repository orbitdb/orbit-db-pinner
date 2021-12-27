const IpfsApi = require('ipfs-http-client');
const ipfs = IpfsApi.create({host: IPFS_NODE, port: '5001', protocol: 'http'});

module.exports = () => {
  return {
    'http': {
      'port': 3000,
      'enabled': true
    },
    'ipfsHttpModule': ipfs,
    'ipfsConfig': {
      'repo': './orbitdb/pinner',
      'start': true,
      'EXPERIMENTAL': {
        'pubsub': true
      },
      'config': {}
    }
  }
}

