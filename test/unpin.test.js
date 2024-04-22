import { strictEqual } from 'assert'
import { rimraf } from 'rimraf'
import { pipe } from 'it-pipe'
import drain from 'it-drain'
import Pinner from '../src/lib/pinner.js'
import { Requests, createRequestMessage } from '../src/lib/messages/index.js'
import { pinnerProtocol } from '../src/lib/protocol.js'
import { createClient } from './utils/create-client.js'
import { createPins } from './utils/create-pins.js'
import connectPeers from './utils/connect-nodes.js'

describe('Unpin', function () {
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

    it('unpins a database', async function () {
      const { pinned, dbs } = await createPins(1, client, pinner)

      const unpinned = await client.unpin(dbs)

      strictEqual(unpinned, true)
      strictEqual((await pinner.pins.all()).length, 0)
      strictEqual(Object.values(pinner.dbs).length, 0)
    })

    it('unpins multiple databases', async function () {
      const { pinned, dbs } = await createPins(2, client, pinner)
      
      const unpinned = await client.unpin(dbs)

      strictEqual(unpinned, true)
      strictEqual((await pinner.pins.all()).length, 0)
      strictEqual(Object.values(pinner.dbs).length, 0)
    })

    it('unpins a database when multiple databases have been pinned', async function () {
      const { pinned, dbs } = await createPins(2, client, pinner)
      
      const unpinned = await client.unpin(dbs.slice(0, 1))

      strictEqual(unpinned, true)
      strictEqual((await pinner.pins.all()).length, 1)
      strictEqual(Object.values(pinner.dbs).pop().address, dbs[1].address)
    })
  })
})
