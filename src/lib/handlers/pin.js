import { pipe } from 'it-pipe'
import { toString as uint8ArrayToString } from 'uint8arrays/to-string'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'

export default (registry, pinnedDBs) => {
  const protocol = '/orbitdb/pinner/pin/v1.0.0'

  const handleDBPin = async ({ stream }) => {
    await pipe(stream, pin, stream)
  }

  const addPin = async address => {
    await registry.pins.add(address)
  }

  const addPinIndex = async (address, id) => {
    let indexedIds = await registry.pinIndex.get(address)
    if (indexedIds) {
      indexedIds.push(id)
    } else {
      indexedIds = [id]
    }
    await registry.pinIndex.set(address, indexedIds)
  }

  const addId = async (id, address) => {
    let indexedPins = await registry.ids.get(id)
    if (indexedPins) {
      indexedPins.push(address)
    } else {
      indexedPins = [address]
    }
    await registry.ids.set(id, indexedPins)
  }

  const pin = source => {
    return (async function * () {
      for await (const chunk of source) {
        const { id, addresses } = JSON.parse(uint8ArrayToString(chunk.subarray()))

        for (const address of addresses) {
          try {
            await addPin(address)
            await addPinIndex(address, id)
            await addId(id, address)
            pinnedDBs[address] = await registry.orbitdb.open(address)
            console.log(address, 'pinned')
          } catch (err) {
            console.error(err)
            console.log(`Received db address ${address} but couldn't open it`)
          }
        }

        yield uint8ArrayFromString(JSON.stringify({ pinned: addresses }))
      }
    })()
  }

  const register = async () => {
    await registry.orbitdb.ipfs.libp2p.handle(protocol, handleDBPin)
  }

  const deregister = async () => {
    await registry.orbitdb.ipfs.libp2p.unhandle(protocol)
  }

  return {
    register,
    deregister
  }
}
