export default async ({ orbitdb, pins, dbs, pubkey, addresses }) => {
  for (const address of addresses) {
    let pubkeys = await pins.get(address)

    if (pubkeys) {
      pubkeys.push(pubkey)
    } else {
      pubkeys = [pubkey]
    }

    dbs[address] = await orbitdb.open(address)
    await pins.set(address, pubkeys)
  }
}