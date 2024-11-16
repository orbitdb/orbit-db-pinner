# Voyager, OrbitDB's pinning service

Voyager is a pinning peer for OrbitDB.

Voyager uses Libp2p protocols to send messages for pinning and unpinning databases. Once pinned, a database is replicated by Voyager so that it is available from the pinning peer rather than directly from the originating peer. Unpinning removes the replicated database from the pinning peer.

OrbitDB Voyager is designed to run on systems with guaranteed uptime and public availability. For example, a browser-based app running a local OrbitDB database may rely on one or more pinning peers to ensure the database is available when the browser peer goes offline.

Voyager, like OrbitDB, does not have a traditional server/client architecture and so terms "server" and "client" do not apply. Therefore, in keeping with OrbitDB's "planetary" naming convention, the pinning peer is called "Orbiter" and the interface which a 3rd party developer will use to communicate with the pinning peer is called "Lander".

## Installation

```sh
npm i @orbitdb/voyager
```

## Running "Orbiter"

Voyager's Orbiter (the pinning service) can be run as a daemon process. You can install the package globally and run it using the "voyager" binary:

```sh
npm i -g @orbitdb/voyager
voyager daemon
```

To store Orbiter's configuration to a different location, use the -d or --directory flag:

```sh
voyager daemon -d /path/to/voyager
```

## Managing "Orbiter" access

Access to Orbiter can be configured using the Voyager binary.

To add an authorized public key to Orbiter:

```sh
voyager auth add <publickey>
```

where <publickey> identifies a user who can pin databases to this Orbiter.

To remove an authorized public key to Orbiter:

```sh
voyager auth del <publickey>
```

where <publickey> identifies a user who can pin databases to this Orbiter.

List authorized public keys:

```sh
voyager auth list
```

If Orbiter's configuration is deployed to a different location, call Voyager with the -d or --directory flag and specify Orbiter's custom directory:

```sh
voyager auth add -f <publickey>
voyager auth list -f
voyager auth remove -f <publickey>
```

## Pinning databases using "Lander"

To make databases accessible from Voyager, the database needs to be pinned to an Orbiter instance. This can be achieved programmatically by using the "Lander" module.

To use Lander, first install the @orbitdb/voyager package:

```sh
npm i @orbitdb/voyager
```

Next, instantiate Lander:

```js
import { createLibp2p } from 'libp2p'
import { createHelia } from 'helia'
import { createOrbitDB } from '@orbitdb/core'

// set up configuration for libp2p and helia.

const libp2p = await createLibp2p({ ...options })
const ipfs = await createHelia({ libp2p })

directory = directory || './lander'

const orbitdb = await createOrbitDB({ ipfs, directory })

await connectPeers(orbiter.orbitdb.ipfs, ipfs)

const orbiterAddressOrId = // deployed orbiter peer id or listening address.

const lander = await Lander({ orbitdb, orbiterAddressOrId })
``` 

To pin a db:

```js
// create a db for pinning
const db = await orbitdb.open('my-db')

// store the address of the db to an array of addresses.
const dbs = [db.address]

// Pin the addresses to the pinner.
await lander.pin(dbs)
```

To unpin a pinned db:

```js
// open an instance of the db you want to unpin.
const db = await orbitdb.open('my-db')

// store the address of the db to an array of addresses.
const dbs = [db.address]

// Unpin the addresses from the pinner.
await lander.unpin(dbs)
```

## The OrbitDB Voyager Pinning Protocol

The OrbitDB Voyager uses Libp2p to pin and unpin databases to and from the pinning service. A database can be pinned or unpinned by dialling the pinning protocol and issuing a message as part of the protocol's request.

### Pinning Protocol

The pinning protocol is:

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