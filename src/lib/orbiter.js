import { pipe } from 'it-pipe'
import { logger, enable } from '@libp2p/logger'
import { KeyValueIndexed } from '@orbitdb/core'
import { voyagerProtocol } from './protocol.js'
import { handleRequest } from './handle-request.js'
import Authorization, { Access } from './authorization.js'

export default async ({ orbitdb, defaultAccess, verbose } = {}) => {
  const log = logger('voyager:orbiter')

  if (verbose > 0) {
    enable('voyager:orbiter' + (verbose > 1 ? '*' : ':error'))
  }

  log('start orbiter')

  defaultAccess = defaultAccess || Access.DENY

  log('default access:', defaultAccess === Access.ALLOW ? 'allow all' : 'deny all')

  const databases = await orbitdb.open('databases', { Database: KeyValueIndexed() })

  const auth = await Authorization({ orbitdb, defaultAccess })

  const handleMessages = async ({ stream }) => {
    await pipe(stream, handleRequest({ log, orbitdb, databases, auth }), stream)
  }

  await orbitdb.ipfs.libp2p.handle(voyagerProtocol, handleMessages, { runOnLimitedConnection: true })

  log('open replicated databases')

  let count = 0
  for await (const db of databases.iterator()) {
    log('open', db.key)
    await orbitdb.open(db.key)
    count++
  }

  log(count, 'databases opened')

  const stop = async () => {
    await orbitdb.ipfs.libp2p.unhandle(voyagerProtocol)
  }

  return {
    databases,
    orbitdb,
    auth,
    stop,
    log
  }
}
