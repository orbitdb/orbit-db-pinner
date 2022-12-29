import OrbitDB from 'orbit-db'
import EventStore from 'orbit-db-eventstore'
import OrbitPinner from '../orbitPinner'
import {createDbInstance} from './orbitInstance'

const pinners: {[key: string]: OrbitPinner} = {}

async function createPinnerInstance(address: string) {
	if (!OrbitDB.isValidAddress(address)) {
		console.log(`Failed to pin ${address}. This is not a valid address`)
		return
	}

	console.log(`Pinning orbitdb @ ${address}`)
	const pinner = await OrbitPinner.create(address)
	pinners[address] = pinner
}

const getContents = async () => {
	const db = (await createDbInstance()) as EventStore<any>

	const contents = db
		.iterator({ limit: -1 })
		.collect()
		.map((e) => e.payload.value)

	await db.close()

	return contents
}

const getPinners = () => pinners

const add = async (address: string) => {
	const db = await createDbInstance()

	if (!OrbitDB.isValidAddress(address)) {
		console.log(`Failed to add ${address}. This is not a valid address`)
		return
	}

	const addresses = await getContents()

	if (!addresses.includes(address)) {
		const db = (await createDbInstance()) as EventStore<any>
		createPinnerInstance(address)

		console.log(`${address} added.`)
	} else {
		console.warn(`Attempted to add ${address}, but already present in db.`)
	}

	await db.close()
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
		await pinners[address].db.drop()
		await db.drop()
	} catch (e) {
		console.error(e)
	}
	delete pinners[address]

	dbAddresses
		.filter((addr) => addr !== address)
		.forEach((existingAddress) => db.add(existingAddress))

	console.log(`${address} removed.`)
}

console.log('Pinning previously added orbitdbs: ')
startPinning()

export {
	add,
	getContents,
	getPinners,
	remove,
}
