'use strict'
const OrbitDB = require('orbit-db')

const ipfs = require('./ipfsInstance')

class Pinner {
  constructor({address, replicate}) {

    ipfs.on('error', (err) => {
      console.error(err)
    })

    ipfs.on('ready', async () => {
      this.orbitdb = await OrbitDB.createInstance(ipfs)
      Pinner.openDatabase(this.orbitdb, address)
    })
  }

  static async openDatabase(orbitdb, address) {
    try {
      console.log(`opening database from ${address}`)
      db = await orbitdb.open(address, { sync: true })
      await load(db, `Loading database at ${address}`)
      console.log(`Listening for updates to the database...`)
    } catch (e) {
      console.error(e)
    }
  }
}

module.exports = Pinner
