import { logger } from '@libp2p/logger'

const log = logger('voyager:orbiter:pin')

const waitForReplication = (db) => {
  return new Promise((resolve, reject) => {
    db.events.once('join', () => resolve())
    db.events.once('error', (err) => reject(err))
  })
}

export default async ({ orbitdb, pins, dbs, id, addresses }) => {
  for (const address of addresses) {
    log('pin   ', address)

    let identities = await pins.get(address)
    const hasDb = identities !== undefined

    if (identities) {
      identities.push(id)
    } else {
      identities = [id]
    }

    const db = await orbitdb.open(address)
    dbs[address] = db

    if (!hasDb) {
      await waitForReplication(db)
    }

    await pins.set(address, identities)

    log('pinned', address)
  }
}
