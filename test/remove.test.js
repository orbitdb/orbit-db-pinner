import { strictEqual } from 'assert'
import { rimraf } from 'rimraf'
import { launchLander } from './utils/launch-lander.js'
import { launchOrbiter } from './utils/launch-orbiter.js'
import { createAndAddDatabases } from './utils/create-and-add-databases.js'

describe('Remove', function () {
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

    it('removes a database', async function () {
      const { addresses } = await createAndAddDatabases(1, lander)

      const removed = await lander.remove(addresses)

      strictEqual(removed, true)
      strictEqual((await orbiter.databases.all()).length, 0)
    })

    it('removes multiple databases', async function () {
      const { addresses } = await createAndAddDatabases(2, lander)

      const removed = await lander.remove(addresses)

      strictEqual(removed, true)
      strictEqual((await orbiter.databases.all()).length, 0)
    })

    it('removes a database when multiple databases have been added', async function () {
      const { addresses } = await createAndAddDatabases(2, lander)

      const removed = await lander.remove(addresses.slice(0, 1))

      strictEqual(removed, true)
      strictEqual((await orbiter.databases.all()).length, 1)
      strictEqual((await orbiter.databases.all()).pop().key, addresses[1])
    })
  })
})
