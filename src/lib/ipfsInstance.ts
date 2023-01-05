import { create, IPFS } from 'ipfs-core'
import { Lock } from 'semaphore-async-await'
import config from '../config'

let IPFSInstance: IPFS | null
const ipfsLock = new Lock()

async function getIPFS() {
	await ipfsLock.acquire()

	if (!IPFSInstance) {
		IPFSInstance = await create(config as any)
	}

	ipfsLock.release()
	return IPFSInstance
}

async function disconnectIPFS() {
	await ipfsLock.acquire()

	const isAliveMessage = !!IPFSInstance

	await IPFSInstance?.stop()
	IPFSInstance = null

	ipfsLock.release()

	return isAliveMessage
}

export { getIPFS, disconnectIPFS }
