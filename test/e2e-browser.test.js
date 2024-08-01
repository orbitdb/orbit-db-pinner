import { multiaddr } from '@multiformats/multiaddr'
import { strictEqual, deepStrictEqual } from 'assert'
import { rimraf } from 'rimraf'
import { launchLander } from './utils/launch-lander.js'
import waitFor from './utils/wait-for.js'

describe('End-to-End Browser Test', function () {
  this.timeout(10000)

  const orbiterAddress1 = multiaddr('/ip4/127.0.0.1/tcp/54321/ws/p2p/16Uiu2HAmBzKcgCfpJ4j4wJSLkKLbCVvnNBWPnhexrnJWJf1fDu5y')
  const orbiterAddress2 = multiaddr('/ip4/127.0.0.1/tcp/54322/ws/p2p/16Uiu2HAmATMovCwY46yyJib7bGZF2f2XLRar7d7R3NJCSJtuyQLt')

  let lander1
  let lander2
  let lander3

  beforeEach(async function () {
    lander1 = await launchLander({ orbiterAddress: orbiterAddress1, directory: 'lander1' })
    lander2 = await launchLander({ orbiterAddress: orbiterAddress1, directory: 'lander2' })
    lander3 = await launchLander({ orbiterAddress: orbiterAddress2, directory: 'lander3' })
  })

  afterEach(async function () {
    if (lander1) {
      await lander1.shutdown()
    }
    if (lander2) {
      await lander2.shutdown()
    }
    if (lander3) {
      await lander3.shutdown()
    }
    await rimraf('./lander1')
    await rimraf('./lander2')
    await rimraf('./lander3')
  })

  it('pin and replicate a database - lander1->orbiter1->lander2', async function () {
    const entryAmount = 100
    let replicated = false

    const db1 = await lander1.orbitdb.open('my-db')

    for (let i = 0; i < entryAmount; i++) {
      await db1.add('hello world ' + i)
    }

    const expected = await db1.all()

    console.time('pin')
    await lander1.pin(db1.address)
    console.timeEnd('pin')
    await lander1.shutdown()

    console.time('pin')
    await lander2.pin(db1.address)
    console.timeEnd('pin')

    console.time('replicate')
    const db2 = await lander2.orbitdb.open(db1.address)

    const onConnected = (peerId, heads) => {
      replicated = true
    }

    db2.events.on('join', onConnected)

    await waitFor(() => replicated, () => true)
    console.timeEnd('replicate')

    const res = await db2.all()

    strictEqual(expected.length, entryAmount)
    strictEqual(res.length, entryAmount)
    deepStrictEqual(expected, res)
  })

  it('pin and replicate a database - lander1->orbiter1->orbiter2->lander3', async function () {
    const entryAmount = 100
    let replicated = false

    const db1 = await lander1.orbitdb.open('my-db2')

    for (let i = 0; i < entryAmount; i++) {
      await db1.add('hello world ' + i)
    }

    const expected = await db1.all()

    console.time('pin')
    await lander1.pin(db1.address)
    console.timeEnd('pin')
    await lander1.shutdown()

    console.time('pin')
    await lander3.pin(db1.address)
    console.timeEnd('pin')

    console.time('replicate')
    const db2 = await lander3.orbitdb.open(db1.address)

    const onConnected = (peerId, heads) => {
      replicated = true
    }

    db2.events.on('join', onConnected)

    await waitFor(() => replicated, () => true)
    console.timeEnd('replicate')

    const res = await db2.all()

    strictEqual(expected.length, entryAmount)
    strictEqual(res.length, entryAmount)
    deepStrictEqual(expected, res)
  })
})
