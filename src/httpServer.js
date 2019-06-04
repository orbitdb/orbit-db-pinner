const config = require('config');

const express = require('express')

const manifest = require('./Manifest')
const app = express()

class server {
  constructor(httpPort) {
    const port = httpPort || config.get('http.port')

    app.get('/add', (req, res) => res.send('Hello World!'))
    app.get('/remove', (req, res) => res.send('Hello World!'))

    app.listen(port, () => console.log(`Orbit-pinner listening on port ${port}`))
  }
}

module.exports = server
