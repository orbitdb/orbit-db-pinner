import Store from 'orbit-db-store'
import { getOrbitInstance } from './pinningList/orbitInstance'

class Pinner {
	db: any

	address: any

	constructor(db: Store) {
		this.db = db
		this.address = db.id
	}

	static async create(address: string) {
		const db = await Pinner.openDatabase(address)
		return Promise.resolve(new Pinner(db))
	}

	// drop() {
	// 	// console.log(this.orbitdb)
	// 	// this.orbitdb.disconnect()
	// }

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
