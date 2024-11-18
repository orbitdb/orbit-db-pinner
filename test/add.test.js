import { strictEqual } from 'assert'
import { rimraf } from 'rimraf'
import { launchLander } from './utils/launch-lander.js'
import { launchOrbiter } from './utils/launch-orbiter.js'
import { createPins } from './utils/create-pins.js'

describe('Pin', function () {
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
      const { pinned, addresses } = await createPins(1, lander)

      strictEqual(pinned, true)
      strictEqual(Object.values(orbiter.dbs).pop().address, addresses.pop())
    })

    it('adds multiple databases', async function () {
      const { pinned, addresses } = await createPins(2, lander)

      strictEqual(pinned, true)
      strictEqual(Object.values(orbiter.dbs)[0].address, addresses[0])
      strictEqual(Object.values(orbiter.dbs)[1].address, addresses[1])
    })

    it('tries to pin a database when not authorized', async function () {
      await orbiter.auth.del(lander.orbitdb.identity.id)
      const db = await lander.orbitdb.open('db')
      const pinned = await lander.add(db.address)

      strictEqual(pinned, false)
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

    it('pins a database', async function () {
      const { addresses: addresses1 } = await createPins(1, lander1)
      const { addresses: addresses2 } = await createPins(1, lander2)

      strictEqual(Object.values(orbiter.dbs)[0].address, addresses1.pop())
      strictEqual(Object.values(orbiter.dbs)[1].address, addresses2.pop())
    })
  })
})
