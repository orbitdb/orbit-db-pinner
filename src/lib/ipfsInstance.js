const IPFS = require('ipfs-core')
const config = require('../config')

module.exports = IPFS.create(config)
