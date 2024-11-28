import { pipe } from 'it-pipe'
import all from 'it-all'
import { multiaddr } from '@multiformats/multiaddr'
import { voyagerRPCProtocol } from './protocol.js'
import { RequestMessage, parseMessage } from '../lib/messages/index.js'

export const sendCommand = async (identity, libp2p, address, type, args = {}) => {
  const request = () => [RequestMessage(type, args, identity)]

  const parseResponse = async (source) => {
    const response = await all(source)
    const getSubarray = (e) => e.subarray()
    const result = response.map(getSubarray).map(parseMessage).pop()
    return result
  }

  const stream = await libp2p.dialProtocol(multiaddr(address), voyagerRPCProtocol)
  const response = await pipe(request, stream, parseResponse)
  return response
}
