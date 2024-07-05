import { pipe } from 'it-pipe'
import { multiaddr } from '@multiformats/multiaddr'
import { voyagerRPCProtocol } from './protocol.js'
import { createRequestMessage, parseMessage } from '../lib/messages/index.js'

export const sendCommand = async (identity, libp2p, address, type, args = {}) => {
  let res

  const stream = await libp2p.dialProtocol(multiaddr(address), voyagerRPCProtocol)

  const request = source => {
    return (async function * () {
      const message = await createRequestMessage(type, args, identity)
      yield message
    })()
  }

  await pipe(request, stream, async (source) => {
    for await (const chunk of source) {
      res = parseMessage(chunk.subarray())
    }
  })

  return res
}
