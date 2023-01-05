import OrbitDB from 'orbit-db'
import Store from 'orbit-db-store'
import { Lock } from 'semaphore-async-await'
import { getIPFS } from '../ipfsInstance'
// import checkChanges from './checkChanges'

let orbitInstance: OrbitDB | null
const orbitLock = new Lock()

const getOrbitInstance = async () => {
	await orbitLock.acquire()

	const ipfsInstance = await getIPFS()
	if (!orbitInstance) {
		orbitInstance = await OrbitDB.createInstance(ipfsInstance)
	}

	orbitLock.release()
	return orbitInstance
}

const disconnectOrbitInstance = async () => {
	await orbitLock.acquire()

	const isAliveMessage = !!orbitInstance

	await orbitInstance?.disconnect()
	orbitInstance = null

	orbitLock.release()

	return isAliveMessage
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

export { getOrbitInstance, createDbInstance, disconnectOrbitInstance }
