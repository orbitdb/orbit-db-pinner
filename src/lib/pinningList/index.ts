import OrbitDB from 'orbit-db'
import EventStore from 'orbit-db-eventstore'
import { schedule } from 'node-cron'
import OrbitPinner from '../orbitPinner'
import { createDbInstance } from './orbitInstance'

const pinners = new Map<string, OrbitPinner>()

async function createPinnerInstance(address: string) {
	if (!OrbitDB.isValidAddress(address)) {
		console.log(`Failed to pin ${address}. This is not a valid address`)
		return
	}

	console.log(`Pinning orbitdb @ ${address}`)
	const pinner = await OrbitPinner.create(address)
	pinners.set(address, pinner)
}

const getContents = async (addr = 'dbList') => {
	const db = (await createDbInstance(addr)) as EventStore<any>

	const contents = db
		.iterator({ limit: -1 })
		.collect()
		.map((e) => e.payload.value)

	await db.close()

	return contents
}

const getPinners = () => pinners

const add = async (address: string) => {
	if (!OrbitDB.isValidAddress(address)) {
		console.log(`Failed to add ${address}. This is not a valid address`)
		return
	}

	const addresses = await getContents()

	if (!addresses.includes(address)) {
		const db = (await createDbInstance()) as EventStore<any>
		await db.add(address)
		await createPinnerInstance(address)

		console.log(`${address} added.`)

		await db.close()
	} else {
		console.warn(`Attempted to add ${address}, but already present in db.`)
	}
}

const startPinning = async () => {
	const addresses = await getContents()

	if (addresses.length === 0) {
		console.log('Pinning list is empty')
	}

	addresses.forEach(createPinnerInstance)
}

const remove = async (address: string) => {
	if (!OrbitDB.isValidAddress(address)) {
		console.log(`Failed to unpin ${address}. This is not a valid address`)
		return
	}

	const pinner = pinners.get(address)

	if (!pinner) {
		console.log(
			`Failed to unpin ${address}. Address not found in pinning list.`
		)
		return
	}

	const db = (await createDbInstance()) as EventStore<any>
	const dbAddresses = await getContents()

	// stop pinning
	try {
		await pinner.drop()
		await pinner.db.close()
	} catch (e) {
		console.error(e)
	}
	pinners.delete(address)

	dbAddresses.filter((addr) => addr !== address).forEach(db.add)

	await db.drop()

	console.log(`${address} removed.`)
}

const updatePing = async (address: string) => {
	const pinner = pinners.get(address)

	if (!pinner) {
		await createPinnerInstance(address)
	} else {
		pinner.timeModified = Date.now()
	}
}

const EXPIRATION_TIME = process.env.NODE_ENV === 'production' ? 10 : 1

schedule(`*/${EXPIRATION_TIME} * * * *`, () => {
	const addresses = getPinners()

	console.log('Cleaning pinning list...')

	addresses.forEach((pinner) => {
		console.log(`Checking ${pinner.address}...`)

		const lastUpdated = pinner.getLastUpdated()

		const now = Date.now()
		const diff = now - lastUpdated

		if (diff < EXPIRATION_TIME * 60 * 1000) return

		pinner.db
			.close()
			.then(() => {
				console.log(`Closed ${pinner.address}`)
				addresses.delete(pinner.address)
			})
			.catch(console.error)
	})
})

export { add, getContents, getPinners, remove, startPinning, updatePing }
