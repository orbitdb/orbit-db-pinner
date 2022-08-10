const OrbitDB = require('orbit-db')
const OrbitPinner = require('../OrbitPinner')
const orbitInstance = require('./orbitInstance')

const pinners = {}

const createPinnerInstance = async (address) => {
	if (!OrbitDB.isValidAddress(address)) {
		console.log(`Failed to pin ${address}. This is not a valid address`)
		return
	}

	console.log(`Pinning orbitdb @ ${address}`)
	const pinner = await OrbitPinner.create(address)
	pinners[address] = pinner

	return pinners[address]
}

const getContents = async () => {
	const db = await orbitInstance()

	return db
		.iterator({ limit: -1 })
		.collect()
		.map((e) => e.payload.value)
}

const getPinners = () => pinners

const add = async (address) => {
	const db = await orbitInstance()

	if (!OrbitDB.isValidAddress(address)) {
		console.log(`Failed to add ${address}. This is not a valid address`)
		return
	}

	const addresses = await getContents()

	if (!addresses.includes(address)) {
		await db.add(address)
		createPinnerInstance(address)

		console.log(`${address} added.`)
	} else {
		console.warn(`Attempted to add ${address}, but already present in db.`)
	}
}

const startPinning = async () => {
	const addresses = await getContents()

	if (addresses.length === 0) {
		console.log('Pinning list is empty')
	}

	addresses.map(createPinnerInstance)
}

const remove = async (address) => {
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

	const db = await orbitInstance()
	const dbAddresses = await getContents()

	// stop pinning
	pinners[address].drop()
	delete pinners[address]

	// Unfortunately, since we can't remove a item from the database without it's hash
	// So we have to rebuild the data every time we remove an item.
	await db.drop()

	dbAddresses
		.filter((addr) => addr !== address)
		.forEach((address) => db.add(address))

	console.log(`${address} removed.`)
}

console.log('Pinning previously added orbitdbs: ')
startPinning()

module.exports = {
	add,
	getContents,
	getPinners,
	remove,
}
