const path = require('path')
const config = require(path.join(process.cwd(), 'config/index.js'))

// Good idea pass default lib?
const userConfig = config()

if ('ipfsHttpModule' in userConfig) {
  module.exports = userConfig.ipfsHttpModule
} else if ('ipfsModule' in userConfig) {
  module.exports = userConfig.ipfsModule
}
