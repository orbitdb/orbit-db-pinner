import { multiaddr } from '@multiformats/multiaddr'
import { strictEqual, deepStrictEqual } from 'assert'
import { rimraf } from 'rimraf'
import { launchLander } from './utils/launch-lander.js'
import { launchOrbiter } from './utils/launch-orbiter.js'
import waitFor from './utils/wait-for.js'
import connectPeers from './utils/connect-nodes-via-relay.js'

const isBrowser = () => typeof window !== 'undefined'

describe('End-to-End Browser Tests', function () {
  describe('Orbiter in Nodejs', function () {
    this.timeout(10000)

    const orbiterAddress1 = isBrowser()
      ? multiaddr('/ip4/127.0.0.1/tcp/55441/ws/p2p/16Uiu2HAmBzKcgCfpJ4j4wJSLkKLbCVvnNBWPnhexrnJWJf1fDu5y')
      : multiaddr('/ip4/127.0.0.1/tcp/54321/p2p/16Uiu2HAmBzKcgCfpJ4j4wJSLkKLbCVvnNBWPnhexrnJWJf1fDu5y')

    const orbiterAddress2 = isBrowser()
      ? multiaddr('/ip4/127.0.0.1/tcp/55442/ws/p2p/16Uiu2HAmATMovCwY46yyJib7bGZF2f2XLRar7d7R3NJCSJtuyQLt')
      : multiaddr('/ip4/127.0.0.1/tcp/54322/p2p/16Uiu2HAmATMovCwY46yyJib7bGZF2f2XLRar7d7R3NJCSJtuyQLt')

    let lander1
    let lander2
    let lander3

    beforeEach(async function () {
      lander1 = await launchLander({ orbiterAddress: orbiterAddress1, directory: 'lander1' })
      lander2 = await launchLander({ orbiterAddress: orbiterAddress1, directory: 'lander2' })
      lander3 = await launchLander({ orbiterAddress: orbiterAddress2, directory: 'lander3' })
    })

    afterEach(async function () {
      if (lander1) {
        await lander1.shutdown()
      }
      if (lander2) {
        await lander2.shutdown()
      }
      if (lander3) {
        await lander3.shutdown()
      }
      await rimraf('./lander1')
      await rimraf('./lander2')
      await rimraf('./lander3')
    })

    it('add pins and replicate a database - lander1->orbiter1->lander2', async function () {
      const entryAmount = 100
      let replicated = false

      const db1 = await lander1.orbitdb.open('my-db')

      for (let i = 0; i < entryAmount; i++) {
        await db1.add('hello world ' + i)
      }

      const expected = await db1.all()

      console.time('pin')
      await lander1.add(db1.address)
      console.timeEnd('pin')
      await lander1.shutdown()

      console.time('pin2')
      await lander2.add(db1.address)
      console.timeEnd('pin2')

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

    it('add pins and replicate a database - lander1->orbiter1->orbiter2->lander3', async function () {
      const entryAmount = 100
      let replicated = false

      const db1 = await lander1.orbitdb.open('my-db2')

      for (let i = 0; i < entryAmount; i++) {
        await db1.add('hello world ' + i)
      }

      const expected = await db1.all()

      console.time('pin')
      await lander1.add(db1.address)
      console.timeEnd('pin')
      await lander1.shutdown()

      console.time('pin2')
      await lander3.add(db1.address)
      console.timeEnd('pin2')

      console.time('replicate')
      const db2 = await lander3.orbitdb.open(db1.address)
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

  describe('Orbiter in the browser', function () {
    this.timeout(10000)

    const orbiterAddress1 = isBrowser()
      ? multiaddr('/ip4/127.0.0.1/tcp/55441/ws/p2p/16Uiu2HAmBzKcgCfpJ4j4wJSLkKLbCVvnNBWPnhexrnJWJf1fDu5y')
      : multiaddr('/ip4/127.0.0.1/tcp/54321/p2p/16Uiu2HAmBzKcgCfpJ4j4wJSLkKLbCVvnNBWPnhexrnJWJf1fDu5y')

    let orbiter
    let lander1
    let lander2

    beforeEach(async function () {
      orbiter = await launchOrbiter({ directory: 'orbiter3' })

      await connectPeers(orbiter.orbitdb.ipfs, orbiterAddress1)

      lander1 = await launchLander({ orbiterAddress: orbiterAddress1, directory: 'lander4' })
    })

    afterEach(async function () {
      if (lander1) {
        await lander1.shutdown()
      }
      if (lander2) {
        await lander2.shutdown()
      }
      if (orbiter) {
        await orbiter.shutdown()
      }
      await rimraf('./lander4')
      await rimraf('./lander5')
      await rimraf('./orbiter3')
    })

    it('add pins and replicate a database - lander1->orbiter1(nodejs)->orbiter2(browser)->lander3', async function () {
      const entryAmount = 100
      let replicated = false

      const db1 = await lander1.orbitdb.open('my-db3')

      for (let i = 0; i < entryAmount; i++) {
        await db1.add('hello world ' + i)
      }

      const expected = await db1.all()

      console.time('pin')
      await lander1.add(db1.address)
      console.timeEnd('pin')

      await lander1.shutdown()

      lander2 = await launchLander({ orbiterAddress: orbiter.orbitdb.ipfs.libp2p.getMultiaddrs().shift(), directory: 'lander5' })

      await orbiter.auth.add(lander2.orbitdb.identity.id)

      console.time('pin2')
      await lander2.add(db1.address)
      console.timeEnd('pin2')

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
})
