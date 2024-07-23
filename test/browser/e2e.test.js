import { multiaddr } from '@multiformats/multiaddr'
import { peerIdFromString } from '@libp2p/peer-id'
import { strictEqual } from 'assert'
import { launchLander } from '../utils/launch-lander.js'

describe('End-to-End Browser Test', function () {
  let orbiter, lander

  beforeEach(async function () {
    orbiter = {
      orbitdb: {
        ipfs: {
          libp2p: {
            peerId: peerIdFromString(process.env.ORBITER_ID)
          }
        }
      }
    }

    orbiter.orbitdb.ipfs.libp2p.getMultiaddrs = () => {
      return [multiaddr(process.env.ORBITER_ADDRESS)]
    }

    lander = await launchLander({ orbiter })
  })

  afterEach(async function () {
    await lander.shutdown()
  })

  it('pin a db', async function () {
    const db1 = await lander.orbitdb.open('my-db')
    // await db1.add('hello world')

    await lander.pin([db1])

    const fetcher = await launchLander({ orbiter })
    const db2 = await fetcher.orbitdb.open(db1.address)
    strictEqual(db2.address, db1.address)
    strictEqual(db2.name, db1.name)
  })
})
