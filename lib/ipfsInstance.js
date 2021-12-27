const config = require('config')

// Good idea pass default lib?
const userConfig = config(IPFS)

if ('ipfsHttpModule' in userConfig) {
  module.exports = userConfig.ipfsHttpModule
} else if('ipfsModule' in userConfig) {
  module.exports = userConfig.ipfsModule
}


