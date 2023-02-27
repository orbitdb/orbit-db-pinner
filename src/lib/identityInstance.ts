import Identities, {Identity} from 'orbit-db-identity-provider'
import { ethers } from 'ethers'

let identity : Identity
let privateKey : string

const getIdentityInstance = async () => {
	if (identity === undefined) {
		console.log('creating identity now')
		privateKey = process.env.PRIVKEY?.toString()?process.env.PRIVKEY.toString():""
		const wallet = new ethers.Wallet(privateKey)

		identity = await Identities.createIdentity({
			type: 'ethereum',
			wallet,
		})
	}

	return identity
}
export default getIdentityInstance

