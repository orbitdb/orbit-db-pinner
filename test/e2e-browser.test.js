import { multiaddr } from '@multiformats/multiaddr'
import { strictEqual, deepStrictEqual } from 'assert'
import { rimraf } from 'rimraf'
import { Voyager } from './utils/launch-voyager-remote.js'
import { launchVoyagerHost } from './utils/launch-voyager-host.js'
import waitFor from './utils/wait-for.js'
import connectPeers from './utils/connect-nodes-via-relay.js'

const isBrowser = () => typeof window !== 'undefined'

describe('End-to-End Browser Tests', function () {
  describe('Voyager in Nodejs', function () {
    this.timeout(10000)

    const address1 = isBrowser()
      ? multiaddr('/ip4/127.0.0.1/tcp/55441/ws/p2p/16Uiu2HAmBzKcgCfpJ4j4wJSLkKLbCVvnNBWPnhexrnJWJf1fDu5y')
      : multiaddr('/ip4/127.0.0.1/tcp/54321/p2p/16Uiu2HAmBzKcgCfpJ4j4wJSLkKLbCVvnNBWPnhexrnJWJf1fDu5y')

    const address2 = isBrowser()
      ? multiaddr('/ip4/127.0.0.1/tcp/55442/ws/p2p/16Uiu2HAmATMovCwY46yyJib7bGZF2f2XLRar7d7R3NJCSJtuyQLt')
      : multiaddr('/ip4/127.0.0.1/tcp/54322/p2p/16Uiu2HAmATMovCwY46yyJib7bGZF2f2XLRar7d7R3NJCSJtuyQLt')

    let voyager1
    let voyager2
    let voyager3

    beforeEach(async function () {
      voyager1 = await Voyager({ address: address1, directory: 'voyager1' })
      voyager2 = await Voyager({ address: address1, directory: 'voyager2' })
      voyager3 = await Voyager({ address: address2, directory: 'voyager3' })
    })

    afterEach(async function () {
      if (voyager1) {
        await voyager1.shutdown()
      }
      if (voyager2) {
        await voyager2.shutdown()
      }
      if (voyager3) {
        await voyager3.shutdown()
      }
      await rimraf('./voyager1')
      await rimraf('./voyager2')
      await rimraf('./voyager3')
    })

    it('add and replicate a database - app1->voyager1->app2', async function () {
      const entryAmount = 100
      let replicated = false

      const db1 = await voyager1.orbitdb.open('my-db')

      for (let i = 0; i < entryAmount; i++) {
        await db1.add('hello world ' + i)
      }

      const expected = await db1.all()

      console.time('add')
      await voyager1.add(db1.address)
      console.timeEnd('add')
      await voyager1.shutdown()

      console.time('add2')
      await voyager2.add(db1.address)
      console.timeEnd('add2')

      console.time('replicate')
      const db2 = await voyager2.orbitdb.open(db1.address)

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

    it('add and replicate a database - app1->voyager1->voyager2->app3', async function () {
      const entryAmount = 100
      let replicated = false

      const db1 = await voyager1.orbitdb.open('my-db2')

      for (let i = 0; i < entryAmount; i++) {
        await db1.add('hello world ' + i)
      }

      const expected = await db1.all()

      console.time('add')
      await voyager1.add(db1.address)
      console.timeEnd('add')
      await voyager1.shutdown()

      console.time('add2')
      await voyager3.add(db1.address)
      console.timeEnd('add2')

      console.time('replicate')
      const db2 = await voyager3.orbitdb.open(db1.address)
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

  describe('Voyager in browsers', function () {
    this.timeout(10000)

    const address1 = isBrowser()
      ? multiaddr('/ip4/127.0.0.1/tcp/55441/ws/p2p/16Uiu2HAmBzKcgCfpJ4j4wJSLkKLbCVvnNBWPnhexrnJWJf1fDu5y')
      : multiaddr('/ip4/127.0.0.1/tcp/54321/p2p/16Uiu2HAmBzKcgCfpJ4j4wJSLkKLbCVvnNBWPnhexrnJWJf1fDu5y')

    let host
    let voyager1
    let voyager2

    beforeEach(async function () {
      host = await launchVoyagerHost({ directory: 'host3' })

      await connectPeers(host.orbitdb.ipfs, address1)

      voyager1 = await Voyager({ address: address1, directory: 'voyager4' })
    })

    afterEach(async function () {
      if (voyager1) {
        await voyager1.shutdown()
      }
      if (voyager2) {
        await voyager2.shutdown()
      }
      if (host) {
        await host.shutdown()
      }
      await rimraf('./voyager4')
      await rimraf('./voyager5')
      await rimraf('./host3')
    })

    it('add and replicate a database - app1->voyager1(nodejs)->voyager2(browser)->app3', async function () {
      const entryAmount = 100
      let replicated = false

      const db1 = await voyager1.orbitdb.open('my-db3')

      for (let i = 0; i < entryAmount; i++) {
        await db1.add('hello world ' + i)
      }

      const expected = await db1.all()

      console.time('add')
      await voyager1.add(db1.address)
      console.timeEnd('add')

      await voyager1.shutdown()

      voyager2 = await Voyager({ address: host.orbitdb.ipfs.libp2p.getMultiaddrs().shift(), directory: 'voyager5' })

      await host.auth.add(voyager2.orbitdb.identity.id)

      console.time('add2')
      await voyager2.add(db1.address)
      console.timeEnd('add2')

      console.time('replicate')
      const db2 = await voyager2.orbitdb.open(db1.address)

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
