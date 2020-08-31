const OrbitDB = require('orbit-db')
const { AccessControllers } = require('orbit-db')
const AccessVerifier = require('../AccessVerifier')
AccessControllers.addAccessController({ AccessController: AccessVerifier })

const ipfsInstanceP = require('../ipfsInstance')

const orbitInstance = new Promise(resolve => {
  ipfsInstanceP.then(ipfsInstance => {
    resolve(OrbitDB.createInstance(ipfsInstance, {
      directory: './orbitdb/pinner/Manifest',
      AccessControllers: AccessControllers
    }))
  })
})

const createDbInstance = async addr => {
  const address = addr || 'dbList'
  const dbInstance = await orbitInstance

  const pinningList = {
    create: true,
    overwrite: true,
    localOnly: false,
    type: 'feed'
  }

  const db = await dbInstance.open(address, pinningList)

  await db.load()

  return db
}

module.exports = createDbInstance
