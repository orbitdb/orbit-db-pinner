import { strictEqual } from 'assert'
import { pipe } from 'it-pipe'
import drain from 'it-drain'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import Pinner from '../src/lib/pinner.js'
import { createClient } from './utils/create-client.js'
import { createPins } from './utils/create-pins.js'
import Message from './utils/message-types.js'
import { rimraf } from 'rimraf'

const pinnerProtocol = '/orbitdb/pinner/v1.0.0'

describe('Pin', function () {
  this.timeout(10000)

  let pinner

  beforeEach(async function () {
    pinner = await Pinner()
  })

  afterEach(async function () {
    await pinner.registry.orbitdb.ipfs.blockstore.child.child.close()
    await pinner.registry.orbitdb.ipfs.datastore.close()
    await pinner.stop()
    await rimraf('./pinner')
  })

  describe('Single Client', function () {
    it('pins a database', async function () {
      const client = await createClient()

      const dbs = await createPins(1, client, pinner)

      strictEqual(Object.values(pinner.dbs).pop().address, dbs.pop().address)

      await client.stop()
      await client.ipfs.stop()
      await rimraf('./client')
    })

    it('pins multiple databases', async function () {
      const client = await createClient()

      const dbs = await createPins(2, client, pinner)

      strictEqual(Object.values(pinner.dbs)[0].address, dbs[0].address)
      strictEqual(Object.values(pinner.dbs)[1].address, dbs[1].address)

      await client.stop()
      await client.ipfs.stop()
      await rimraf('./client')
    })
  })

  describe('Multiple Clients', function () {
    it('pins a database', async function () {
      const client1 = await createClient({ directory: './client1' })
      const client2 = await createClient({ directory: './client2' })

      const dbs1 = await createPins(1, client1, pinner)
      const dbs2 = await createPins(1, client2, pinner)

      strictEqual(Object.values(pinner.dbs)[0].address, dbs1.pop().address)
      strictEqual(Object.values(pinner.dbs)[1].address, dbs2.pop().address)

      await client1.stop()
      await client1.ipfs.stop()
      await rimraf('./client1')

      await client2.stop()
      await client2.ipfs.stop()
      await rimraf('./client2')
    })
  })
})
