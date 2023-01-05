import OrbitDB from 'orbit-db'
import EventStore from 'orbit-db-eventstore'
import Cron from 'croner'
import OrbitPinner from '../orbitPinner'
import { createDbInstance, disconnectOrbitInstance } from './orbitInstance'
import { disconnectIPFS } from '../ipfsInstance'

const pinners = new Map<string, OrbitPinner>()

const disconnect = async () => {
	const wasOrbitAlive = await disconnectOrbitInstance()
	if (wasOrbitAlive) console.log('Disconnected from OrbitDB')

	const wasIPFSAlive = await disconnectIPFS()
	if (wasIPFSAlive) console.log('Disconnected from IPFS')
}

const EXPIRATION_TIME = process.env.NODE_ENV === 'production' ? 10 : 1
const job = Cron(
	`*/${EXPIRATION_TIME} * * * *`,
	{
		paused: true,
	},
	() => {
		console.log('Cleaning pinning list...')

		pinners.forEach((pinner) => {
			console.log(`Checking ${pinner.address}...`)

			const lastUpdated = pinner.getLastUpdated()

			const now = Date.now()
			const diff = now - lastUpdated

			if (diff < EXPIRATION_TIME * 60 * 1000) return

			pinner.db
				.close()
				.then(() => {
					console.log(`Closed ${pinner.address}`)
					pinners.delete(pinner.address)
				})
				.catch(console.error)
		})

		if (pinners.size === 0) {
			disconnect().then(() => job.pause())
		}
	}
)

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
		job.resume()
	} else {
		console.warn(`Attempted to add ${address}, but already present in db.`)
	}
}

const startPinning = async () => {
	const addresses = await getContents()

	if (addresses.length === 0) {
		console.log('Pinning list is empty')
		await disconnect()
	} else {
		job.resume()
		addresses.forEach(createPinnerInstance)
	}
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

	await pinner.drop()
	await pinner.db.close()
	pinners.delete(address)

	await db.drop()
	await Promise.all(dbAddresses.filter((addr) => addr !== address).map(db.add))

	if (pinners.size === 0) {
		disconnect().then(() => job.pause())
	}

	console.log(`${address} removed.`)
}

const updatePing = async (address: string) => {
	const pinner = pinners.get(address)

	if (!pinner) {
		const addresses = await getContents()
		if (addresses.includes(address)) {
			await createPinnerInstance(address)
		} else {
			console.log(
				`Failed to update ping for ${address}. Address not found in pinning list.`
			)
		}
	} else {
		pinner.timeModified = Date.now()
	}

	job.resume()
}

export { add, getContents, getPinners, remove, startPinning, updatePing }
