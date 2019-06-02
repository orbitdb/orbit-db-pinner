const commandLineArgs = require('command-line-args')

const OrbitServer = require('./OrbitPinner.js')
const httpServer = require('./httpServer')

const optionDefinitions = [
  { name: 'address', alias: 'd', type: String },
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
}
else if (address) {
  new OrbitServer({address})
}
else {
  console.log('Orbit pinner requires a database address')
  process.exit(1)
}
