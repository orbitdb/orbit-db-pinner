/* eslint-disable no-plusplus */
// const orbitInstance = require('./orbitInstance')
import { CID } from 'multiformats/cid'
import getIPFS from '../ipfsInstance'
// const getIdentityInstance = require('../identityInstance')
import { add, getPinners , getContents} from './index'

const checkChanges = async (address:string, payload:any) => {
	const ipfs = await getIPFS()
	console.log(`checkChanges for ${address}`)

	if (payload !== undefined && payload.value !== undefined) {
		const newIPFSContentCID = payload?.value?.content
		const newFeedAddress = payload?.value?.address
		if (newIPFSContentCID && payload.op === 'ADD') {
			const cid = await ipfs.pin.add(CID.parse(newIPFSContentCID))
			console.log('pinned cid locally', cid)
		}

		if (newFeedAddress && payload.op === 'ADD') {
			console.log(`found subfeed ADD: creating new pinner! ${newFeedAddress}`)
	
			await add(newFeedAddress)
			const currentPinners = getPinners()
			console.log('current pinners now', currentPinners?.address)
		}
		if (payload.op === 'DEL') {
			const addressOfMediaFeed = address
			console.log('removing stuff', payload)
			// 1. open the address again

			// 2. loop through the feed and check entry - if entry type contains an address
			const contentList = await getContents(addressOfMediaFeed)
			console.log('contentList', contentList)
		}
	} else {
		console.log('payload or payload value undefined', payload)
	}
}

export default checkChanges