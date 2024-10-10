import { join } from 'path'
import { Identities, KeyStore } from '@orbitdb/core'
import { createLibp2p } from 'libp2p'
import { Commands, sendCommand } from './rpc/index.js'
import { rpc as rpcId, appPath, rpcPath } from './utils/id.js'
import { loadConfig } from './utils/config-manager.js'
import { config as libp2pConfig } from './utils/libp2p-config.js'
import { privateKeyFromProtobuf } from '@libp2p/crypto/keys'

const authAdd = (identity, libp2p, address) => async ({ id }) => {
  return sendCommand(identity, libp2p, address, Commands.AUTH_ADD, [id])
}

const authDel = (identity, libp2p, address) => async ({ id }) => {
  return sendCommand(identity, libp2p, address, Commands.AUTH_DEL, [id])
}

const authList = (identity, libp2p, address) => async () => {
  return sendCommand(identity, libp2p, address, Commands.AUTH_LIST)
}

export default async ({ id, directory }) => {
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

  const privateKey = privateKeyFromProtobuf((await keystore.getKey(id)).bytes)
  const libp2p = await createLibp2p(await libp2pConfig({ privateKey }))

  return {
    authAdd: authAdd(identity, libp2p, config.orbiter.api),
    authDel: authDel(identity, libp2p, config.orbiter.api),
    authList: authList(identity, libp2p, config.orbiter.api)
  }
}
