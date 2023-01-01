import cors from 'cors'
import express from 'express'
import * as pinningList from './pinningList'

const app = express()
app.use(cors())
app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(express.json())

app.get('/', async (_req, res) => {
	try {
		const numDatabases = (await pinningList.getContents()).length
		const pinners = pinningList.getPinners()

		const pinnerStats = Object.values(pinners).map((pinner) => ({
			size: pinner.getEstimatedSize(),
			address: pinner.address,
		}))

		res.render('index', {
			pinners: pinnerStats,
			num_databases: numDatabases,
			total_size: pinnerStats.reduce((a, b) => a + b.size, 0),
		})
	} catch (e: any) {
		console.error(e)
		res.status(500).json({ error: e.message })
	}
})

app.post('/pin', async (req, res) => {
	const { address } = req.query

	if (address) {
		try {
			await pinningList.add(address as string)
			res.send(`adding... ${address}`)
		} catch (e) {
			console.log(e)
			res.status(500).send(e)
		}
	} else {
		res.send("missing 'address' query parameter")
	}
})

app.delete('/pin', async (req, res) => {
	const { address } = req.query

	if (address) {
		try {
			await pinningList.remove(address as string)
			res.send(`removing... ${address}`)
		} catch (e) {
			console.log(e)
			res.status(500).send(e)
		}
	} else {
		res.send("missing 'address' query parameter")
	}
})

app.post('/ping', async (req, res) => {
	await Promise.all(
		req.body.addresses.map((address: string) => pinningList.updatePing(address))
	)
	res.send('pinging...')
})

export default app
