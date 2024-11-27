import { join } from 'path'
import { Identities, KeyStore } from '@orbitdb/core'
import { createLibp2p } from 'libp2p'
import { Commands, sendCommand } from './rpc/index.js'
import { rpc as rpcId, appPath, rpcPath } from './utils/id.js'
import { loadConfig } from './utils/config-manager.js'
import { config as libp2pConfig } from './utils/libp2p-config.js'

export default async ({ directory }) => {
  const appDirectory = appPath(directory)
  const rpcDirectory = rpcPath(directory)

  let rpcConfig

  try {
    rpcConfig = await loadConfig({ path: appDirectory })
  } catch (error) {
    console.error('No configuration found. Run daemon first.')
    return
  }

  const path = join(rpcDirectory, 'keystore')
  const keystore = await KeyStore({ path })
  const identities = await Identities({ keystore })
  const identity = await identities.createIdentity({ id: rpcId })
  const libp2p = await createLibp2p(libp2pConfig())

  const rpcCall = (command, params) => {
    return sendCommand(identity, libp2p, rpcConfig.address, command, params)
  }

  const getId = () => rpcCall(Commands.GET_ID)
  const getAddress = () => rpcCall(Commands.GET_ADDRESS)
  const authAdd = ({ id }) => rpcCall(Commands.AUTH_ADD, [id])
  const authDel = ({ id }) => rpcCall(Commands.AUTH_DEL, [id])
  const authList = () => rpcCall(Commands.AUTH_LIST)

  // All API functions are async
  return {
    getId,
    getAddress,
    authAdd,
    authDel,
    authList
  }
}
