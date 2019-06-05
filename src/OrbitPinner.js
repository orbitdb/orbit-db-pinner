'use strict'
const OrbitDB = require('orbit-db')

const ipfs = require('./ipfsInstance')

class Pinner {
  constructor(address) {

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
      const db = await orbitdb.open(address, { sync: true })

      console.log(`Listening for updates to the database...`)

      return db
    } catch (e) {
      console.error(e)
    }

  }
}

module.exports = Pinner
