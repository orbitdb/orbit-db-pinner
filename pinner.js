const commandLineArgs = require('command-line-args')
const config = require('config');

const OrbitPinner = require('./lib/OrbitPinner')
const httpServer = require('./lib/httpServer')

const optionDefinitions = [
  { name: 'address', alias: 'd', type: String },
  { name: 'http', alias: 's', type: Boolean },
  { name: 'port', alias: 'p', type: Number },
  { name: 'follow', alias: 'f', type: String }
]

const options = commandLineArgs(optionDefinitions)

const {
  address
, port
, follow
} = options

const http = options.httpPort || config.get('http.enabled')

if ( !address && !http && !follow) {
  console.log('Orbit pinner requires an orbitdb address or http to be enabled')
  process.exit()
}
else if ( address ) {
  new OrbitPinner(address)
}
else if ( http ) {
  new httpServer(port)
}
else if(follow) {
  const pinningList = require('./pinningList')
  pinningList.follow(follow)
}
