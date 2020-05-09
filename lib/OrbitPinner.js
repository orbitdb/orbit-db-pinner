'use strict'
const OrbitDB = require('orbit-db')

class Pinner {
  constructor (address) {
    require('./ipfsInstance').then(async (ipfs) => {
      this.orbitdb = await OrbitDB.createInstance(ipfs)
      Pinner.openDatabase(this.orbitdb, address)
    }).catch(console.error)
  }

  drop () {
    // console.log(this.orbitdb)
    // this.orbitdb.disconnect()
  }

  static async openDatabase (orbitdb, address) {
    try {
      if (!OrbitDB.isValidAddress(address)) {
        console.log(`Failed to add ${address}. This is not a valid address`)
        return
      }

      console.log(`opening database from ${address}`)
      const db = await orbitdb.open(address, { sync: true })

      console.log('Listening for updates to the database...')
      await db.load()

      return db
    } catch (e) {
      console.error(e)
    }
  }
}

module.exports = Pinner
