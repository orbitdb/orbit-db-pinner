import { pipe } from 'it-pipe'

export default async (registry, pinnedDBs, params) => {
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
  
  const { id, addresses } = params
  
  for (const address of addresses) {
    try {
      await addPin(address)
      await addPinIndex(address, id)
      await addId(id, address)
      pinnedDBs[address] = await registry.orbitdb.open(address)
    } catch (err) {
      console.error(err)
      console.log(`Received db address ${address} but couldn't open it`)
    }
  }

  return { pin: 'success' }
}
