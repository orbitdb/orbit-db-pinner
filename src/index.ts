import app from './lib/httpServer.js'
import { disconnectIPFS } from './lib/ipfsInstance.js'
import { startPinning } from './lib/pinningList/index.js'
import { disconnectOrbitInstance } from './lib/pinningList/orbitInstance.js'

const PORT = process.env.PORT || 8000

const server = app.listen(PORT, async () => {
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
