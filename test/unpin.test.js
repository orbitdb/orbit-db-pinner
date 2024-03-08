import { strictEqual } from 'assert'
import { pipe } from 'it-pipe'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import { toString as uint8ArrayToString } from 'uint8arrays/to-string'
import Pinner from '../src/lib/pinner.js'
import Client from './utils/client.js'
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
    await rimraf('./server')
  })

  describe('Single Client', function () {
    let client
    let db
      
    beforeEach(async function () {
      client = await Client()

      db = await client.open('my-test-db')

      const dbs = source => {
        const values = [
          uint8ArrayFromString(JSON.stringify({ message: Message.PIN, id: client.identity.id, addresses: [db.address] }))
        ]

        return (async function * () {
          for await (const value of values) {
            yield value
          }
        })()
      }

      const stream = await client.ipfs.libp2p.dialProtocol(pinner.registry.orbitdb.ipfs.libp2p.peerId, pinnerProtocol)

      await pipe(dbs, stream, async source => {
        await drain(source)
      })
    })
    
    afterEach(async function () {
      await client.stop()
      await client.ipfs.stop()
      await rimraf('./client')    
    })
      
    it('unpins a database', async function () {
      const dbs = source => {
        const values = [
          uint8ArrayFromString(JSON.stringify({ message: Message.UNPIN, id: client.identity.id, addresses: [db.address] }))
        ]

        return (async function * () {
          for await (const value of values) {
            yield value
          }
        })()
      }

      const stream = await client.ipfs.libp2p.dialProtocol(pinner.registry.orbitdb.ipfs.libp2p.peerId, pinnerProtocol)

      await pipe(dbs, stream, async source => {
        await drain(source)
      })

      strictEqual(Object.values(pinner.dbs).length, 0)
    })
  })
})
