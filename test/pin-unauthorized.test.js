import { deepStrictEqual } from 'assert'
import Pinner from '../src/lib/pinner.js'
import { createClient } from './utils/create-client.js'
import { createPins } from './utils/create-pins.js'
import { rimraf } from 'rimraf'
import { Responses, parseMessage } from '../src/lib/messages/index.js'
import connectPeers from './utils/connect-nodes.js'

describe('Pin - Unauthorized', function () {
  this.timeout(10000)

  let pinner
  let client

  beforeEach(async function () {
    pinner = await Pinner()
    client = await createClient()
    await connectPeers(pinner.ipfs, client.ipfs)
  })

  afterEach(async function () {
    await pinner.stop()
    await client.stop()
    await client.ipfs.stop()
    await rimraf('./client')
    await rimraf('./pinner')
  })

  describe('Single Client', function () {
    it('tries to pin a database when not authorized', async function () {
      const sink = async source => {
        for await (const chunk of source) {
          const response = parseMessage(chunk.subarray())
          deepStrictEqual(response, { message: 'user is not authorized to pin', type: Responses.E_NOT_AUTHORIZED })
        }
      }

      await createPins(1, client, pinner, sink)
    })
  })
})
