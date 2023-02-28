import { spawn, ChildProcessWithoutNullStreams } from 'child_process'
import assert from 'assert'
import Ctl from 'ipfsd-ctl'
import fetch from 'node-fetch'
import OrbitDB from 'orbit-db'
import rm from 'rimraf'

const BASE_URL = `http://localhost:${process.env.PORT || 8000}`

describe('Setting up functional tests...', function () {
  let factory: Ctl.Factory<Ctl.ControllerType>, 
    ipfs: Ctl.IPFSAPI, 
    ipfs2: Ctl.IPFSAPI, 
    orbitdb: OrbitDB, 
    orbitdb2: OrbitDB, 
    testProcess: ChildProcessWithoutNullStreams

  this.timeout(60000)

  before(async () => {
    await rm('./orbitdb')
    await rm('./test/orbitdb1')
    await rm('./test/orbitdb2')

    factory = Ctl.createFactory({
      type: 'proc',
      test: true,
      disposable: true,
      ipfsHttpModule: require('ipfs-http-client'),
      ipfsModule: require('ipfs')
    })
    ipfs = (await factory.spawn()).api
    ipfs2 = (await factory.spawn()).api
    orbitdb = await OrbitDB.createInstance(ipfs, { directory: './test/orbitdb1' })
    orbitdb2 = await OrbitDB.createInstance(ipfs2, { directory: './test/orbitdb2' })

    testProcess = spawn('npm', ['start'], {
      env: process.env
    })
    return new Promise((resolve, reject) => {
      testProcess.stdout.on('data', data => {
        if (data.toString().includes('Orbit-pinner listening on port')) {
          resolve()
        }
      })

      // Fail on error
      testProcess.stderr.on('data', data => {
        console.log(data.toString())
        assert(false)
      })
      testProcess.on('error', (error) => console.log(`error: ${error.message}`))
    })
  })

  it('Connects to the pinning service', async (done) => {
        const address = process.env.SWARM?.split(",") || []

        for (const addr of address) {
          await ipfs.swarm.connect(addr)
          await ipfs2.swarm.connect(addr)
        }

        assert.strictEqual((await ipfs.swarm.peers()).length, 1)
        assert.strictEqual((await ipfs2.swarm.peers()).length, 1)
        done()
  })

  async function createAndPinDb (name: string) {
    const db = await orbitdb.log(name)
    const res = await fetch(`${BASE_URL}/pin?address=${db.id}`)
    assert.strictEqual(res.status, 200)
    assert.strictEqual(await res.text(), `adding... ${db.id}`)

    return db
  }

  describe('Basic Functionality', function () {
    it('Pins a database via /pin', (done) => {
      createAndPinDb('pinTest').then(async db => {
        await db.add('x')
        await db.add('y')
        await db.add('z')

        process.stdout.on('data', async data => {
          if (data.toString().includes(`opening database from ${db.id}`)) {
            setTimeout(async () => {
              console.log('...proceeding')
              await db.drop()

              const db2 = await orbitdb2.open(db.id)
              assert.strictEqual(db.id, db2.id)

              const res = await fetch(`${BASE_URL}/unpin?address=${db2.id}`)
              assert.strictEqual(res.status, 200)
              assert.strictEqual(await res.text(), `removing... ${db.id}`)

              const target = 3
              let i = 0
              db2.events.on('replicated', (address, total) => {
                i += total
                if (i === target) done()
              })
            }, 4000)
          }
        })
      })
    })
  })

  function pause (milliseconds: number) {
    console.log(`Pausing for ${milliseconds}ms...`)
    return new Promise((resolve, _reject) => 
      setTimeout(resolve, milliseconds))
  }

  describe('Statistics Endpoint', function () {
    it('Reports stats after multiple operations', async () => {
      const db1 = await createAndPinDb('statsTest0')
      await pause(1000)
      // TODO: This is troubling...
      // const db2 = await createAndPinDb(orbitdb, 'statsTest1')
      await pause(1000)
      const db3 = await createAndPinDb('statsTest2')
      await pause(1000)

      // TODO: Add one more and then unpin one of the above

      await db1.add('x')
      await db1.add('y')
      await db1.add('z')
      await db3.add('zzzzzzzz')

      await pause(4000)

      const res = await fetch(`${BASE_URL }/stats`)
      assert.strictEqual(res.status, 200)

      // const expected = {
      //   pinners: [
      //     { size: 3838 },
      //     { size: 2 },
      //     { size: 1234 }
      //   ],
      //   total_size: 5074,
      //   num_databases: 3
      // }

      const result = await res.json()
      console.log(result)
      assert.deepStrictEqual(result.num_databases, 3)
      assert.deepStrictEqual(result.total_size > 5000, true)

      // Still very crude in testing
      assert.strictEqual(result.pinners[0].size > 3800, true)
      assert.strictEqual(result.pinners[1].size, 2)
      assert.strictEqual(result.pinners[2].size > 1200, true)
    })
  })

  after(async () => {
    testProcess.kill('SIGINT')
    testProcess.on('close', async (code) => {
      await orbitdb.stop()
      await orbitdb2.stop()
      await factory.clean()
    })
  })
})