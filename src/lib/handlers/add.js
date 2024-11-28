import { logger } from '@libp2p/logger'

const log = logger('voyager:orbiter:add')

const waitForReplication = (db) => {
  return new Promise((resolve, reject) => {
    db.events.once('join', () => resolve())
    db.events.once('error', (err) => reject(err))
  })
}

export default async ({ orbitdb, databases, id, addresses }) => {
  for (const address of addresses) {
    log('add database', address)

    let identities = await databases.get(address)
    const hasDb = identities !== undefined

    if (identities) {
      identities.push(id)
    } else {
      identities = [id]
    }

    const db = await orbitdb.open(address)

    if (!hasDb) {
      await waitForReplication(db)
    }

    await databases.set(address, identities)

    log('database added', address)
  }
}
