export default async (registry, pinnedDBs, params) => {
  const { id, addresses } = params

  for (const address of addresses) {
    try {
      let ids = await registry.pins.get(address)
      if (ids) {
        ids.push(id)
      } else {
        ids = [id]
      }
      await registry.pins.set(address, ids)
      pinnedDBs[address] = await registry.orbitdb.open(address)
    } catch (err) {
      console.error(err)
      console.log(`Received db address ${address} but couldn't open it`)
    }
  }

  return { pin: 'success' }
}
