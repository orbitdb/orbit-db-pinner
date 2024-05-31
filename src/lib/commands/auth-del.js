import runControllerCommand from './controller.js'
import { ControllerRequests } from '../messages/index.js'

export default async (argv) => {
  await runControllerCommand(ControllerRequests.AUTH_DEL, [argv.id], { directory: argv.directory })
}

