import OrbitDB from 'orbit-db'
import Store from 'orbit-db-store'
import { Lock } from 'semaphore-async-await'
import { getIPFS } from '../ipfsInstance'

import getIdentityInstance from '../identityInstance'

let orbitInstance: OrbitDB | null
const orbitLock = new Lock()

const getOrbitInstance = async () => {
	await orbitLock.acquire()

	const ipfsInstance = await getIPFS()
	const identity = await getIdentityInstance()
	if (!orbitInstance) {
		if (process.env.PRIVKEY) {
			orbitInstance = await OrbitDB.createInstance(ipfsInstance, { identity })
		} else {
			orbitInstance = await OrbitDB.createInstance(ipfsInstance)
		}
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
	}

	await db.load()
	return db
}

export { getOrbitInstance, createDbInstance, disconnectOrbitInstance }
