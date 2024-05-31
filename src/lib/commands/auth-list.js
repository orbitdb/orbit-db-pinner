import runControllerCommand from './controller.js'
import { ControllerRequests } from '../messages/index.js'

export default async (argv) => {
  const res = await runControllerCommand(ControllerRequests.AUTH_LIST, [], { directory: argv.directory })

  console.log(res.message)
}
