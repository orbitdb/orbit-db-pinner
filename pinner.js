const commandLineArgs = require('command-line-args')
const config = require('config')

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
  port,
  follow
} = options

const http = options.httpPort || config.get('http.enabled')
console.log(config)

if (!address && !http && !follow) {
  console.log('Orbit pinner requires an orbitdb address or http to be enabled')
  process.exit()
} else if (address) {
  const pinner = new OrbitPinner(address) /* eslint-disable-line */
} else if (http) {
  console.log("starting http server")
  new HttpServer(port) /* eslint-disable-line */
} else if (follow) {
  const pinningList = require('./pinningList')
  pinningList.follow(follow)
}
