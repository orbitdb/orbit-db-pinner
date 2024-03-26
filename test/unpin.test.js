import { strictEqual } from 'assert'
import { rimraf } from 'rimraf'
import { pipe } from 'it-pipe'
import drain from 'it-drain'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import Pinner from '../src/lib/pinner.js'
import { createClient } from './utils/create-client.js'
import { createPins } from './utils/create-pins.js'
import { Messages } from './utils/message-types.js'
import connectPeers from './utils/connect-nodes.js'

const pinnerProtocol = '/orbitdb/pinner/v1.0.0'

describe('Unpin', function () {
  this.timeout(10000)

  let pinner

  const unpinDBs = (client, pins) => source => {
    return (async function * () {
      const identity = client.identity
      const message = Messages.UNPIN
      const pubkey = client.identity.publicKey
      const addresses = pins.map(p => p.address)
      const params = { addresses }
      const signature = await identity.sign(identity, params)

      const values = [
        uint8ArrayFromString(JSON.stringify({ message, signature, pubkey, ...params }))
      ]

      for await (const value of values) {
        yield value
      }
    })()
  }

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

    it('unpins a database', async function () {
      const pins = await createPins(1, client, pinner)

      const stream = await client.ipfs.libp2p.dialProtocol(pinner.orbitdb.ipfs.libp2p.peerId, pinnerProtocol)

      await pipe(unpinDBs(client, pins), stream, async source => {
        await drain(source)
      })

      strictEqual((await pinner.pins.all()).length, 0)
      strictEqual(Object.values(pinner.dbs).length, 0)
    })

    it('unpins multiple databases', async function () {
      const pins = await createPins(2, client, pinner)

      const stream = await client.ipfs.libp2p.dialProtocol(pinner.orbitdb.ipfs.libp2p.peerId, pinnerProtocol)

      await pipe(unpinDBs(client, pins), stream, async source => {
        await drain(source)
      })

      strictEqual((await pinner.pins.all()).length, 0)
      strictEqual(Object.values(pinner.dbs).length, 0)
    })

    it('unpins a database when multiple databases have been pinned', async function () {
      const pins = await createPins(2, client, pinner)

      const stream = await client.ipfs.libp2p.dialProtocol(pinner.orbitdb.ipfs.libp2p.peerId, pinnerProtocol)

      await pipe(unpinDBs(client, pins.slice(0, 1)), stream, async source => {
        await drain(source)
      })

      strictEqual((await pinner.pins.all()).length, 1)
      strictEqual(Object.values(pinner.dbs).pop().address, pins[1].address)
    })
  })
})
