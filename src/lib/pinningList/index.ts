import OrbitDB from 'orbit-db'
import EventStore from 'orbit-db-eventstore'
import { schedule } from 'node-cron'
import OrbitPinner from '../orbitPinner'
import { createDbInstance } from './orbitInstance'

interface PinnerMap {
	[key: string]: OrbitPinner
}

const pinners: PinnerMap = {}

async function createPinnerInstance(address: string) {
	if (!OrbitDB.isValidAddress(address)) {
		console.log(`Failed to pin ${address}. This is not a valid address`)
		return
	}

	console.log(`Pinning orbitdb @ ${address}`)
	const pinner = await OrbitPinner.create(address)
	pinners[address] = pinner
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

	if (!pinners[address]) {
		console.log(
			`Failed to unpin ${address}. Address not found in pinning list.`
		)
		return
	}

	const db = (await createDbInstance()) as EventStore<any>
	const dbAddresses = await getContents()

	// stop pinning
	try {
		await pinners[address].drop()
		await pinners[address].db.close()
	} catch (e) {
		console.error(e)
	}
	delete pinners[address]

	dbAddresses.filter((addr) => addr !== address).forEach(db.add)

	await db.drop()

	console.log(`${address} removed.`)
}

async function updatePing(address: string) {
	if (!pinners[address]) {
		await createPinnerInstance(address)
	} else {
		pinners[address].timeModified = Date.now()
	}
}

schedule('* * * * *', () => {
	const addresses = getPinners()

	console.log('Cleaning pinning list...')

	Object.keys(addresses).forEach((address) => {
		const pinner = pinners[address]

		console.log(`Checking ${address}...`)

		const lastUpdated = pinner.getLastUpdated()

		const now = Date.now()
		const diff = now - lastUpdated

		if (diff < 1 * 60 * 1000) return

		pinner.db
			.close()
			.then(() => {
				console.log(`Closed ${address}`)
				delete pinners[address]
			})
			.catch(console.error)
	})
})

export { add, getContents, getPinners, remove, startPinning, updatePing }
