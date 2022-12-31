import { create, IPFS } from 'ipfs-core'
import config from '../config'

let IPFSInstance: IPFS

async function getIPFS() {
	if (!IPFSInstance) {
		IPFSInstance = await create(config as any)
	}
	return IPFSInstance
}

export default getIPFS
