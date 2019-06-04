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

const orbitdb =
        orbitInstance
          .then(
            orbitdb => {
                          const manifestcfg = {
                            create          : true
                          , overwrite       : true
                          , localOnly       : false
                          , type            :'keyvalue'
                          , accessController: {
                              write: [orbitdb.identity.publicKey]
                            }
                          }

                          try {

                            orbitdb
                              .open(
                                '/manifest'
                                , manifestcfg
                              )
                          }
                          catch(e) { console.log(e.stack) }

                          return orbitdb
                        }
            )

module.exports = orbitdb
