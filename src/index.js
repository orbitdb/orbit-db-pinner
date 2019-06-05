const commandLineArgs = require('command-line-args')

const OrbitPinner = require('./OrbitPinner.js')
const httpServer = require('./httpServer')
const manifest = require('./Manifest')

const optionDefinitions = [
  { name: 'address', alias: 'd', type: String },
  { name: 'http', alias: 's', type: Boolean },
  { name: 'port', alias: 'p', type: Number }
]

const options = commandLineArgs(optionDefinitions)

const {
  address
, port
} = options

const http = options.httpPort || config.get('http.enabled')

if ( !address && !http ) {
  console.log('Orbit pinner requires an orbitdb address or http to be enabled')
  process.exit()
}
else if ( address ) {
  new OrbitPinner(address)
}
else if ( http ) {
  new httpServer(port)
}





// { name: 'replicate', alias: 'r', type: String },
