export const createAndAddDatabases = async (howMany, lander) => {
  const addresses = []

  for (let i = 1; i <= howMany; i++) {
    const db = await lander.orbitdb.open(`db${i}`)
    addresses.push(db.address)
  }

  const added = await lander.add(addresses)

  return { added, addresses }
}