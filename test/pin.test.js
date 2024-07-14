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
      lander = await launchLander({ orbiter })
      await orbiter.auth.add(lander.orbitdb.identity.publicKey)
    })

    afterEach(async function () {
      await lander.shutdown()
      await rimraf('./lander')
    })

    it('pins a database', async function () {
      const { pinned, dbs } = await createPins(1, lander)

      strictEqual(pinned, true)
      strictEqual(Object.values(orbiter.dbs).pop().address, dbs.pop().address)
    })

    it('pins multiple databases', async function () {
      const { pinned, dbs } = await createPins(2, lander)

      strictEqual(pinned, true)
      strictEqual(Object.values(orbiter.dbs)[0].address, dbs[0].address)
      strictEqual(Object.values(orbiter.dbs)[1].address, dbs[1].address)
    })

    it('tries to pin a database when not authorized', async function () {
      await orbiter.auth.del(lander.orbitdb.identity.publicKey)
      const dbs = [await lander.orbitdb.open('db')]
      const pinned = await lander.pin(dbs, orbiter.orbitdb.ipfs.libp2p.peerId)

      strictEqual(pinned, false)
    })
  })

  describe('Multiple Transient Peers', function () {
    let lander1, lander2

    beforeEach(async function () {
      lander1 = await launchLander({ directory: './lander1', orbiter })
      await orbiter.auth.add(lander1.orbitdb.identity.publicKey)

      lander2 = await launchLander({ directory: './lander2', orbiter })
      await orbiter.auth.add(lander2.orbitdb.identity.publicKey)
    })

    afterEach(async function () {
      await lander1.shutdown()
      await rimraf('./lander1')
      await lander2.shutdown()
      await rimraf('./lander2')
    })

    it('pins a database', async function () {
      const { dbs: dbs1 } = await createPins(1, lander1)
      const { dbs: dbs2 } = await createPins(1, lander2)

      strictEqual(Object.values(orbiter.dbs)[0].address, dbs1.pop().address)
      strictEqual(Object.values(orbiter.dbs)[1].address, dbs2.pop().address)
    })
  })
})
