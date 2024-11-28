import { strictEqual } from 'assert'
import { rimraf } from 'rimraf'
import { launchLander } from './utils/launch-lander.js'
import { launchOrbiter } from './utils/launch-orbiter.js'
import { createAndAddDatabases } from './utils/create-and-add-databases.js'

describe('Orbiter', function () {
  this.timeout(10000)

  let orbiter, lander

  beforeEach(async function () {
    await rimraf('./lander')
    await rimraf('./orbiter')
    orbiter = await launchOrbiter()
    lander = await launchLander({ orbiterAddress: orbiter.orbitdb.ipfs.libp2p.getMultiaddrs().pop() })
    await orbiter.auth.add(lander.orbitdb.identity.id)
  })

  afterEach(async function () {
    await lander.shutdown()
    await rimraf('./lander')

    await orbiter.shutdown()
    await rimraf('./orbiter')
  })

  it('loads an added database', async function () {
    const { addresses } = await createAndAddDatabases(1, lander)

    await orbiter.shutdown()

    orbiter = await launchOrbiter()

    strictEqual((await orbiter.databases.all()).pop().key, addresses.pop())
  })
})
