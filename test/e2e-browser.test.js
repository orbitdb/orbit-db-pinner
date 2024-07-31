import { multiaddr } from '@multiformats/multiaddr'
import { peerIdFromString } from '@libp2p/peer-id'
import { strictEqual, deepStrictEqual } from 'assert'
import { launchLander } from './utils/launch-lander.js'
import waitFor from './utils/wait-for.js'

describe('End-to-End Browser Test', function () {
  this.timeout(100000)

  let orbiter
  let lander1
  let lander2

  beforeEach(async function () {
    const peerId = peerIdFromString('16Uiu2HAmBzKcgCfpJ4j4wJSLkKLbCVvnNBWPnhexrnJWJf1fDu5y')
    const peerAddress = multiaddr('/ip4/127.0.0.1/tcp/54321/ws/p2p/16Uiu2HAmBzKcgCfpJ4j4wJSLkKLbCVvnNBWPnhexrnJWJf1fDu5y')

    orbiter = {
      orbitdb: {
        ipfs: {
          libp2p: {
            peerId
          }
        }
      }
    }

    orbiter.orbitdb.ipfs.libp2p.getMultiaddrs = () => {
      return [peerAddress]
    }

    lander1 = await launchLander({ orbiter, directory: 'lander1' })
    lander2 = await launchLander({ orbiter, directory: 'lander2' })
  })

  afterEach(async function () {
    if (lander1) {
      await lander1.shutdown()
    }
    if (lander2) {
      await lander2.shutdown()
    }
  })

  it('pin a db', async function () {
    const entryAmount = 1000
    let replicated = false

    const db1 = await lander1.orbitdb.open('my-db')

    console.log('write')
    for (let i = 0; i < entryAmount; i++) {
      await db1.add('hello world ' + i)
    }

    const expected = await db1.all()

    console.log('pin')
    console.time('pin')
    await lander1.pin([db1])
    console.timeEnd('pin')
    await lander1.shutdown()

    console.log('replicate')
    console.time('replicate')
    const db2 = await lander2.orbitdb.open(db1.address)

    const onConnected = (peerId, heads) => {
      replicated = true
    }

    db2.events.on('join', onConnected)

    await waitFor(() => replicated, () => true)
    console.timeEnd('replicate')

    const res = await db2.all()

    strictEqual(expected.length, entryAmount)
    strictEqual(res.length, entryAmount)
    deepStrictEqual(expected, res)
  })
})
