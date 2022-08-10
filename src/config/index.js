const wrtc = require('wrtc')
const WebRTCStar = require('libp2p-webrtc-star')
const WebSockets = require('libp2p-websockets')
const WebRTCDirect = require('libp2p-webrtc-direct')
const KadDHT = require('libp2p-kad-dht')
const MulticastDNS = require('libp2p-mdns')
const TCP = require('libp2p-tcp')

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
			transport: [WebRTCStar, WebSockets, WebRTCDirect, TCP],
			peerDiscovery: [MulticastDNS],
			dht: KadDHT,
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
			Swarm: [
				'/dns4/three0-rtc-node.herokuapp.com/tcp/443/wss/p2p-webrtc-star/',
			],
		},
	},
}

module.exports = ipfsConfig
