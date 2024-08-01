import { logger } from '@libp2p/logger'

const log = logger('voyager:orbiter:unpin')

export default async ({ orbitdb, pins, dbs, id, addresses }) => {
  for (const address of addresses) {
    log('unpin   ', address)

    const identities = await pins.get(address)

    if (identities && identities.length > 1) {
      const index = identities.indexOf(id)

      if (index > -1) {
        identities.splice(index, 1)
      }

      await pins.set(address, identities)
    } else {
      await pins.del(address)
    }

    if (!await pins.get(address)) {
      await dbs[address].close()
      delete dbs[address]
    }

    log('unpinned', address)
  }
}
