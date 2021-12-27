const IPFS = require('ipfs')
const config = require('config')

// Good idea pass default lib?
const userConfig = config(IPFS)

if ('ipfsHttpModule' in userConfig) {
  module.exports = userConfig.ipfsHttpModule
} else if('ipfsConfig' in userConfig) {
  module.exports = IPFS.create(userConfig.ipfsConfig)
}


