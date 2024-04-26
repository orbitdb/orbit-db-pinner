import { strictEqual } from 'assert'
import { rimraf } from 'rimraf'
import Orbiter from '../src/lib/orbiter.js'
import { launchLander } from './utils/launch-lander.js'
import { createPins } from './utils/create-pins.js'
import connectPeers from './utils/connect-nodes.js'

describe('Pin', function () {
  this.timeout(10000)

  let orbiter
  let orbiterAddressOrId

  beforeEach(async function () {
    orbiter = await Orbiter()
    orbiterAddressOrId = orbiter.orbitdb.ipfs.libp2p.peerId
  })

  afterEach(async function () {
    await orbiter.stop()
    await rimraf('./orbiter')
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

    it('pins a database', async function () {
      const { pinned, dbs } = await createPins(1, lander, orbiter)
      
      strictEqual(pinned, true)
      strictEqual(Object.values(orbiter.dbs).pop().address, dbs.pop().address)
    })

    it('pins multiple databases', async function () {
      const { pinned, dbs } = await createPins(2, lander, orbiter)
      
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
      lander1 = await launchLander({ directory: './lander1', orbiterAddressOrId })
      await connectPeers(orbiter.ipfs, lander1.orbitdb.ipfs)
      await orbiter.auth.add(lander1.orbitdb.identity.publicKey)

      lander2 = await launchLander({ directory: './lander2', orbiterAddressOrId })
      await connectPeers(orbiter.ipfs, lander2.orbitdb.ipfs)
      await orbiter.auth.add(lander2.orbitdb.identity.publicKey)
    })

    afterEach(async function () {
      await lander1.orbitdb.stop()
      await lander1.orbitdb.ipfs.stop()
      await rimraf('./lander1')

      await lander2.orbitdb.stop()
      await lander2.orbitdb.ipfs.stop()
      await rimraf('./lander2')
    })

    it('pins a database', async function () {
      const { pinned: pinned1, dbs: dbs1 } = await createPins(1, lander1, orbiter)
      const { pinned: pinned2, dbs: dbs2 } = await createPins(1, lander2, orbiter)

      strictEqual(Object.values(orbiter.dbs)[0].address, dbs1.pop().address)
      strictEqual(Object.values(orbiter.dbs)[1].address, dbs2.pop().address)
    })
  })
})
