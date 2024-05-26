import { strictEqual } from 'assert'
import { rimraf } from 'rimraf'
import Orbiter from '../src/lib/orbiter.js'
import { launchLander } from './utils/launch-lander.js'
import { createPins } from './utils/create-pins.js'
import connectPeers from './utils/connect-nodes.js'

describe('Unpin', function () {
  this.timeout(10000)

  let orbiter
  let orbiterAddressOrId

  beforeEach(async function () {
    orbiter = await Orbiter()
    orbiterAddressOrId = orbiter.orbitdb.ipfs.libp2p.peerId
  })

  afterEach(async function () {
    await orbiter.stop()
    await rimraf('./voyager')
  })

  describe('Single Transient Peer', function () {
    let lander

    beforeEach(async function () {
      lander = await launchLander({ orbiterAddressOrId })
      await connectPeers(orbiter.ipfs, lander.orbitdb.ipfs)
      await orbiter.auth.add(lander.orbitdb.identity.publicKey)
    })

    afterEach(async function () {
      await lander.orbitdb.stop()
      await lander.orbitdb.ipfs.stop()
      await rimraf('./lander')
    })

    it('unpins a database', async function () {
      const { dbs } = await createPins(1, lander)

      const unpinned = await lander.unpin(dbs)

      strictEqual(unpinned, true)
      strictEqual((await orbiter.pins.all()).length, 0)
      strictEqual(Object.values(orbiter.dbs).length, 0)
    })

    it('unpins multiple databases', async function () {
      const { dbs } = await createPins(2, lander)

      const unpinned = await lander.unpin(dbs)

      strictEqual(unpinned, true)
      strictEqual((await orbiter.pins.all()).length, 0)
      strictEqual(Object.values(orbiter.dbs).length, 0)
    })

    it('unpins a database when multiple databases have been pinned', async function () {
      const { dbs } = await createPins(2, lander)

      const unpinned = await lander.unpin(dbs.slice(0, 1))

      strictEqual(unpinned, true)
      strictEqual((await orbiter.pins.all()).length, 1)
      strictEqual(Object.values(orbiter.dbs).pop().address, dbs[1].address)
    })
  })
})
