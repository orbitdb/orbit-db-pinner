const path = require('path')
const config = require(path.join(process.cwd(), 'config/index.js'))()

// Good idea pass default lib?

if ('ipfsHttpModule' in config) {
  module.exports = config.ipfsHttpModule
} else if ('ipfsModule' in config) {
  module.exports = config.ipfsModule
}
