export default async (pinner, params) => {
  const { id, addresses } = params

  for (const address of addresses) {
    const ids = await pinner.pins.get(address)

    if (ids) {
      const index = ids.indexOf(id)

      if (index > -1) {
        ids.splice(index, 1)
      }

      await pinner.pins.set(address, ids)
    } else {
      await pinner.pins.del(address)
    }

    if (!await pinner.pins.get(address)) {
      await pinner.dbs[address].close()
      delete pinner.dbs[address]
      console.log(address, 'unpinned')
    }
  }
}
