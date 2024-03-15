export default async (registry, pinnedDBs, params) => {
  const { id, addresses } = params

  for (const address of addresses) {
    try {
      const ids = await registry.pins.get(id)
      if (ids) {
        const index = ids.indexOf(address)
        if (index > -1) {
          ids.splice(index, 1)
        }

        await registry.pins.set(address, ids)
      } else {
        await registry.pins.del(address)
      }

      if (!await registry.pins.get()) {
        await pinnedDBs[address].close()
        delete pinnedDBs[address]
        console.log(address, 'unpinned')
      }
    } catch (err) {
      console.error(err)
      console.log(`Received db address ${address} but couldn't open it`)
    }
  }
  return { unpin: 'success' }
}
