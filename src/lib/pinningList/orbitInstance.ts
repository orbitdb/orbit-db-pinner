import OrbitDB from 'orbit-db'
import Store from 'orbit-db-store'
import ipfsInstancePromise from '../ipfsInstance'
// import checkChanges from './checkChanges'

let orbitInstance: OrbitDB

const getOrbitInstance = async () => {
	const ipfsInstance = await ipfsInstancePromise()
	if (orbitInstance) {
		return orbitInstance
	}
	orbitInstance = await OrbitDB.createInstance(ipfsInstance)
	return orbitInstance
}

const createDbInstance = async (address = 'dbList') => {
	const dbInstance = await getOrbitInstance()

	let db: Store

	if (address === 'dbList') {
		const pinningList = {
			create: true,
			type: 'feed',
			overwrite: true,
			localOnly: false,
		}

		db = await dbInstance.open(address, pinningList)
	} else {
		db = await dbInstance.open(address)

		// db.events.on('ready', (dbAddress, _feedReady) => {
		// 	console.log('database ready ', dbAddress)
		// })
		// db.events.on('replicate.progress', async (dbAddress, hash, obj) => {
		// 	console.log('replicate.progress', dbAddress, hash)
		// 	// const checkChanges = require('./checkChanges')
		// 	console.log('checking obj', obj)
		// 	checkChanges(dbAddress, obj.payload)
		// })
	}

	await db.load()

	return db
}

async function terminate() {
	try {
		const dbinstance = await getOrbitInstance()
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

export { getOrbitInstance, createDbInstance }
