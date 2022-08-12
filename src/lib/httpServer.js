const cors = require('cors')
const express = require('express')

const app = express()
app.use(cors())
app.set('view engine', 'ejs')
app.use(express.static('public'))

const pinningList = require('./pinningList')

app.get('/', async (req, res) => {
	try {
		const numDatabases = (await pinningList.getContents()).length
		const pinners = pinningList.getPinners()

		const pinnerStats = Object.values(pinners).map((pinner) => ({
			size: pinner.estimatedSize,
			address: pinner.address,
		}))

		res.render('index', {
			pinners: pinnerStats,
			num_databases: numDatabases,
			total_size: pinnerStats.reduce((a, b) => a + b.size, 0),
		})
	} catch (e) {
		console.error(e)
		res.status(500).json({ error: e.message })
	}
})

app.post('/pin', (req, res) => {
	const { address } = req.query

	if (req.query.address) {
		try {
			pinningList.add(address)
			res.send(`adding... ${address}`)
		} catch (e) {
			console.log(e)
			res.status(500).send(e)
		}
	} else {
		res.send("missing 'address' query parameter")
	}
})

app.post('/unpin', (req, res) => {
	const { address } = req.query

	if (req.query.address) {
		try {
			pinningList.remove(address)
			res.send(`removing... ${address}`)
		} catch (e) {
			console.log(e)
			res.status(500).send(e)
		}
	} else {
		res.send("missing 'address' query parameter")
	}
})

module.exports = app
