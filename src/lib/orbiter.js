import { pipe } from 'it-pipe'
import { logger, enable } from '@libp2p/logger'
import { KeyValueIndexed } from '@orbitdb/core'
import { voyagerProtocol } from './protocol.js'
import { handleRequest } from './handle-request.js'
import Authorization, { Access } from './authorization.js'

export default async ({ orbitdb, defaultAccess, verbose } = {}) => {
  const log = logger('orbitdb:voyager:orbiter')

  if (verbose > 0) {
    enable('orbitdb:voyager:orbiter' + (verbose > 1 ? '*' : ':error'))
  }

  log('start orbiter')

  defaultAccess = defaultAccess || Access.DENY

  log('default access:', defaultAccess === Access.ALLOW ? 'allow all' : 'deny all')

  const pins = await orbitdb.open('pins', { Database: KeyValueIndexed() })

  const auth = await Authorization({ orbitdb, defaultAccess })

  const dbs = []

  const handleMessages = async ({ stream }) => {
    await pipe(stream, handleRequest({ log, orbitdb, pins, dbs, auth }), stream)
  }

  await orbitdb.ipfs.libp2p.handle(voyagerProtocol, handleMessages)

  for await (const db of pins.iterator()) {
    dbs[db.value] = await orbitdb.open(db.value)
    log('db opened', db.value)
  }

  log(dbs.length, 'dbs loaded')

  const stop = async () => {
    await orbitdb.ipfs.libp2p.unhandle(voyagerProtocol)
  }

  return {
    pins,
    dbs,
    orbitdb,
    auth,
    stop
  }
}
