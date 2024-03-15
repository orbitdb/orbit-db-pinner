import { createHelia } from 'helia'
import { createLibp2p } from 'libp2p'
import { identify } from '@libp2p/identify'
import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { tcp } from '@libp2p/tcp'
import { webSockets } from '@libp2p/websockets'
import { gossipsub } from '@chainsafe/libp2p-gossipsub'
import { mdns } from '@libp2p/mdns'
import { createOrbitDB, Identities, KeyStore } from '@orbitdb/core'
import { LevelBlockstore } from 'blockstore-level'
import { LevelDatastore } from 'datastore-level'
import { join } from 'path'

const options = {
  peerDiscovery: [
    mdns()
  ],
  addresses: {
    listen: [
      '/ip4/0.0.0.0/tcp/0',
      '/ip4/0.0.0.0/tcp/0/ws'
    ]
  },
  transports: [
    tcp(),
    webSockets()
  ],
  connectionEncryption: [
    noise()
  ],
  streamMuxers: [
    yamux()
  ],
  services: {
    identify: identify(),
    pubsub: gossipsub({
      emitSelf: true
    })
  }
}

const directory = join('./', 'pinner')
const path = join(directory, '/', 'keystore')

export default async () => {
  const blockstore = new LevelBlockstore(join(directory, '/', 'ipfs', '/', 'blocks'))
  const datastore = new LevelDatastore(join(directory, '/', 'ipfs', '/', 'data'))
  const libp2p = await createLibp2p(options)
  const ipfs = await createHelia({ libp2p, datastore, blockstore })

  const keystore = await KeyStore({ path })
  const identities = await Identities({ keystore })
  const id = 'pinner'

  const orbitdb = await createOrbitDB({ ipfs, directory, identities, id })

  const pins = await orbitdb.open('pins', { type: 'keyvalue' })

  const stop = async () => {
    await orbitdb.stop()
    await ipfs.stop()
  }

  return {
    pins,
    orbitdb,
    stop
  }
}
