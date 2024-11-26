import { strictEqual } from 'assert'
import { rimraf } from 'rimraf'
import { launchLander } from './utils/launch-lander.js'
import { launchOrbiter } from './utils/launch-orbiter.js'
import { createAndAddDatabases } from './utils/create-and-add-databases.js'

describe('Add', function () {
  this.timeout(10000)

  let orbiter

  beforeEach(async function () {
    orbiter = await launchOrbiter()
  })

  afterEach(async function () {
    await orbiter.shutdown()
    await rimraf('./orbiter')
  })

  describe('Single Transient Peer', function () {
    let lander

    beforeEach(async function () {
      lander = await launchLander({ orbiterAddress: orbiter.orbitdb.ipfs.libp2p.getMultiaddrs().pop() })
      await orbiter.auth.add(lander.orbitdb.identity.id)
    })

    afterEach(async function () {
      await lander.shutdown()
      await rimraf('./lander')
    })

    it('adds a database', async function () {
      const { added, addresses } = await createAndAddDatabases(1, lander)

      strictEqual(added, true)
      strictEqual((await orbiter.databases.all()).pop().key, addresses.pop())
    })

    it('adds multiple databases', async function () {
      const { added, addresses } = await createAndAddDatabases(2, lander)

      strictEqual(added, true)
      strictEqual((await orbiter.databases.all())[0].key, addresses[0])
      strictEqual((await orbiter.databases.all())[1].key, addresses[1])
    })

    it('tries to add a database when not authorized', async function () {
      await orbiter.auth.del(lander.orbitdb.identity.id)
      const db = await lander.orbitdb.open('db')
      const added = await lander.add(db.address)

      strictEqual(added, false)
    })
  })

  describe('Multiple Transient Peers', function () {
    let lander1, lander2

    beforeEach(async function () {
      lander1 = await launchLander({ orbiterAddress: orbiter.orbitdb.ipfs.libp2p.getMultiaddrs().pop(), directory: './lander1' })
      await orbiter.auth.add(lander1.orbitdb.identity.id)

      lander2 = await launchLander({ orbiterAddress: orbiter.orbitdb.ipfs.libp2p.getMultiaddrs().pop(), directory: './lander2' })
      await orbiter.auth.add(lander2.orbitdb.identity.id)
    })

    afterEach(async function () {
      await lander1.shutdown()
      await rimraf('./lander1')
      await lander2.shutdown()
      await rimraf('./lander2')
    })

    it('adds a databases to voyager', async function () {
      const { addresses: addresses1 } = await createAndAddDatabases(1, lander1)
      const { addresses: addresses2 } = await createAndAddDatabases(1, lander2)

      strictEqual((await orbiter.databases.all())[0].key, addresses1.pop())
      strictEqual((await orbiter.databases.all())[1].key, addresses2.pop())
    })
  })
})
