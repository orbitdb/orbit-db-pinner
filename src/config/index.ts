import wrtc from 'wrtc'
import TCP from 'libp2p-tcp'
import WebRTCStar from 'libp2p-webrtc-star'
// import KadDHT from 'libp2p-kad-dht'
// import MulticastDNS from 'libp2p-mdns'
// import { Options } from 'ipfs-core'

const ipfsConfig = {
	start: true,
	repo: './orbitdb-ipfs',
	EXPERIMENTAL: {
		ipnsPubsub: true,
	},
	preload: {
		enabled: false,
	},
	libp2p: {
		modules: {
			transport: [TCP, WebRTCStar],
			// peerDiscovery: [MulticastDNS],
			// dht: KadDHT,
		},
		config: {
			peerDiscovery: {
				webRTCStar: {
					enabled: true,
				},
			},
			transport: {
				WebRTCStar: {
					wrtc,
				},
			},
		},
		transportManager: { faultTolerance: 1 },
	},
	config: {
		Addresses: {
			Swarm: ['/dns4/signal-rtc.three0dev.com/tcp/443/wss/p2p-webrtc-star/'],
		},
	},
}

export default ipfsConfig
