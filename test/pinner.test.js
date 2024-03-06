import { strictEqual } from 'assert'
import { pipe } from 'it-pipe'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import Pinner from '../src/lib/pinner.js'
import Client from './utils/client.js'
import { rimraf } from 'rimraf'

describe('Database', function () {
  this.timeout(10000)

  it('pins a db', async function () {
    const pinner = await Pinner()
    const client = await Client()

    const db = await client.open('my-test-db')

    const dbs = source => {
      const values = [
        uint8ArrayFromString(JSON.stringify({ id: client.identity.id, address: db.address }))
      ]

      return (async function * () {
        for await (const value of values) {
          yield value
        }
      })()
    }

    const pinProto = '/orbitdb/pinner/pin/v1.0.0'

    const stream = await client.ipfs.libp2p.dialProtocol(pinner.registry.orbitdb.ipfs.libp2p.peerId, pinProto)

    await pipe(dbs, stream)

    await new Promise((resolve) => {
      const interval = setInterval(
        () => {
          if (Object.keys(pinner.dbs).length > 0) {
            clearInterval(interval)
            resolve()
          }
        }, 100)
    })

    strictEqual(Object.values(pinner.dbs).pop().address, db.address)
    
    await client.stop()
    await client.ipfs.stop()
    await pinner.stop()
  })
  
  after(async function () {
    await rimraf('./client')
    await rimraf('./server')    
  })
})