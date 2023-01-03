import { create, IPFS } from 'ipfs-core'
import { Lock } from 'semaphore-async-await'
import config from '../config'

let IPFSInstance: IPFS
const ipfsLock = new Lock()

async function getIPFS() {
	await ipfsLock.acquire()

	if (!IPFSInstance) {
		IPFSInstance = await create(config as any)
	}

	ipfsLock.release()
	return IPFSInstance
}

export default getIPFS
