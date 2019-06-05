const OrbitDB = require('orbit-db')

const ipfsInstance = require('../ipfsInstance')

const orbitInstance =
        new Promise(
          resolve => {
                      ipfsInstance
                        .on('ready'
                        , () => {
                                  resolve(
                                    OrbitDB.createInstance(
                                      ipfsInstance
                                    , { directory: './orbitdb/pinner/Manifest' }
                                    )
                                  )
                                }
                        )
                      }
        )

const createDbInstance =
        async () => {
                      const dbInstance = await orbitInstance

                      const manifestcfg = {
                        create    : true
                      , overwrite : true
                      , localOnly : false
                      }

                      const db =
                        await dbInstance.create(
                                         `dblist`
                                        , 'feed'
                                        , manifestcfg
                                        )

                        await db.load()

                        return db
                    }


module.exports = createDbInstance
