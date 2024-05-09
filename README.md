# Voyager, OrbitDB's pinning service

Voyager is a pinning peer for OrbitDB.

Voyager uses Libp2p protocols to send messages for pinning and unpinning databases. Once pinned, a database is replicated by Voyager so that it is available from the pinning peer rather than directly from the originating peer. Unpinning removes the replicated database from the pinning peer.

OrbitDB Voyager is designed to run on systems with guaranteed uptime and public availability. For example, a browser-based app running a local OrbitDB database may rely on one or more pinning peers to ensure the database is available when the browser peer goes offline.

Voyager, like OrbitDB, does not have a traditional server/client architecture and so terms "server" and "client" do not apply. Therefore, in keeping with OrbitDB's "planetary" naming convention, the pinning peer is called "Orbiter" and the interface which a 3rd party developer will use to communicate with the pinning peer is called "Lander".

## Installation

```
npm i @orbitdb/voyager
```

## The OrbitDB Voyager Pinning Protocol

The OrbitDB Voyager uses Libp2p to pin and unpin databases to and from the pinning service. A database can be pinned or unpinned by dialling the pinning protocol and issuing a message as part of the protocol's request.

### Pinning Protocol

The pinning protocol is currently:

```
/orbitdb/voyager/v1.0.0
```

### Messages

Send one of the following messages to the pinning protocol in order to communicate with the pinning service:

#### Pin

message: PIN
pubkey: The public key of the client
signature: One or more database addresses signed using the client's private key
addresses: One or more database addresses to pin 

If successful, an OK response will be sent. If pinning fails, an error will be returned.

#### Unpin

message: UNPIN
pubkey: The public key of the client
signature: One or more database addresses signed using the client's private key
addresses: One or more database addresses to unpin

If successful, an OK response will be sent. If unpinning fails, an error will be returned.

## Allowing and Denying Pins

Voyager uses simple ALLOW/DENY policies to authorize the sending of messages to the pinning protocol by remote peers.

Voyager can either be run in ALLOW ALL mode where anyone can send a message except those who appear in the denied list or DENY ALL mode which will only allow messages from an explicit list of peers. The default access mode is DENY ALL.