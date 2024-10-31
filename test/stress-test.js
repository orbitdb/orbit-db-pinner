import { multiaddr } from '@multiformats/multiaddr'
import { strictEqual, deepStrictEqual } from 'assert'
import { rimraf } from 'rimraf'
import { launchLander } from './utils/launch-lander.js'
import { launchOrbiter } from './utils/launch-orbiter.js'
import waitFor from './utils/wait-for.js'
import connectPeers from './utils/connect-nodes-via-relay.js'

const isBrowser = () => typeof window !== 'undefined'

describe('End-to-End Browser Tests', function () {
  describe('Orbiter in the browser', function () {
    this.timeout(10000000)

    // const orbiterAddress1 = isBrowser()
    //   ? multiaddr('/ip4/127.0.0.1/tcp/55441/ws/p2p/16Uiu2HAmBzKcgCfpJ4j4wJSLkKLbCVvnNBWPnhexrnJWJf1fDu5y')
    //   : multiaddr('/ip4/127.0.0.1/tcp/54321/p2p/16Uiu2HAmBzKcgCfpJ4j4wJSLkKLbCVvnNBWPnhexrnJWJf1fDu5y')

    // const orbiterAddress2 = isBrowser()
    //   ? multiaddr('/ip4/127.0.0.1/tcp/55442/ws/p2p/16Uiu2HAmATMovCwY46yyJib7bGZF2f2XLRar7d7R3NJCSJtuyQLt')
    //   : multiaddr('/ip4/127.0.0.1/tcp/54322/p2p/16Uiu2HAmATMovCwY46yyJib7bGZF2f2XLRar7d7R3NJCSJtuyQLt')

    let orbiter
    let lander1
    let lander2

    before(async function () {
      orbiter = await launchOrbiter({ directory: 'orbiter3' })
    })

    after(async function () {
      if (orbiter) {
        await orbiter.shutdown()
      }
      await rimraf('./orbiter3')
    })

    it.only('pin and replicate a database - lander1->orbiter1(nodejs)->orbiter2(nodejs)->lander2', async function () {
      const rounds = 50
      const entryAmount = 100
      const addr = orbiter.orbitdb.ipfs.libp2p.getMultiaddrs().shift()

      console.log("start", addr)
      for (let k = 1; k <= rounds; k ++) {
        let replicated = false

        // lander1 = await launchLander({ orbiterAddress: orbiterAddress1, directory: 'lander4' })
        lander1 = await launchLander({ orbiterAddress: addr, directory: 'lander4' })
        await orbiter.auth.add(lander1.orbitdb.identity.id)

        const db1 = await lander1.orbitdb.open('my-db3')

        // console.log("--", lander1.orbitdb.ipfs.libp2p.peerId.toString(), db1.address)

        for (let i = 0; i < entryAmount; i++) {
          await db1.add('hello world ' + i)
        }

        const expected = await db1.all()

        // console.time('pin')
        await lander1.pin(db1.address)
        // console.timeEnd('pin')

        await lander1.shutdown()

        lander2 = await launchLander({ orbiterAddress: addr, directory: 'lander5' })
        await orbiter.auth.add(lander2.orbitdb.identity.id)
        // lander2 = await launchLander({ orbiterAddress: orbiterAddress1, directory: 'lander5' })


        // console.time('pin2')
        // await lander2.pin(db1.address)
        // console.timeEnd('pin2')

        // console.time('replicate')
        // console.log("open", db1.address)
        console.time('round ' + k + "/" + rounds)
        const db2 = await lander2.orbitdb.open(db1.address)

        const onConnected = (peerId, heads) => {
          replicated = true
        }

        db2.events.on('join', onConnected)

        await waitFor(() => replicated, () => true)
        // console.timeEnd('replicate')
        console.timeEnd('round ' + k + "/" + rounds)

        const res = await db2.all()

        strictEqual(expected.length, entryAmount)
        strictEqual(res.length, entryAmount)
        deepStrictEqual(expected, res)
        // console.log('done  ' + k + "/" + rounds)

        if (lander1) {
          await lander1.shutdown()
        }
        if (lander2) {
          await lander2.shutdown()
        }
        await rimraf('./lander4')
        await rimraf('./lander5')
      }
    })
  })
})
