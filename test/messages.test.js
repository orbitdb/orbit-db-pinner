import { deepStrictEqual } from 'assert'
import { Requests, Responses, RequestMessage, parseMessage } from '../src/lib/messages/index.js'
import { handleRequest } from '../src/lib/handle-request.js'
import { Voyager } from './utils/launch-voyager-remote.js'
import { launchVoyagerHost } from './utils/launch-voyager-host.js'
import { rimraf } from 'rimraf'
import { pipe } from 'it-pipe'
import { Identities } from '@orbitdb/core'

describe('Messages', function () {
  this.timeout(10000)

  let host
  let voyager
  let db

  const addDBs = ({ type, signer } = {}) => source => {
    return (async function * () {
      const addresses = [db.address]
      const message = await RequestMessage(type || Requests.ADD, addresses, voyager.orbitdb.identity, signer)
      yield message
    })()
  }

  beforeEach(async function () {
    host = await launchVoyagerHost()
    voyager = await Voyager({ address: host.orbitdb.ipfs.libp2p.getMultiaddrs().pop() })
    db = await voyager.orbitdb.open('db')
  })

  afterEach(async function () {
    await host.shutdown()
    await voyager.shutdown()
    await rimraf('./voyager')
    await rimraf('./host')
  })

  it('adds a database with OK response', async function () {
    await host.auth.add(voyager.orbitdb.identity.id)

    const sink = async source => {
      for await (const chunk of source) {
        const response = parseMessage(chunk.subarray())
        deepStrictEqual(response, { type: Responses.OK })
      }
    }

    await pipe(addDBs(), handleRequest(host), sink)
  })

  it('adds a database with E_NOT_AUTHORIZED response', async function () {
    const sink = async source => {
      for await (const chunk of source) {
        const response = parseMessage(chunk.subarray())
        deepStrictEqual(response, { message: 'user is not authorized to add', type: Responses.E_NOT_AUTHORIZED })
      }
    }

    await pipe(addDBs(), handleRequest(host), sink)
  })

  it('adds a database with E_INVALID_SIGNATURE response', async function () {
    await host.auth.add(voyager.orbitdb.identity.id)

    const identities = await Identities({ path: './voyager/identities', ipfs: voyager.ipfs })
    const invalidIdentity = await identities.createIdentity({ id: 'voyager' })
    const createInvalidSignature = async addresses => invalidIdentity.sign(invalidIdentity, addresses)

    const sink = async source => {
      for await (const chunk of source) {
        const response = parseMessage(chunk.subarray())
        deepStrictEqual(response, { message: 'invalid signature', type: Responses.E_INVALID_SIGNATURE })
      }
    }

    await pipe(addDBs({ signer: { sign: createInvalidSignature } }), handleRequest(host), sink)
  })

  it('tries to add a database with non-existent message', async function () {
    await host.auth.add(voyager.orbitdb.identity.id)

    const sink = async source => {
      for await (const chunk of source) {
        const response = parseMessage(chunk.subarray())
        deepStrictEqual(response, { message: 'unknown message type UNKNOWN', type: 300 })
      }
    }

    await pipe(addDBs({ type: 'UNKNOWN' }), handleRequest(host), sink)
  })
})
