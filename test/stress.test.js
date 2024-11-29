import { strictEqual, deepStrictEqual } from 'assert'
import { rimraf } from 'rimraf'
import { Voyager } from './utils/launch-voyager-remote.js'
import { launchVoyagerHost } from './utils/launch-voyager-host.js'
import waitFor from './utils/wait-for.js'

describe('Stress test', function () {
  this.timeout(10000000)

  let host
  let voyager1
  let voyager2

  before(async function () {
    host = await launchVoyagerHost({ directory: 'host' })
  })

  after(async function () {
    if (host) {
      await host.shutdown()
    }
    await rimraf('./host')
  })

  it('add and replicate a database - app1->voyager1->app2', async function () {
    const rounds = 50
    const entryAmount = 100
    const addr = host.orbitdb.ipfs.libp2p.getMultiaddrs().shift()

    for (let k = 1; k <= rounds; k++) {
      let replicated = false

      voyager1 = await Voyager({ address: addr, directory: 'voyager4' })
      await host.auth.add(voyager1.orbitdb.identity.id)

      const db1 = await voyager1.orbitdb.open('my-db3')

      for (let i = 0; i < entryAmount; i++) {
        await db1.add('hello world ' + i)
      }

      const expected = await db1.all()

      await voyager1.add(db1.address)

      await voyager1.shutdown()

      voyager2 = await Voyager({ address: addr, directory: 'voyager5' })
      await host.auth.add(voyager2.orbitdb.identity.id)

      console.time('Round ' + k + '/' + rounds)
      const db2 = await voyager2.orbitdb.open(db1.address)

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

      if (voyager1) {
        await voyager1.shutdown()
      }
      if (voyager2) {
        await voyager2.shutdown()
      }
      await rimraf('./voyager4')
      await rimraf('./voyager5')
    }
  })
})
