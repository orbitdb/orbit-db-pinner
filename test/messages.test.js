import { deepStrictEqual } from 'assert'
import Orbiter from '../src/lib/orbiter.js'
import { Requests, Responses, createRequestMessage, parseMessage } from '../src/lib/messages/index.js'
import { handleRequest } from '../src/lib/handlers/index.js'
import { launchLander } from './utils/launch-lander.js'
import { rimraf } from 'rimraf'
import { pipe } from 'it-pipe'
import { Identities } from '@orbitdb/core'
import connectPeers from './utils/connect-nodes.js'

describe('Messages', function () {
  this.timeout(10000)

  let orbiter
  let lander
  let db

  const pinDBs = ({ type, signer } = {}) => source => {
    return (async function * () {
      const addresses = [db.address]
      const message = await createRequestMessage(type || Requests.PIN, addresses, lander.orbitdb.identity, signer)
      yield message
    })()
  }

  beforeEach(async function () {
    orbiter = await Orbiter()
    const orbiterAddressOrId = orbiter.orbitdb.ipfs.libp2p.peerId
    lander = await launchLander({ orbiterAddressOrId })
    await connectPeers(orbiter.ipfs, lander.orbitdb.ipfs)
    db = await lander.orbitdb.open('db')
  })

  afterEach(async function () {
    await orbiter.stop()
    await lander.orbitdb.stop()
    await lander.orbitdb.ipfs.stop()
    await rimraf('./lander')
    await rimraf('./voyager')
  })

  it('pins a database with OK response', async function () {
    await orbiter.auth.add(lander.orbitdb.identity.publicKey)

    const sink = async source => {
      for await (const chunk of source) {
        const response = parseMessage(chunk.subarray())
        deepStrictEqual(response, { type: Responses.OK })
      }
    }

    await pipe(pinDBs(), handleRequest(orbiter), sink)
  })

  it('pins a database with E_NOT_AUTHORIZED response', async function () {
    const sink = async source => {
      for await (const chunk of source) {
        const response = parseMessage(chunk.subarray())
        deepStrictEqual(response, { message: 'user is not authorized to pin', type: Responses.E_NOT_AUTHORIZED })
      }
    }

    await pipe(pinDBs(), handleRequest(orbiter), sink)
  })

  it('pins a database with E_INVALID_SIGNATURE response', async function () {
    await orbiter.auth.add(lander.orbitdb.identity.publicKey)

    const identities = await Identities({ path: './lander/identities', ipfs: lander.ipfs })
    const invalidIdentity = await identities.createIdentity({ id: 'lander2' })
    const createInvalidSignature = async addresses => invalidIdentity.sign(invalidIdentity, addresses)

    const sink = async source => {
      for await (const chunk of source) {
        const response = parseMessage(chunk.subarray())
        deepStrictEqual(response, { message: 'invalid signature', type: Responses.E_INVALID_SIGNATURE })
      }
    }

    await pipe(pinDBs({ signer: { sign: createInvalidSignature } }), handleRequest(orbiter), sink)
  })

  it('tries to pin a database with non-existent message', async function () {
    await orbiter.auth.add(lander.orbitdb.identity.publicKey)

    const sink = async source => {
      for await (const chunk of source) {
        const response = parseMessage(chunk.subarray())
        deepStrictEqual(response, { message: 'unknown message type UNKNOWN', type: 300 })
      }
    }

    await pipe(pinDBs({ type: 'UNKNOWN' }), handleRequest(orbiter), sink)
  })
})
