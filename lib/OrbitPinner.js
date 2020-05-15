'use strict'
const OrbitDB = require('orbit-db')
const { AccessControllers } = require('orbit-db')
const AccessVerifier = require('./AccessVerifier')

AccessControllers.addAccessController({ AccessController: AccessVerifier })

let orbitdb;

class Pinner {
  constructor (db) {
    this.db = db
    this.address = db.id
  }

  static async create(address) {
    const ipfs = await require('./ipfsInstance')
    if(!orbitdb) orbitdb = await OrbitDB.createInstance(ipfs)
    const db = await Pinner.openDatabase(orbitdb, address)
    return Promise.resolve(new Pinner(db))
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
