import Store from 'orbit-db-store'
import { getOrbitInstance } from './pinningList/orbitInstance.js'

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
		console.log('db open in pinner')
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
