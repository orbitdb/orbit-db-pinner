export default async (pinner, params) => {
  const { id, addresses } = params

  for (const address of addresses) {
    let ids = await pinner.pins.get(address)

    if (ids) {
      ids.push(id)
    } else {
      ids = [id]
    }

    pinner.dbs[address] = await pinner.orbitdb.open(address)
    await pinner.pins.set(address, ids)
  }
}
