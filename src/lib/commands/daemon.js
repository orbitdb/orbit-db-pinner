import Orbiter from '../orbiter.js'
import { Access } from '../authorization.js'

export default async (argv) => {
  const options = {}

  if (argv.directory) {
    options.directory = argv.directory
  }

  if (argv.allow) {
    options.defaultAccess = Access.ALLOW
  }

  options.verbose = argv.verbose || 0

  const orbiter = await Orbiter(options)
  process.on('SIGINT', async () => {
    await orbiter.stop()
    process.exit(0)
  })
}
