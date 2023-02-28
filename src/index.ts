import * as dotenv from 'dotenv'
import app from './lib/httpServer'
import { disconnectIPFS } from './lib/ipfsInstance'
import { startPinning } from './lib/pinningList'
import { disconnectOrbitInstance } from './lib/pinningList/orbitInstance'

const PORT = process.env.PORT || 8000

const server = app.listen(PORT, async () => {
	dotenv.config()
	console.log(`Orbit-pinner listening on port ${PORT}`)
	await startPinning()
	console.log('Pinning started')
})

const terminate = async () => {
	server.close()

	try {
		await disconnectOrbitInstance()
		await disconnectIPFS()
		process.exit(0)
	} catch (e) {
		console.log(e)
		process.exit(1)
	}
}

process.on('SIGINT', async () => {
	await terminate()
})
process.on('SIGTERM', async () => {
	await terminate()
})
