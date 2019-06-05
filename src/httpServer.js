const config = require('config');

const express = require('express')

const manifest = require('./Manifest')
const app = express()

class server {
  constructor(httpPort) {
    const port = httpPort || config.get('http.port')

    app.get('/add', (req, res) => {
      const address = req.query.address

      if ( req.query.address ) {
        manifest.add( address)
        res.send(`adding... ${address}`)
      }
      else {
        res.send(`missing 'address' query parameter`)
      }
    })

    app.get('/remove', (req, res) => {
      const address = req.query.address

      if ( req.query.address ) {
        manifest.remove( address)
        res.send(`removing... ${address}`)
      }
      else {
        res.send(`missing 'address' query parameter`)
      }


    })

    app.listen(port, () => console.log(`Orbit-pinner listening on port ${port}`))
  }
}

module.exports = server
