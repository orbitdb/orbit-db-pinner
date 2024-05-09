export const createPins = async (howMany, lander) => {
  const dbs = []

  for (let i = 1; i <= howMany; i++) {
    dbs.push(await lander.orbitdb.open(`db${i}`))
  }

  const pinned = await lander.pin(dbs)

  return { pinned, dbs }
}
