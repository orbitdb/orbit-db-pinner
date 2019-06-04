const commandLineArgs = require('command-line-args')

const OrbitPinner = require('./OrbitPinner.js')
const httpServer = require('./httpServer')

const optionDefinitions = [
  { name: 'address', alias: 'd', type: String },
  { name: 'http', alias: 's', type: Boolean },
  { name: 'port', alias: 'p', type: Number },
  { name: 'help', alias: 'h', type: Boolean}
]
const options = commandLineArgs(optionDefinitions)

const {
  help,
  address,
  replicate,
  http,
  port
} = options

if (help) {
  console.log(`help`)
  process.exit()
}
else if (!address && !http && !help) {
  console.log('Orbit pinner requires an orbitdb address or http to be enabled')
  process.exit()
}
else if (address) {
  new OrbitPinner(address)
}
else if (http) {
  new httpServer(port)
}





// { name: 'replicate', alias: 'r', type: String },
