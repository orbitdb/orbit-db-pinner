import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import Orbiter from './lib/orbiter.js'
import { Access } from './lib/authorization.js'

const main = async () => {
  const argv = yargs(hideBin(process.argv)).option('directory', {
    alias: 'd',
    type: 'string',
    description: 'Specify a directory to store IPFS and OrbitDB data.'
  }).option('verbose', {
    alias: 'v',
    description: 'Be more verbose. Outputs errors and other connection messages.'
  }).option('allow', {
    alias: 'a',
    type: 'boolean',
    description: 'Allow anyone to pin a database. Defaults to false.'
  }).parse()

  const options = {}

  if (argv.directory) {
    options.directory = argv.directory
  }

  if (argv.allow) {
    options.defaultAccess = Access.ALLOW
  }

  if (argv.verbose) {
    options.verbose = Array.isArray(argv.verbose) ? argv.verbose.length : 1
  }

  const orbiter = await Orbiter(options)

  process.on('SIGINT', async () => {
    await orbiter.stop()
    process.exit(0)
  })
}

main()
