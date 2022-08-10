const OrbitDB = require('orbit-db')
const ipfsInstanceP = require('../ipfsInstance')

const orbitInstance = new Promise((resolve) => {
	ipfsInstanceP.then((ipfsInstance) => {
		resolve(
			OrbitDB.createInstance(ipfsInstance, {
				directory: './orbitdb/pinner/Manifest',
			})
		)
	})
})

const createDbInstance = async (addr) => {
	const address = addr || 'dbList'
	const dbInstance = await orbitInstance

	const pinningList = {
		create: true,
		overwrite: true,
		localOnly: false,
		type: 'feed',
	}

	const db = await dbInstance.open(address, pinningList)

	await db.load()

	return db
}

async function terminate() {
	try {
		const dbinstance = await orbitInstance
		await dbinstance.disconnect()
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

module.exports = createDbInstance
