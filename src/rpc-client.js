import { join } from 'path'
import { Identities, KeyStore } from '@orbitdb/core'
import { createLibp2p } from 'libp2p'
import { Commands, sendCommand } from './rpc/index.js'
import { rpc as rpcId, appPath, rpcPath } from './utils/id.js'
import { loadConfig } from './utils/config-manager.js'
import { config as libp2pConfig } from './utils/libp2p-config.js'
import { privateKeyFromRaw } from '@libp2p/crypto/keys'

export default async ({ directory }) => {
  const appDirectory = appPath(directory)
  const rpcDirectory = rpcPath(directory)

  let config

  try {
    config = await loadConfig({ path: appDirectory })
  } catch (error) {
    console.error('No config found. Run daemon first.')
    return
  }

  const path = join(rpcDirectory, 'keystore')
  const keystore = await KeyStore({ path })
  const identities = await Identities({ keystore })
  const identity = await identities.createIdentity({ id: rpcId })
  const privateKey = privateKeyFromRaw((await keystore.getKey(rpcId)).raw)
  const libp2p = await createLibp2p(await libp2pConfig({ privateKey }))

  const rpcCall = async (command, params) => {
    return sendCommand(identity, libp2p, config.orbiter.api, command, params)
  }

  const getId = async () => rpcCall(Commands.GET_ID)
  const getAddress = async () => rpcCall(Commands.GET_ADDRESS)
  const authAdd = async ({ id }) => rpcCall(Commands.AUTH_ADD, [id])
  const authDel = async ({ id }) => rpcCall(Commands.AUTH_DEL, [id])
  const authList = async () => rpcCall(Commands.AUTH_LIST)

  return {
    getId,
    getAddress,
    authAdd,
    authDel,
    authList
  }
}
