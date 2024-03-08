export default async (registry, pinnedDBs, params) => {
  const removePin = async address => {
    await registry.pins.del(address)
  }

  const removePinIndex = async (address, id) => {
    const indexedIds = await registry.pinIndex.get(id)
    if (indexedIds) {
      const index = indexedIds.indexOf(address)
      if (index > -1) {
        indexedIds.splice(index, 1)
      }

      await registry.ids.set(id, indexedIds)
    } else {
      await registry.ids.del(id)
    }
  }

  const removeId = async (id, address) => {
    const indexedPins = await registry.ids.get(id)
    if (indexedPins) {
      const index = indexedPins.indexOf(address)
      if (index > -1) {
        indexedPins.splice(index, 1)
      }

      await registry.ids.set(id, indexedPins)
    } else {
      await registry.ids.del(id)
    }
  }
  
  const { id, addresses } = params

  for (const address of addresses) {
    try {
      await removePin(address)
      await removePinIndex(address, id)

      if (!await registry.pinIndex.get(id) && !await registry.ids.get(id)) {
        await removeId(id, address)
        await pinnedDBs[address].close()
        delete pinnedDBs[address];
        console.log(address, 'unpinned')
      }
    } catch (err) {
      console.error(err)
      console.log(`Received db address ${address} but couldn't open it`)
    }
  }
  return { unpin: 'success' }  
}
