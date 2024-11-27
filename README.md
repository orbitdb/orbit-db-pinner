# Voyager

**Storage service** for [OrbitDB](https://github.com/orbitdb/orbitdb) peer-to-peer databases.

Voyager replicates and stores OrbitDB databases and makes them available to others when the database's originating peer is offline.

It is designed to run on systems with guaranteed uptime and public availability and can be seen as a "data availability node" for OrbitDB. For example, a browser-based app running a OrbitDB database may rely on one or more Voyager peers to ensure the database is available when the browser peer goes offline.

Voyager, like OrbitDB, is peer-to-peer and does not have a traditional server/client architecture and so terms "server" and "client" do not apply. Therefore, in keeping with OrbitDB's "celestial" naming convention, the storage service peer is called ***"Orbiter"*** and the interface which the developer or user uses to communicate with the storage service peer is called ***"Lander"***.

***Note!*** *This software is currently in alpha version status and thus may change, break backwards compatibility or contain major issues. It has not been security audited. Use it accordingly.*

## Installation

```sh
npm i @orbitdb/voyager
```

### Running "Orbiter"

Voyager's Orbiter (the storage service) can be run as a daemon process. You can install the package globally and run it using the "voyager" binary:

```sh
npm i -g @orbitdb/voyager
voyager daemon
```

To store Orbiter's configuration and data to a different directory, use the `-d` or `--directory` flag or `VOYAGER_PATH` environment variable:

```sh
voyager daemon -d /path/to/voyager
```

```sh
VOYAGER_PATH=/path/to/voyager voyager daemon
```

### Docker

You can run an Orbiter storage service using a pre-configured Docker image.

Once you have cloned this repo, cd into the voyager directory root and run:

```
docker build -t orbitdb-pinner ./
docker run --rm -d -p 8000:8000 orbitdb-pinner
```

Adjust the port if required.

## Managing "Orbiter" access

Orbiter will deny all requests by default. To allow a user to interact with Orbiter, the (requesting) user's `id` must be added to Orbiter's "allow" list.

Access to Orbiter can be configured using the Voyager binary.

The user's `id` used in the examples below can be retrieved from the user's OrbitDB instance's **`orbitdb.identity.id`** field.

To add an authorized user to Orbiter:

```sh
voyager auth add <id>
```

where `<id>` identifies a user who can add databases to this Orbiter. The `<id>` is the string from user's OrbitDB instance `orbitdb.identity.id`.

To remove an authorized user from Orbiter:

```sh
voyager auth del <id>
```

where `<id>` identifies a user who can add databases to this Orbiter. The `<id>` is the string from user's OrbitDB instance `orbitdb.identity.id`.

List authorized users:

```sh
voyager auth list
```

If Orbiter is deployed to a custom directory, call Voyager with the `-d` or `--directory` flag, or `VOYAGER_PATH`environment variable, and specify the directory:

```sh
voyager auth add -d /custom/voyager/path <id>
voyager auth remove -d /custom/voyager/path <id>
voyager auth list -d /custom/voyager/path
```

```sh
VOYAGER_PATH=/custom/voyager/path voyager auth add <id>
VOYAGER_PATH=/custom/voyager/path voyager auth remove <id>
VOYAGER_PATH=/custom/voyager/path voyager auth list
```

## Adding databases using "Lander"

To make databases accessible from Voyager, the database needs to be added to an Orbiter storage service instance. This can be achieved programmatically by using the "Lander" module.

To use Lander, first install the [@orbitdb/voyager](todo: link) package:

```sh
npm i @orbitdb/voyager
```

Next, instantiate Lander:

```js
import { createLibp2p } from 'libp2p'
import { createHelia } from 'helia'
import { createOrbitDB } from '@orbitdb/core'

// set up configuration for libp2p and helia

const libp2p = await createLibp2p({ ...options })
const ipfs = await createHelia({ libp2p })

directory = directory || './lander'

const orbitdb = await createOrbitDB({ ipfs, directory })

// deployed orbiter peer id or listening address, it looks like this:
// /ip4/127.0.0.1/tcp/54322/p2p/16Uiu2HAmATMovCwY46yyJib7bGZF2f2XLRar7d7R3NJCSJtuyQLt
const orbiterAddressOrId = '...'

const lander = await Lander({ orbitdb, orbiterAddressOrId })
``` 

To add a db to voyager:

```js
// create a db to be added to voyager
const db = await orbitdb.open('my-db')

// add the address to voyager (can also pass an array of addresses)
await lander.add(db.address)
```

To remove a db from voyager:

```js
// open an instance of the db you want to remove from voyager
const db = await orbitdb.open('my-db')

// remove the address from voyager (can also pass an array of addresses)
await lander.remove(db.address)
```

## The OrbitDB Voyager Protocol

Voyager uses Libp2p to add and remove databases to replicate to and from the storage service. A database can be added or removed by dialling the protocol and issuing a request message.

### Protocol

The protocol identifier is:

```
/orbitdb/voyager/v1.0.0
```

### Messages

Send one of the following messages to the protocol in order to communicate with the service:

#### Adding a DB for replication

```
type: PIN_ADD
id: The id of the requester
signature: One or more database addresses signed by the requester
addresses: One or more database addresses to add to the storage 
```

If successful, an OK response will be sent. If it fails, an error will be returned.

#### Removing a DB for replication

```
type: PIN_REMOVE
id: The id of the requester
signature: One or more database addresses signed by the requester
addresses: One or more database addresses to remove from the storage
```

If successful, an OK response will be sent. If it fails, an error will be returned.

## Allowing and Denying User Access

Voyager uses simple ALLOW/DENY policies to authorize the messages received through the protocol.

Voyager can either be run in ALLOW ALL mode where anyone can send a message except those who appear in the denied list or DENY ALL mode which will only allow messages from an explicit list of users. The default access mode is DENY ALL.
