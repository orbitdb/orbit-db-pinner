import { strictEqual } from 'assert'
import { rimraf } from 'rimraf'
import { launchLander } from './utils/launch-lander.js'
import { launchOrbiter } from './utils/launch-orbiter.js'
import { createPins } from './utils/create-pins.js'

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

  it('loads a pinned database', async function () {
    const { addresses } = await createPins(1, lander)

    await orbiter.shutdown()

    orbiter = await launchOrbiter()

    strictEqual(Object.values(orbiter.dbs).pop().address, addresses.pop())
  })
})
