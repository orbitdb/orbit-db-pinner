const OrbitPinner = require('../OrbitPinner')
const orbitInstance = require('./orbitInstance')

let pinners = []

const getContents =
  async () => {
                const db = await orbitInstance()

                return db.iterator({ limit: -1 })
                          .collect()
                          .map(
                            e => {
                              console.log(e.payload.value)
                              return e.payload.value
                            }
                          )
              }

const add =
  async ( address ) => {
                          const db        = await orbitInstance()
                          const addresses =  await getContents()

                          if (!addresses.includes(address)) {
                            await db.add(address)

                            console.log( `${address} added.` )
                            pinners.push(createPinnerInstance(address))
                          }
                          else {
                            console.warn( `Attempted to add ${address}, but already present in db.`)
                          }
                        }

const createPinnerInstance =
        address => {
                      console.log(`Pinning orbitdb @ ${address}`)

                      return new OrbitPinner( address )
                    }

const startPinning =
        async () => {
                      const addresses = await getContents()

                      console.log(addresses)
                      if (addresses.length === 0 ) console.log(
                        `Manifest empty`
                      )

                      pinners =
                        addresses
                          .map( createPinnerInstance )

                    }

const remove =
  async ( address ) => {
    const db        = await orbitInstance()
    const dbAddress = await getContents()

    // Unfortunately, since we can't remove a item from the database without it's hash
    // We have to rebuild the data every time we remove an item.
    db.drop()

    const newDb        = await orbitInstance()

    dbAddresses
      .filter(addr => ( addr !== address ))
      .forEach(
        address => newDb.add(address)
      )

    console.log( `${address} removed.` )

  }

  const startLogging =
    () => {
    console.log(`Logging - TODO`)
  }

  // stopPinning() { this.pinners( pinner => pinner.close() ) }
  //

console.log('Pinning previously added orbitdbs: ')
startPinning()

module.exports = {
  add
, remove
, startPinning
}
