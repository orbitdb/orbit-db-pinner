import { join } from 'path'
import { createHelia } from 'helia'
import { LevelBlockstore } from 'blockstore-level'
import { LevelDatastore } from 'datastore-level'
import { createLibp2p } from 'libp2p'
import { bitswap } from '@helia/block-brokers'
import { multiaddr } from '@multiformats/multiaddr'
import { createOrbitDB } from '@orbitdb/core'
import Host from '../../src/lib/host.js'
import { host as hostId } from '../../src/utils/id.js'

import Libp2pOptions from './test-config/voyager-host-libp2p-config.js'

const isBrowser = () => typeof window !== 'undefined'

const relayId = '12D3KooWAJjbRkp8FPF5MKgMU53aUTxWkqvDrs4zc1VMbwRwfsbE'
const relayAddress = multiaddr(`/ip4/127.0.0.1/tcp/12345/ws/p2p/${relayId}`)

const heliaOptions = {
  blockBrokers: [
    bitswap()
  ],
  routers: [
  ]
}

export const launchVoyagerHost = async ({ directory } = {}) => {
  const options = Libp2pOptions

  directory = directory || './host'

  const blockstore = new LevelBlockstore(join(directory, '/', 'ipfs', '/', 'blocks'))
  const datastore = new LevelDatastore(join(directory, '/', 'ipfs', '/', 'data'))

  const libp2p = await createLibp2p({ ...options })
  const ipfs = await createHelia({ libp2p, ...heliaOptions, datastore, blockstore })
  const orbitdb = await createOrbitDB({ ipfs, directory, id: hostId })
  const host = await Host({ orbitdb })

  if (isBrowser()) {
    await ipfs.libp2p.dial(relayAddress)
  }

  // Helper function for tests
  host.shutdown = async () => {
    await host.stop()
    await orbitdb.stop()
    await ipfs.stop()
    await datastore.close()
    await blockstore.close()
  }

  return host
}
