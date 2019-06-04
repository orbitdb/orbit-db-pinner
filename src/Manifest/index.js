const OrbitPinner = require('../OrbitPinner')
const orbitInstance = require('./orbitInstance')


class Manifest {
  constructor(){
    console.log('creating manifest')
    this.startPinning()
  }

  startPinning() {

    const createPinnerInstance =
            address => {
                          console.log(`Pinning orbitdb @ ${address}`)

                          return new OrbitPinner( address )
                        }

    this._getContentsP()
          .then(
            addresses => {
                            if (addresses.length === 0 ) console.log(
                              `Manifest empty`
                            )

                            return addresses
                          })
          .then(
            addresses => this.pinners =
                                addresses
                                  .map( createPinnerInstance )
          )
  }

  _getContentsP() {
    return orbitInstance
              .then(
                db => {
                        return db.iterator()
                              .collect()
                              .map(
                                e => e.payload.value
                              )
                      }
              )
  }
}

module.exports = new Manifest()
