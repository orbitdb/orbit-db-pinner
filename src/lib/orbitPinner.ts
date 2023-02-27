import Store from 'orbit-db-store'
import { getOrbitInstance } from './pinningList/orbitInstance'
import dotenv from 'dotenv'
dotenv.config()

class Pinner {
	db: Store

	address: string

	timeModified: number

	constructor(db: Store) {
		this.db = db
		this.address = db.id
		this.timeModified = Date.now()
	}

	static async create(address: string) {
		const db = await Pinner.openDatabase(address)
		console.log("db open in pinner")
		db.events.on('ready', (dbAddress, _feedReady) => {
			console.log('database ready ', dbAddress)
		})
		db.events.on('replicate.progress', async (dbAddress, hash, obj) => {
			console.log('replicate.progress', dbAddress, hash)
			// const checkChanges = require('./checkChanges')
			console.log('checking obj', obj.payload.value.counters)
			// checkChanges(dbAddress, obj.payload)
		})
		return Promise.resolve(new Pinner(db))
	}

	async drop() {
		await this.db.drop()
	}

	getLastUpdated() {
		return this.timeModified
	}

	getEstimatedSize() {
		// eslint-disable-next-line no-underscore-dangle
		return !this.db ? 0 : this.db._oplog.values.length
	}

	static async openDatabase(address: string) {
		const orbitdb = await getOrbitInstance()
		console.log(`opening database from ${address}`)
		const db = await orbitdb.open(address)
		console.log('Listening for updates to the database...')
		await db.load()
		return db
	}
}

export default Pinner
