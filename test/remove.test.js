import { strictEqual } from 'assert'
import { rimraf } from 'rimraf'
import { Voyager } from './utils/launch-voyager-remote.js'
import { launchVoyagerHost } from './utils/launch-voyager-host.js'
import { createAndAddDatabases } from './utils/create-and-add-databases.js'

describe('Remove', function () {
  this.timeout(10000)

  let host

  beforeEach(async function () {
    host = await launchVoyagerHost()
  })

  afterEach(async function () {
    await host.shutdown()
    await rimraf('./host')
  })

  describe('Single Transient Peer', function () {
    let app

    beforeEach(async function () {
      app = await Voyager({ address: host.orbitdb.ipfs.libp2p.getMultiaddrs().pop() })
      await host.auth.add(app.orbitdb.identity.id)
    })

    afterEach(async function () {
      await app.shutdown()
      await rimraf('./app')
    })

    it('removes a database', async function () {
      const { addresses } = await createAndAddDatabases(1, app)

      const removed = await app.remove(addresses)

      strictEqual(removed, true)
      strictEqual((await host.databases.all()).length, 0)
    })

    it('removes multiple databases', async function () {
      const { addresses } = await createAndAddDatabases(2, app)

      const removed = await app.remove(addresses)

      strictEqual(removed, true)
      strictEqual((await host.databases.all()).length, 0)
    })

    it('removes a database when multiple databases have been added', async function () {
      const { addresses } = await createAndAddDatabases(2, app)

      const removed = await app.remove(addresses.slice(0, 1))

      strictEqual(removed, true)
      strictEqual((await host.databases.all()).length, 1)
      strictEqual((await host.databases.all()).pop().key, addresses[1])
    })
  })
})
