import { deepStrictEqual } from 'assert'
import Pinner from '../src/lib/pinner.js'
import { Requests, Responses, createRequestMessage, parseMessage } from '../src/lib/messages/index.js'
import { handleRequest } from '../src/lib/handlers/index.js'
import { createClient } from './utils/create-client.js'
import { rimraf } from 'rimraf'
import { pipe } from 'it-pipe'
import { Identities } from '@orbitdb/core'
import connectPeers from './utils/connect-nodes.js'

describe('Messages', function () {
  this.timeout(10000)

  let pinner
  let client
  let db

  const pinDBs = ({ type, signer } = {}) => source => {
    return (async function * () {
      const addresses = [db.address]
      const message = await createRequestMessage(type || Requests.PIN, addresses, client.orbitdb.identity, signer)
      yield message
    })()
  }

  beforeEach(async function () {
    pinner = await Pinner()
    const pinnerAddressOrId = pinner.orbitdb.ipfs.libp2p.peerId
    client = await createClient({ pinnerAddressOrId })
    await connectPeers(pinner.ipfs, client.orbitdb.ipfs)
    db = await client.orbitdb.open('db')
  })

  afterEach(async function () {
    await pinner.stop()
    await client.orbitdb.stop()
    await client.orbitdb.ipfs.stop()
    await rimraf('./client')
    await rimraf('./pinner')
  })

  it('pins a database with OK response', async function () {
    await pinner.auth.add(client.orbitdb.identity.publicKey)

    const sink = async source => {
      for await (const chunk of source) {
        const response = parseMessage(chunk.subarray())
        deepStrictEqual(response, { type: Responses.OK })
      }
    }

    await pipe(pinDBs(), handleRequest(pinner), sink)
  })

  it('pins a database with E_NOT_AUTHORIZED response', async function () {
    const sink = async source => {
      for await (const chunk of source) {
        const response = parseMessage(chunk.subarray())
        deepStrictEqual(response, { message: 'user is not authorized to pin', type: Responses.E_NOT_AUTHORIZED })
      }
    }

    await pipe(pinDBs(), handleRequest(pinner), sink)
  })

  it('pins a database with E_INVALID_SIGNATURE response', async function () {
    await pinner.auth.add(client.orbitdb.identity.publicKey)

    const identities = await Identities({ path: './client/identities', ipfs: client.ipfs })
    const invalidIdentity = await identities.createIdentity({ id: 'client2' })
    const createInvalidSignature = async addresses => invalidIdentity.sign(invalidIdentity, addresses)

    const sink = async source => {
      for await (const chunk of source) {
        const response = parseMessage(chunk.subarray())
        deepStrictEqual(response, { message: 'invalid signature', type: Responses.E_INVALID_SIGNATURE })
      }
    }

    await pipe(pinDBs({ signer: { sign: createInvalidSignature } }), handleRequest(pinner), sink)
  })

  it('tries to pin a database with non-existent message', async function () {
    await pinner.auth.add(client.orbitdb.identity.publicKey)

    const sink = async source => {
      for await (const chunk of source) {
        const response = parseMessage(chunk.subarray())
        deepStrictEqual(response, { message: 'unknown message type UNKNOWN', type: 300 })
      }
    }

    await pipe(pinDBs({ type: 'UNKNOWN' }), handleRequest(pinner), sink)
  })
})
