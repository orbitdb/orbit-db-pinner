export default async (pinner, params) => {
  const { id, addresses } = params

  for (const address of addresses) {
    try {
      let ids = await pinner.pins.get(address)
      if (ids) {
        ids.push(id)
      } else {
        ids = [id]
      }
      await pinner.pins.set(address, ids)
      pinner.dbs[address] = await pinner.orbitdb.open(address)
    } catch (err) {
      console.error(err)
      console.log(`Received db address ${address} but couldn't open it`)
    }
  }

  return { pin: 'success' }
}
