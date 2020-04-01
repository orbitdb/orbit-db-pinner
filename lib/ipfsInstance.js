const IPFS = require('ipfs')
const config = require('config');

const ipfsConfig = config.get('ipfsConfig')
const ipfs = IPFS.create(ipfsConfig)

module.exports = ipfs
