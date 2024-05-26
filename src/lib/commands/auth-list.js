import { createLibp2p } from 'libp2p'
import { LevelBlockstore } from 'blockstore-level'
import { LevelDatastore } from 'datastore-level'
import { createHelia } from 'helia'
import { createOrbitDB, Identities, KeyStore } from '@orbitdb/core'
import { join } from 'path'
import libp2pControllerConfig from '../libp2p/controller/config.js'
import { voyagerControllerProtocol } from '../protocol.js'
import { multiaddr } from '@multiformats/multiaddr'
import { pipe } from 'it-pipe'
import { ControllerRequests, Responses, createRequestMessage, parseMessage } from '../messages/index.js'
import { controller, controllerPath } from '../utils/id.js'

export default async (argv) => {
  let list = false

  const id = controller

  const directory = controllerPath(argv.directory)
  const path = join(directory, 'keystore')
  const keystore = await KeyStore({ path })
  const identities = await Identities({ keystore })
  const identity = await identities.createIdentity({ id })

  const blockstore = new LevelBlockstore(join(directory, 'ipfs', 'blocks'))
  const datastore = new LevelDatastore(join(directory, 'ipfs', 'data'))
  const libp2p = await createLibp2p(libp2pControllerConfig)
  const ipfs = await createHelia({ libp2p, datastore, blockstore })
  const orbitdb = await createOrbitDB({ ipfs, directory, identities, id })

  const config = await orbitdb.open('config', { type: 'keyvalue' })

  const addresses = await config.get('orbiter-addresses')
  const address = JSON.parse(addresses).shift()

  await orbitdb.stop()

  const stream = await libp2p.dialProtocol(multiaddr(address), voyagerControllerProtocol)

  const authList = source => {
    return (async function * () {
      const message = await createRequestMessage(ControllerRequests.AUTH_LIST, {}, identity)
      yield message
    })()
  }

  await pipe(authList, stream, async (source) => {
    for await (const chunk of source) {
      const message = parseMessage(chunk.subarray())

      if (message.type === Responses.OK) {
        console.log(message.message)
        list = true
      }
    }
  })

  return list
}
