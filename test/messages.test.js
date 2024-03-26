import { deepStrictEqual } from 'assert'
import Pinner from '../src/lib/pinner.js'
import { processMessage } from '../src/lib/messages/index.js'
import { createClient } from './utils/create-client.js'
import { rimraf } from 'rimraf'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import { toString as uint8ArrayToString } from 'uint8arrays/to-string'
import { pipe } from 'it-pipe'
import { Identities } from '@orbitdb/core'
import { Messages, Responses } from './utils/message-types.js'
import connectPeers from './utils/connect-nodes.js'

describe('Messages', function () {
  this.timeout(10000)

  let pinner
  let client
  let db

  const pinDBs = ({ message, sign } = {}) => source => {
    return (async function * () {
      const identity = client.identity
      message = message || Messages.PIN
      const pubkey = client.identity.publicKey
      const addresses = [db.address]
      const params = { addresses }
      const signature = sign ? sign(params) : await identity.sign(identity, params)

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
    client = await createClient()
    await connectPeers(pinner.ipfs, client.ipfs)
    db = await client.open('db')
  })

  afterEach(async function () {
    await pinner.stop()
    await client.stop()
    await client.ipfs.stop()
    await rimraf('./client')
    await rimraf('./pinner')
  })

  it('pins a database with OK response', async function () {
    await pinner.auth.add(client.identity.publicKey)

    const sink = async source => {
      for await (const chunk of source) {
        const response = JSON.parse(uint8ArrayToString(chunk.subarray()))
        deepStrictEqual(response, { type: Responses.OK })
      }
    }

    await pipe(pinDBs(), processMessage(pinner), sink)
  })

  it('pins a database with E_NOT_AUTHORIZED response', async function () {
    const sink = async source => {
      for await (const chunk of source) {
        const response = JSON.parse(uint8ArrayToString(chunk.subarray()))
        deepStrictEqual(response, { response: 'user is not authorized to pin', type: Responses.E_NOT_AUTHORIZED })
      }
    }

    await pipe(pinDBs(), processMessage(pinner), sink)
  })

  it('pins a database with E_INVALID_SIGNATURE response', async function () {
    await pinner.auth.add(client.identity.publicKey)

    const identities = await Identities({ path: './client/identities', ipfs: client.ipfs })
    const invalidIdentity = await identities.createIdentity({ id: 'client2' })
    const sign = async params => { await invalidIdentity.sign(invalidIdentity, params) }

    const sink = async source => {
      for await (const chunk of source) {
        const response = JSON.parse(uint8ArrayToString(chunk.subarray()))
        deepStrictEqual(response, { response: 'invalid signature', type: Responses.E_INVALID_SIGNATURE })
      }
    }

    await pipe(pinDBs({ sign }), processMessage(pinner), sink)
  })

  it('tries to pin a database with non-existent message', async function () {
    await pinner.auth.add(client.identity.publicKey)

    const sink = async source => {
      for await (const chunk of source) {
        const response = JSON.parse(uint8ArrayToString(chunk.subarray()))
        deepStrictEqual(response, { response: 'unknown function UNKNOWN', type: 300 })
      }
    }

    await pipe(pinDBs({ message: 'UNKNOWN' }), processMessage(pinner), sink)
  })
})
