const config = require('config')

const express = require('express')
const app = express()

const pinningList = require('./pinningList')

class server {
  constructor (httpPort) {
    const port = httpPort || config.get('http.port')

    app.get('/stats', async (req, res) => {
      const numDatabases = (await pinningList.getContents()).length
      const pinners = await pinningList.getPinners()

      const pinnerStats = Object.values(pinners).map((pinner) => {
        return ({
          size: pinner.estimatedSize
        })
      })

      res.json({
        pinners: pinnerStats,
        num_databases: numDatabases,
        total_size: pinnerStats.reduce((a, b) => a + b.size, 0)
      })
    })

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
