'use strict'
const OrbitDB = require('orbit-db')

let orbitdb

class Pinner {
  constructor (db) {
    this.db = db
    this.address = db.id
  }

  static async create (address) {
    const ipfs = await require('./ipfsInstance')
    if (!orbitdb) orbitdb = await OrbitDB.createInstance(ipfs)
    const db = await Pinner.openDatabase(orbitdb, address)
    return Promise.resolve(new Pinner(db))
  }

  drop () {
    // console.log(this.orbitdb)
    // this.orbitdb.disconnect()
  }

  get estimatedSize () {
    let size = 0

    if (this.db) {
      // This is very crude
      size = JSON.stringify(this.db._oplog.values).length
    }

    return size
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
