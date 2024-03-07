import { strictEqual } from 'assert'
import { pipe } from 'it-pipe'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import { toString as uint8ArrayToString } from 'uint8arrays/to-string'
import Pinner from '../src/lib/pinner.js'
import Client from './utils/client.js'
import { rimraf } from 'rimraf'

describe('Pinner', function () {
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
    it('pins a database', async function () {
      const client = await Client()

      const db = await client.open('my-test-db')

      const dbs = source => {
        const values = [
          uint8ArrayFromString(JSON.stringify({ id: client.identity.id, addresses: [db.address] }))
        ]

        return (async function * () {
          for await (const value of values) {
            yield value
          }
        })()
      }

      const isPinned = async source => {
        for await (const chunk of source) {
          console.log(JSON.parse(uint8ArrayToString(chunk.subarray())))
        }
      }

      const pinProto = '/orbitdb/pinner/pin/v1.0.0'

      const stream = await client.ipfs.libp2p.dialProtocol(pinner.registry.orbitdb.ipfs.libp2p.peerId, pinProto)

      await pipe(dbs, stream, isPinned)

      strictEqual(Object.values(pinner.dbs).pop().address, db.address)

      await client.stop()
      await client.ipfs.stop()
      await rimraf('./client')
    })

    it('pins multiple databases', async function () {
      const client = await Client()

      const db1 = await client.open('db-1')
      const db2 = await client.open('db-2')

      const dbs = source => {
        const values = [
          uint8ArrayFromString(JSON.stringify({ id: client.identity.id, addresses: [db1.address, db2.address] }))
        ]

        return (async function * () {
          for await (const value of values) {
            yield value
          }
        })()
      }

      const isPinned = async source => {
        for await (const chunk of source) {
          console.log(JSON.parse(uint8ArrayToString(chunk.subarray())))
        }
      }

      const pinProto = '/orbitdb/pinner/pin/v1.0.0'

      const stream = await client.ipfs.libp2p.dialProtocol(pinner.registry.orbitdb.ipfs.libp2p.peerId, pinProto)

      await pipe(dbs, stream, isPinned)

      strictEqual(Object.values(pinner.dbs)[0].address, db1.address)
      strictEqual(Object.values(pinner.dbs)[1].address, db2.address)

      await client.stop()
      await client.ipfs.stop()
      await rimraf('./client')
    })
  })

  describe('Multiple Clients', function () {
    it('pins a database', async function () {
      const client1 = await Client({ directory: './client1' })
      const client2 = await Client({ directory: './client2' })

      const db1 = await client1.open('client-1-db')
      const db2 = await client2.open('client-2-db')

      const dbs1 = source => {
        const values = [
          uint8ArrayFromString(JSON.stringify({ id: client1.identity.id, addresses: [db1.address] }))
        ]

        return (async function * () {
          for await (const value of values) {
            yield value
          }
        })()
      }

      const dbs2 = source => {
        const values = [
          uint8ArrayFromString(JSON.stringify({ id: client2.identity.id, addresses: [db2.address] }))
        ]

        return (async function * () {
          for await (const value of values) {
            yield value
          }
        })()
      }

      const isPinned1 = async source => {
        for await (const chunk of source) {
          console.log(JSON.parse(uint8ArrayToString(chunk.subarray())))
        }
      }

      const isPinned2 = async source => {
        for await (const chunk of source) {
          console.log(JSON.parse(uint8ArrayToString(chunk.subarray())))
        }
      }

      const pinProto = '/orbitdb/pinner/pin/v1.0.0'

      const stream1 = await client1.ipfs.libp2p.dialProtocol(pinner.registry.orbitdb.ipfs.libp2p.peerId, pinProto)

      await pipe(dbs1, stream1, isPinned1)

      const stream2 = await client2.ipfs.libp2p.dialProtocol(pinner.registry.orbitdb.ipfs.libp2p.peerId, pinProto)

      await pipe(dbs2, stream2, isPinned2)

      strictEqual(Object.values(pinner.dbs)[0].address, db1.address)
      strictEqual(Object.values(pinner.dbs)[1].address, db2.address)

      await client1.stop()
      await client1.ipfs.stop()
      await rimraf('./client1')

      await client2.stop()
      await client2.ipfs.stop()
      await rimraf('./client2')
    })
  })
})
