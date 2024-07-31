import { logger } from '@libp2p/logger'

const log = logger('voyager:orbiter:pin')

const waitForReplication = (db) => {
  return new Promise((resolve, reject) => {
    db.events.once('join', () => resolve())
    db.events.once('error', (err) => reject(err))
  })
}

export default async ({ orbitdb, pins, dbs, pubkey, addresses }) => {
  for (const address of addresses) {
    log('pin   ', address)
    let pubkeys = await pins.get(address)

    if (pubkeys) {
      pubkeys.push(pubkey)
    } else {
      pubkeys = [pubkey]
    }

    const db = await orbitdb.open(address)
    dbs[address] = db

    await waitForReplication(db)
    await pins.set(address, pubkeys)

    log('pinned', address)
  }
}
