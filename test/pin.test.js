import { strictEqual } from 'assert'
import { rimraf } from 'rimraf'
import Pinner from '../src/lib/pinner.js'
import { createClient } from './utils/create-client.js'
import { createPins } from './utils/create-pins.js'
import connectPeers from './utils/connect-nodes.js'

describe('Pin', function () {
  this.timeout(10000)

  let pinner
  let pinnerAddressOrId

  beforeEach(async function () {
    pinner = await Pinner()
    pinnerAddressOrId = pinner.orbitdb.ipfs.libp2p.peerId
  })

  afterEach(async function () {
    await pinner.stop()
    await rimraf('./pinner')
  })

  describe('Single Client', function () {
    let client

    beforeEach(async function () {
      client = await createClient({ pinnerAddressOrId })
      await connectPeers(pinner.ipfs, client.orbitdb.ipfs)
      await pinner.auth.add(client.orbitdb.identity.publicKey)
    })

    afterEach(async function () {
      await client.orbitdb.stop()
      await client.orbitdb.ipfs.stop()
      await rimraf('./client')
    })

    it('pins a database', async function () {
      const { pinned, dbs } = await createPins(1, client, pinner)
      
      strictEqual(pinned, true)
      strictEqual(Object.values(pinner.dbs).pop().address, dbs.pop().address)
    })

    it('pins multiple databases', async function () {
      const { pinned, dbs } = await createPins(2, client, pinner)
      
      strictEqual(pinned, true)
      strictEqual(Object.values(pinner.dbs)[0].address, dbs[0].address)
      strictEqual(Object.values(pinner.dbs)[1].address, dbs[1].address)
    })
    
    it('tries to pin a database when not authorized', async function () {
      await pinner.auth.del(client.orbitdb.identity.publicKey)
      const dbs = [await client.orbitdb.open('db')]
      const pinned = await client.pin(dbs, pinner.orbitdb.ipfs.libp2p.peerId)

      strictEqual(pinned, false)
    })    
  })

  describe('Multiple Clients', function () {
    let client1, client2

    beforeEach(async function () {        
      client1 = await createClient({ directory: './client1', pinnerAddressOrId })
      await connectPeers(pinner.ipfs, client1.orbitdb.ipfs)
      await pinner.auth.add(client1.orbitdb.identity.publicKey)

      client2 = await createClient({ directory: './client2', pinnerAddressOrId })
      await connectPeers(pinner.ipfs, client2.orbitdb.ipfs)
      await pinner.auth.add(client2.orbitdb.identity.publicKey)
    })

    afterEach(async function () {
      await client1.orbitdb.stop()
      await client1.orbitdb.ipfs.stop()
      await rimraf('./client1')

      await client2.orbitdb.stop()
      await client2.orbitdb.ipfs.stop()
      await rimraf('./client2')
    })

    it('pins a database', async function () {
      const { pinned: pinned1, dbs: dbs1 } = await createPins(1, client1, pinner)
      const { pinned: pinned2, dbs: dbs2 } = await createPins(1, client2, pinner)

      strictEqual(Object.values(pinner.dbs)[0].address, dbs1.pop().address)
      strictEqual(Object.values(pinner.dbs)[1].address, dbs2.pop().address)
    })
  })
})
