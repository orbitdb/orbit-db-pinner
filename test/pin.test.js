import { strictEqual } from 'assert'
import { rimraf } from 'rimraf'
import Pinner from '../src/lib/pinner.js'
import { createClient } from './utils/create-client.js'
import { createPins } from './utils/create-pins.js'
import connectPeers from './utils/connect-nodes.js'

describe('Pin', function () {
  this.timeout(10000)

  let pinner

  beforeEach(async function () {
    pinner = await Pinner()
  })

  afterEach(async function () {
    await pinner.stop()
    await rimraf('./pinner')
  })

  describe('Single Client', function () {
    let client

    beforeEach(async function () {
      client = await createClient()
      await connectPeers(pinner.ipfs, client.ipfs)
      await pinner.auth.add(client.identity.publicKey)
    })

    afterEach(async function () {
      await client.stop()
      await client.ipfs.stop()
      await rimraf('./client')
    })

    it('pins a database', async function () {
      const dbs = await createPins(1, client, pinner)
      strictEqual(Object.values(pinner.dbs).pop().address, dbs.pop().address)
    })

    it('pins multiple databases', async function () {
      const dbs = await createPins(2, client, pinner)

      strictEqual(Object.values(pinner.dbs)[0].address, dbs[0].address)
      strictEqual(Object.values(pinner.dbs)[1].address, dbs[1].address)
    })
  })

  describe('Multiple Clients', function () {
    let client1, client2

    beforeEach(async function () {
      client1 = await createClient({ directory: './client1' })
      await connectPeers(pinner.ipfs, client1.ipfs)
      await pinner.auth.add(client1.identity.publicKey)

      client2 = await createClient({ directory: './client2' })
      await connectPeers(pinner.ipfs, client2.ipfs)
      await pinner.auth.add(client2.identity.publicKey)
    })

    afterEach(async function () {
      await client1.stop()
      await client1.ipfs.stop()
      await rimraf('./client1')

      await client2.stop()
      await client2.ipfs.stop()
      await rimraf('./client2')
    })

    it('pins a database', async function () {
      const dbs1 = await createPins(1, client1, pinner)
      const dbs2 = await createPins(1, client2, pinner)

      strictEqual(Object.values(pinner.dbs)[0].address, dbs1.pop().address)
      strictEqual(Object.values(pinner.dbs)[1].address, dbs2.pop().address)
    })
  })
})
