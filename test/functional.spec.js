const { spawn } = require('child_process')
const assert = require('assert')
const Ctl = require('ipfsd-ctl')
const fetch = require('node-fetch')
const OrbitDB = require('orbit-db')
const rm = require('rimraf')

/*
 * node pinner -address ORBITDB_ADDRESS      \\ start the server and start replicating ORBITDB_ADDRESS
 * node pinner -http -port 1111             \\ receive http connections. Port defaults to 3000
 */

describe('Setting up functional tests...', function () {
  let factory, ipfs, ipfs2, orbitdb, orbitdb2, process

  this.timeout(60000)

  before(async () => {
    rm('./orbitdb', () => {})
    rm('./test/orbitdb1', () => {})
    rm('./test/orbitdb2', () => {})

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

    process = spawn('node', ['./pinner.js'])
    return new Promise((resolve, reject) => {
      process.stdout.on('data', data => {
        console.log(data.toString())

        if (data.toString().includes('Orbit-pinner listening on port 3000')) {
          resolve()
        }
      })

      // Fail on error
      process.stderr.on('data', data => {
        console.log(data.toString())
        assert(false)
      })
      process.on('error', (error) => console.log(`error: ${error.message}`))
    })
  })

  it('Connects to the pinning service', (done) => {
    process.stdout.on('data', async data => {
      const dataString = data.toString()
      if (dataString.includes('127.0.0.1/tcp/4002')) {
        // TODO: Better output & way of getting the pinner address
        const address = dataString.split(' ')[3].trim().split('\n')[0]
        await ipfs.swarm.connect(address)
        await ipfs2.swarm.connect(address)
        assert.strictEqual((await ipfs.swarm.peers()).length, 1)
        assert.strictEqual((await ipfs2.swarm.peers()).length, 1)
        done()
      }
    })
  })

  async function createAndPinDb (orbitdb, name) {
    const db = await orbitdb.log(name, { sync: true })
    const res = await fetch(`http://localhost:3000/pin?address=${db.id}`)
    assert.strictEqual(res.status, 200)
    assert.strictEqual(await res.text(), `adding... ${db.id}`)

    return db
  }

  describe('Basic Functionality', function () {
    it('Pins a database via /pin', (done) => {
      createAndPinDb(orbitdb, 'pinTest').then(async db => {
        await db.add('x')
        await db.add('y')
        await db.add('z')

        process.stdout.on('data', async data => {
          if (data.toString().includes(`opening database from ${db.id}`)) {
            setTimeout(async () => {
              console.log('...proceeding')
              await db.drop()

              const db2 = await orbitdb2.open(db.id, { sync: true })
              assert.strictEqual(db.id, db2.id)

              const res = await fetch(`http://localhost:3000/unpin?address=${db2.id}`)
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

  function pause (milliseconds) {
    console.log(`Pausing for ${milliseconds}ms...`)
    return new Promise((resolve, reject) => {
      setTimeout(resolve, milliseconds)
    })
  }

  describe('Statistics Endpoint', function () {
    it('Reports stats after multiple operations', async () => {
      const db1 = await createAndPinDb(orbitdb, 'statsTest0')
      await pause(1000)
      // TODO: This is troubling...
      // const db2 = await createAndPinDb(orbitdb, 'statsTest1')
      await pause(1000)
      const db3 = await createAndPinDb(orbitdb, 'statsTest2')
      await pause(1000)

      // TODO: Add one more and then unpin one of the above

      await db1.add('x')
      await db1.add('y')
      await db1.add('z')
      await db3.add('zzzzzzzz')

      await pause(4000)

      const res = await fetch('http://localhost:3000/stats')
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
    process.kill('SIGINT')
    process.on('close', async (code) => {
      await orbitdb.stop()
      await orbitdb2.stop()
      await factory.clean()
    })
  })
})
