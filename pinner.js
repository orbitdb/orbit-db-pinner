const path = require('path')
const commandLineArgs = require('command-line-args')
const config = require(path.join(process.cwd(), 'config/index.js'))()

const OrbitPinner = require('./lib/OrbitPinner')
const HttpServer = require('./lib/httpServer')

const optionDefinitions = [
  { name: 'address', alias: 'd', type: String },
  { name: 'http', alias: 's', type: Boolean },
  { name: 'port', alias: 'p', type: Number },
  { name: 'follow', alias: 'f', type: String }
]

const options = commandLineArgs(optionDefinitions)

const {
  address,
  follow,
  port = config.http.port
} = options

const http = options.httpPort || config.http.enabled

if (!address && !http && !follow) {
  console.log('Orbit pinner requires an orbitdb address or http to be enabled')
  process.exit()
} else if (address) {
  // TODO maybe here need to create
  new OrbitPinner(address) /* eslint-disable-line */
} else if (http) {
  new HttpServer(port) /* eslint-disable-line */
} else if (follow) {
  const pinningList = require('./lib/pinningList')
  pinningList.follow(follow)
}
