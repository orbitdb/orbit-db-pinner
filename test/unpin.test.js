import { strictEqual } from 'assert'
import { rimraf } from 'rimraf'
import { launchLander } from './utils/launch-lander.js'
import { launchOrbiter } from './utils/launch-orbiter.js'
import { createPins } from './utils/create-pins.js'

describe('Unpin', function () {
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
      await orbiter.auth.add(lander.orbitdb.identity.publicKey)
    })

    afterEach(async function () {
      await lander.shutdown()
      await rimraf('./lander')
    })

    it('unpins a database', async function () {
      const { addresses } = await createPins(1, lander)

      const unpinned = await lander.unpin(addresses)

      strictEqual(unpinned, true)
      strictEqual((await orbiter.pins.all()).length, 0)
      strictEqual(Object.values(orbiter.dbs).length, 0)
    })

    it('unpins multiple databases', async function () {
      const { addresses } = await createPins(2, lander)

      const unpinned = await lander.unpin(addresses)

      strictEqual(unpinned, true)
      strictEqual((await orbiter.pins.all()).length, 0)
      strictEqual(Object.values(orbiter.dbs).length, 0)
    })

    it('unpins a database when multiple databases have been pinned', async function () {
      const { addresses } = await createPins(2, lander)

      const unpinned = await lander.unpin(addresses.slice(0, 1))

      strictEqual(unpinned, true)
      strictEqual((await orbiter.pins.all()).length, 1)
      strictEqual(Object.values(orbiter.dbs).pop().address, addresses[1])
    })
  })
})
