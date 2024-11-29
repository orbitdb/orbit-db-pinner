export const createAndAddDatabases = async (howMany, voyager) => {
  const addresses = []

  for (let i = 1; i <= howMany; i++) {
    const db = await voyager.orbitdb.open(`db${i}`)
    addresses.push(db.address)
  }

  const added = await voyager.add(addresses)

  return { added, addresses }
}
