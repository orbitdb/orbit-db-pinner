"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var werift_1 = __importDefault(require("werift"));
var libp2p_webrtc_star_1 = __importDefault(require("libp2p-webrtc-star"));
// const WebSockets = require('libp2p-websockets')
// const WebRTCDirect = require('libp2p-webrtc-direct')
var libp2p_kad_dht_1 = __importDefault(require("libp2p-kad-dht"));
var libp2p_mdns_1 = __importDefault(require("libp2p-mdns"));
var libp2p_tcp_1 = __importDefault(require("libp2p-tcp"));
var ipfsConfig = {
    start: true,
    repo: './orbitdb-ipfs',
    EXPERIMENTAL: {
        pubsub: true
    },
    preload: {
        enabled: false
    },
    libp2p: {
        modules: {
            transport: [libp2p_tcp_1["default"], libp2p_webrtc_star_1["default"]],
            peerDiscovery: [libp2p_mdns_1["default"]],
            dht: libp2p_kad_dht_1["default"]
        },
        config: {
            peerDiscovery: {
                webRTCStar: {
                    enabled: true
                }
            },
            transport: {
                WebRTCStar: {
                    wrtc: werift_1["default"]
                }
            }
        },
        transportManager: { faultTolerance: 1 }
    },
    config: {
        Addresses: {
            Swarm: ['/dns4/signal-rtc.three0dev.com/tcp/443/wss/p2p-webrtc-star/']
        }
    }
};
exports["default"] = ipfsConfig;
