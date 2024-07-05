import { toString as uint8ArrayToString } from 'uint8arrays/to-string'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'

export const Requests = Object.freeze({
  PIN: 1,
  UNPIN: 2
})

export const Responses = Object.freeze({
  OK: 0,
  E_INVALID_SIGNATURE: 101,
  E_NOT_AUTHORIZED: 200,
  E_INTERNAL_ERROR: 300
})

export const serialize = (message) => {
  return uint8ArrayFromString(JSON.stringify(message))
}

export const deserialize = (message) => {
  return JSON.parse(uint8ArrayToString(message))
}

export const parseMessage = (bytes) => {
  return deserialize(bytes)
}

export const createRequestMessage = async (type, addresses, identity, signer) => {
  const pubkey = identity.publicKey
  const signature = signer
    ? await signer.sign(JSON.stringify(addresses))
    : await identity.sign(identity, JSON.stringify(addresses))
  return serialize({ type, pubkey, signature, addresses })
}

export const createResponseMessage = async (type, message) => {
  const response = { type, message }
  return serialize(response)
}
