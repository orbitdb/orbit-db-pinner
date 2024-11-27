import { strictEqual, deepStrictEqual } from 'assert'
import { rimraf } from 'rimraf'
import { launchLander } from './utils/launch-lander.js'
import { launchOrbiter } from './utils/launch-orbiter.js'
import waitFor from './utils/wait-for.js'

describe('Stress test', function () {
  this.timeout(10000000)

  let orbiter
  let lander1
  let lander2

  before(async function () {
    orbiter = await launchOrbiter({ directory: 'orbiter3' })
  })

  after(async function () {
    if (orbiter) {
      await orbiter.shutdown()
    }
    await rimraf('./orbiter3')
  })

  it('add and replicate a database - lander1->orbiter1->lander2', async function () {
    const rounds = 50
    const entryAmount = 100
    const addr = orbiter.orbitdb.ipfs.libp2p.getMultiaddrs().shift()

    for (let k = 1; k <= rounds; k++) {
      let replicated = false

      lander1 = await launchLander({ orbiterAddress: addr, directory: 'lander4' })
      await orbiter.auth.add(lander1.orbitdb.identity.id)

      const db1 = await lander1.orbitdb.open('my-db3')

      for (let i = 0; i < entryAmount; i++) {
        await db1.add('hello world ' + i)
      }

      const expected = await db1.all()

      await lander1.add(db1.address)

      await lander1.shutdown()

      lander2 = await launchLander({ orbiterAddress: addr, directory: 'lander5' })
      await orbiter.auth.add(lander2.orbitdb.identity.id)

      console.time('Round ' + k + '/' + rounds)
      const db2 = await lander2.orbitdb.open(db1.address)

      const onConnected = (peerId, heads) => {
        replicated = true
      }

      db2.events.on('join', onConnected)

      await waitFor(() => replicated, () => true, 0)
      console.timeEnd('Round ' + k + '/' + rounds)

      const res = await db2.all()

      strictEqual(expected.length, entryAmount)
      strictEqual(res.length, entryAmount)
      deepStrictEqual(expected, res)

      if (lander1) {
        await lander1.shutdown()
      }
      if (lander2) {
        await lander2.shutdown()
      }
      await rimraf('./lander4')
      await rimraf('./lander5')
    }
  })
})
