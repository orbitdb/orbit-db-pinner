const IPFS = require('ipfs-core')
const config = require('../config')

export default IPFS.create(config)
