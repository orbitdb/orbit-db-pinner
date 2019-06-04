const OrbitPinner = require('../OrbitPinner')
const orbitInstance = require('./orbitInstance')


class Manifest {
  constructor(){
    console.log('creating manifest')
    this.startPinning()
  }

  startPinning() {
    this._getContentsP()
      .then(
        addresses => {
                        this.pinners =
                              addresses
                                .map(
                                  address => new OrbitPinner( address )
                                )
                      }
      )
  }

  _getContentsP() {
    return this.dbP.then(
              db => db.iterator()
                      .collect()
                      .map(
                        e => e.payload.value
                      )
            )
  }
}

module.exports = new Manifest()
