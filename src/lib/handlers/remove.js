import { logger } from '@libp2p/logger'

const log = logger('voyager:orbiter:remove')

export default async ({ orbitdb, databases, id, addresses }) => {
  for (const address of addresses) {
    log('remove database', address)

    const identities = await databases.get(address)

    if (identities && identities.length > 1) {
      const index = identities.indexOf(id)

      if (index > -1) {
        identities.splice(index, 1)
      }

      await databases.set(address, identities)
    } else {
      await databases.del(address)
    }

    if (!await databases.get(address)) {
      const db = await orbitdb.open(address)
      await db.close()
    }

    log('database removed', address)
  }
}
