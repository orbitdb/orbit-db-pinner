const IPFS = require('ipfs')
const config = require('config');

const ipfsConfig = config.get('ipfsConfig')
const ipfs = new IPFS(ipfsConfig)

module.exports = ipfs
