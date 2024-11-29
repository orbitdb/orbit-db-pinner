import { strictEqual } from 'assert'
import { rimraf } from 'rimraf'
import { Voyager } from './utils/launch-voyager-remote.js'
import { launchVoyagerHost } from './utils/launch-voyager-host.js'
import { createAndAddDatabases } from './utils/create-and-add-databases.js'

describe('Voyager Host', function () {
  this.timeout(10000)

  let host
  let voyager

  beforeEach(async function () {
    await rimraf('./voyager')
    await rimraf('./host')
    host = await launchVoyagerHost()
    voyager = await Voyager({ address: host.orbitdb.ipfs.libp2p.getMultiaddrs().pop() })
    await host.auth.add(voyager.orbitdb.identity.id)
  })

  afterEach(async function () {
    await voyager.shutdown()
    await rimraf('./voyager')

    await host.shutdown()
    await rimraf('./host')
  })

  it('loads an added database', async function () {
    const { addresses } = await createAndAddDatabases(1, voyager)

    await host.shutdown()

    host = await launchVoyagerHost()

    strictEqual((await host.databases.all()).pop().key, addresses.pop())
  })
})
