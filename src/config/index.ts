import wrtc from 'wrtc'
import WebRTCStar from 'libp2p-webrtc-star'
// import WebSockets from 'libp2p-websockets'
// import WebRTCDirect from 'libp2p-webrtc-direct'
import KadDHT from 'libp2p-kad-dht'
import MulticastDNS from 'libp2p-mdns'
import TCP from 'libp2p-tcp'

const ipfsConfig = {
	start: true,
	repo: './orbitdb-ipfs',
	EXPERIMENTAL: {
		pubsub: true,
	},
	preload: {
		enabled: false,
	},
	libp2p: {
		modules: {
			transport: [WebRTCStar, TCP],
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
