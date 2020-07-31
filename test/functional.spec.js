const { spawn } = require('child_process')
const assert = require('assert')
const Ctl = require('ipfsd-ctl')
const fetch = require('node-fetch')
const OrbitDB = require('orbit-db')

/*
 * node pinner -address ORBITDB_ADDRESS      \\ start the server and start replicating ORBITDB_ADDRESS
 * node pinner -http -port 1111             \\ receive http connections. Port defaults to 3000
 */

describe('Basic Functionality', function () {
  let address, process, factory, ipfs, ipfs2, orbitdb, orbitdb2
  this.timeout(60000)

  before(async () => {
    factory = Ctl.createFactory({
      type: 'proc',
      test: true,
      disposable: true,
      ipfsHttpModule: require('ipfs-http-client'),
      ipfsModule: require('ipfs')
    })
    ipfs = (await factory.spawn()).api
    ipfs2 = (await factory.spawn()).api
    orbitdb = await OrbitDB.createInstance(ipfs)
    orbitdb2 = await OrbitDB.createInstance(ipfs2)

    process = spawn('node', ['./pinner.js'])
    return new Promise((resolve, reject) => {
      process.stdout.on('data', data => {
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
        address = dataString.split(' ')[3].trim()
        await ipfs.swarm.connect(address)
        await ipfs2.swarm.connect(address)
        assert.strictEqual((await ipfs.swarm.peers()).length, 1)
        assert.strictEqual((await ipfs2.swarm.peers()).length, 1)
        done()
      }
    })
  })

  it('Pins a database via /pin', (done) => {
    orbitdb.log('pinTest', { sync: true }).then(async db => {
      const res = await fetch(`http://localhost:3000/pin?address=${db.id}`)
      assert.strictEqual(res.status, 200)
      assert.strictEqual(await res.text(), `adding... ${db.id}`)

      await db.add('x')
      await db.add('y')
      await db.add('z')

      process.stdout.on('data', async data => {
        if (data.toString().includes(`opening database from ${db.id}`)) {
          console.log('Giving the db a few seconds to replicate...')

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

  after(async () => {
    process.kill('SIGINT')
    process.on('close', async (code) => {
      await orbitdb.stop()
      await orbitdb2.stop()
      await factory.clean()
    })
  })
})
