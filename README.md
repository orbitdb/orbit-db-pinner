# OrbitDB Pinner

OrbitDB Pinner is a pinning service for Orbit DB.

Pinner uses Libp2p protocols to send messages for pinning and unpinning databases. Once pinned, a database is replicated by the pinner so that it is available from the pinning service. Unpinning removes the replicated database from the pinning service.

OrbitDB Pinner is designed to be run on systems with guaranteed uptime and are publicly available. For example, a browser-based app running a local OrbitDB database may deploy one or more pinning servers to ensure the database is available once the browser is offline.

## Installation

```
npm i @orbitdb/pinner
```

## The OrbitDB Pinner Protocol

The OrbitDB Pinner uses Libp2p to pin and unpin databases to and from the pinning service. A database can be pinned or unpinned by dialling the pinner protocol and issuing a message as part of the protocol's request.

### Pinner Protocol

The pinner protocol is currently:

```
/orbitdb/pinner/v1.0.0
```

### Messages

Send one of the following messages to the pinner protocol in order to communicate with the pinning service:

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

Pinner uses simple ALLOW/DENY policies to authorize the sending of messages to the pinner protocol by remote peers.

Pinner can either be run in Allow mode where anyone can send a message except those who appear in the denied list or Deny mode which will only allow messages from an explicit list of peers.