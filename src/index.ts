import app from './lib/httpServer'
import { startPinning } from './lib/pinningList'

const PORT = process.env.PORT || 8000

app.listen(PORT, async () => {
	console.log(`Orbit-pinner listening on port ${PORT}`)
	await startPinning()
	console.log('Pinning started')
})
