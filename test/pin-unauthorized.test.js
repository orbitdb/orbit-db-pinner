import { strictEqual } from 'assert'
import Pinner from '../src/lib/pinner.js'
import { createClient } from './utils/create-client.js'
import { createPins } from './utils/create-pins.js'
import { rimraf } from 'rimraf'

describe('Pin - Unauthorized', function () {
  this.timeout(10000)

  let pinner

  beforeEach(async function () {
    pinner = await Pinner()
  })

  afterEach(async function () {
    await pinner.orbitdb.ipfs.blockstore.child.child.close()
    await pinner.orbitdb.ipfs.datastore.close()
    await pinner.stop()
    await rimraf('./pinner')
  })

  describe('Single Client', function () {
    let client

    beforeEach(async function () {
      client = await createClient()
    })

    afterEach(async function () {
      await client.stop()
      await client.ipfs.stop()
      await rimraf('./client')
    })
    
    it('tries to pin a database when not authorized', async function () {
      const dbs1 = await createPins(1, client, pinner)
    })
  })
})
