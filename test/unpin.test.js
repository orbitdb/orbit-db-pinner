import { strictEqual } from 'assert'
import { pipe } from 'it-pipe'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import Pinner from '../src/lib/pinner.js'
import { createClient } from './utils/create-client.js'
import Message from './utils/message-types.js'
import { rimraf } from 'rimraf'
import drain from 'it-drain'

const pinnerProtocol = '/orbitdb/pinner/v1.0.0'

describe('Unpin', function () {
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
    let client

    const createPins = async length => {
      const dbs = []

      for (let i = 1; i <= length; i++) {
        dbs.push(await client.open(`db${i}`))
      }

      const pinDBs = source => {
        const values = [
          uint8ArrayFromString(JSON.stringify({ message: Message.PIN, id: client.identity.id, addresses: dbs.map(p => p.address) }))
        ]

        return (async function * () {
          for await (const value of values) {
            yield value
          }
        })()
      }

      const stream = await client.ipfs.libp2p.dialProtocol(pinner.registry.orbitdb.ipfs.libp2p.peerId, pinnerProtocol)

      await pipe(pinDBs, stream, async source => {
        await drain(source)
      })

      return dbs
    }

    beforeEach(async function () {
      client = await createClient()
    })

    afterEach(async function () {
      await client.stop()
      await client.ipfs.stop()
      await rimraf('./client')
    })

    it('unpins a database', async function () {
      const pins = await createPins(1)

      const unpinDBs = source => {
        const values = [
          uint8ArrayFromString(JSON.stringify({ message: Message.UNPIN, id: client.identity.id, addresses: pins.map(p => p.address) }))
        ]

        return (async function * () {
          for await (const value of values) {
            yield value
          }
        })()
      }

      const stream = await client.ipfs.libp2p.dialProtocol(pinner.registry.orbitdb.ipfs.libp2p.peerId, pinnerProtocol)

      await pipe(unpinDBs, stream, async source => {
        await drain(source)
      })

      strictEqual(Object.values(pinner.dbs).length, 0)
    })

    it('unpins multiple databases', async function () {
      const pins = await createPins(2)

      const unpinDBs = source => {
        const values = [
          uint8ArrayFromString(JSON.stringify({ message: Message.UNPIN, id: client.identity.id, addresses: pins.map(p => p.address) }))
        ]

        return (async function * () {
          for await (const value of values) {
            yield value
          }
        })()
      }

      const stream = await client.ipfs.libp2p.dialProtocol(pinner.registry.orbitdb.ipfs.libp2p.peerId, pinnerProtocol)

      await pipe(unpinDBs, stream, async source => {
        await drain(source)
      })

      strictEqual(Object.values(pinner.dbs).length, 0)
    })

    it('unpins a database when multiple databases have been pinned', async function () {
      const pins = await createPins(2)

      const unpinDBs = source => {
        const values = [
          uint8ArrayFromString(JSON.stringify({ message: Message.UNPIN, id: client.identity.id, addresses: [pins[0].address] }))
        ]

        return (async function * () {
          for await (const value of values) {
            yield value
          }
        })()
      }

      const stream = await client.ipfs.libp2p.dialProtocol(pinner.registry.orbitdb.ipfs.libp2p.peerId, pinnerProtocol)

      await pipe(unpinDBs, stream, async source => {
        await drain(source)
      })

      strictEqual(Object.values(pinner.dbs).length, 1)
      strictEqual(Object.values(pinner.dbs).pop().address, pins[1].address)
    })
  })
})
