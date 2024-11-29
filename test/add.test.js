import { strictEqual } from 'assert'
import { rimraf } from 'rimraf'
import { Voyager } from './utils/launch-voyager-remote.js'
import { launchVoyagerHost } from './utils/launch-voyager-host.js'
import { createAndAddDatabases } from './utils/create-and-add-databases.js'

describe('Add', function () {
  this.timeout(10000)

  let host

  beforeEach(async function () {
    host = await launchVoyagerHost()
  })

  afterEach(async function () {
    await host.shutdown()
    await rimraf('./host')
  })

  describe('Single Transient Peer', function () {
    let voyager

    beforeEach(async function () {
      voyager = await Voyager({ address: host.orbitdb.ipfs.libp2p.getMultiaddrs().pop() })
      await host.auth.add(voyager.orbitdb.identity.id)
    })

    afterEach(async function () {
      await voyager.shutdown()
      await rimraf('./voyager')
    })

    it('adds a database', async function () {
      const { added, addresses } = await createAndAddDatabases(1, voyager)

      strictEqual(added, true)
      strictEqual((await host.databases.all()).pop().key, addresses.pop())
    })

    it('adds multiple databases', async function () {
      const { added, addresses } = await createAndAddDatabases(2, voyager)

      strictEqual(added, true)
      strictEqual((await host.databases.all())[0].key, addresses[0])
      strictEqual((await host.databases.all())[1].key, addresses[1])
    })

    it('tries to add a database when not authorized', async function () {
      await host.auth.del(voyager.orbitdb.identity.id)
      const db = await voyager.orbitdb.open('db')
      const added = await voyager.add(db.address)

      strictEqual(added, false)
    })
  })

  describe('Multiple Transient Peers', function () {
    let voyager1, voyager2

    beforeEach(async function () {
      voyager1 = await Voyager({ address: host.orbitdb.ipfs.libp2p.getMultiaddrs().pop(), directory: './voyager1' })
      await host.auth.add(voyager1.orbitdb.identity.id)

      voyager2 = await Voyager({ address: host.orbitdb.ipfs.libp2p.getMultiaddrs().pop(), directory: './voyager2' })
      await host.auth.add(voyager2.orbitdb.identity.id)
    })

    afterEach(async function () {
      await voyager1.shutdown()
      await rimraf('./voyager1')
      await voyager2.shutdown()
      await rimraf('./voyager2')
    })

    it('adds a databases to Voyager', async function () {
      const { addresses: addresses1 } = await createAndAddDatabases(1, voyager1)
      const { addresses: addresses2 } = await createAndAddDatabases(1, voyager2)

      strictEqual((await host.databases.all())[0].key, addresses1.pop())
      strictEqual((await host.databases.all())[1].key, addresses2.pop())
    })
  })
})
