const config = require('config')

const express = require('express')
const cors = require('cors')
const app = express()

const pinningList = require('./pinningList')

class server {
  constructor (httpPort) {
    const port = httpPort || config.get('http.port')

    app.use(cors())

    app.get('/pin', (req, res) => {
      const address = req.query.address

      if (req.query.address) {
        pinningList.add(address)

        res.send(`adding... ${address}`)
      } else {
        res.send('missing \'address\' query parameter')
      }
    })

    app.get('/unpin', (req, res) => {
      const address = req.query.address

      if (req.query.address) {
        pinningList.remove(address)

        res.send(`removing... ${address}`)
      } else {
        res.send('missing \'address\' query parameter')
      }
    })

    app.listen(port, () => console.log(`Orbit-pinner listening on port ${port}`))
  }
}

module.exports = server
