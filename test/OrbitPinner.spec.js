const assert = require('assert')
const OrbitDB = require('orbit-db')
const OrbitPinner = require('../lib/OrbitPinner')
const config = require('../config/default')

describe('OrbitPinner', function () {
  let pinner, ipfs, db1, db2

  this.timeout(10000)

  before(() => {
    // pinner = new OrbitPinner()
  })

  it('static #openDatabase', async () => {
    ipfs = await require('../lib/ipfsInstance')
    const orbitdb = await OrbitDB.createInstance(ipfs, config.ipfsConfig)
    db1 = await orbitdb.log('test')
    db2 = await OrbitPinner.openDatabase(orbitdb, db1.id)

    assert.strictEqual(db1.id, db2.id)

    // TODO: Fix broken
    // console.log(pinner.orbitdb)
  })

  after(async () => {
    await db1.close()
    await db2.close()
    // await ipfs.stop()
    // TODO: Fix broken
    // await pinner.drop()
  })
})
