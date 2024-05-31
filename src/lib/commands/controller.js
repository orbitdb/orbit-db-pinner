import { createLibp2p } from 'libp2p'
import { config as libp2pConfig } from '../libp2p/config.js'
import { voyagerControllerProtocol } from '../protocol.js'
import { multiaddr } from '@multiformats/multiaddr'
import { pipe } from 'it-pipe'
import { createRequestMessage, parseMessage } from '../messages/index.js'
import { controller, appPath, controllerPath } from '../utils/id.js'
import { loadConfig } from '../utils/config-manager.js'
import { join } from 'path'
import { Identities, KeyStore } from '@orbitdb/core'
import { createFromPrivKey } from '@libp2p/peer-id-factory'

export default async (type, args, { directory }) => {
  let res = null

  const id = controller

  const appDirectory = appPath(directory)
  const controllerDirectory = controllerPath(directory)

  let config

  try {
    config = await loadConfig({ path: appDirectory })
  } catch (error) {
    console.error('No config found. Run daemon first.')
    return
  }

  const path = join(controllerDirectory, 'keystore')
  const keystore = await KeyStore({ path })
  const identities = await Identities({ keystore })
  const identity = await identities.createIdentity({ id })

  const peerId = await createFromPrivKey(await keystore.getKey(id))
  const libp2p = await createLibp2p(await libp2pConfig({ peerId }))

  const stream = await libp2p.dialProtocol(multiaddr(config.orbiter.api), voyagerControllerProtocol)

  const request = source => {
    return (async function * () {
      const message = await createRequestMessage(type, args, identity)
      yield message
    })()
  }

  await pipe(request, stream, async (source) => {
    for await (const chunk of source) {
      res = parseMessage(chunk.subarray())
    }
  })

  return res
}
