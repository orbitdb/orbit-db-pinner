# Voyager

[![Matrix](https://img.shields.io/matrix/orbit-db%3Amatrix.org)](https://app.element.io/#/room/#orbit-db:matrix.org) [![npm (scoped)](https://img.shields.io/npm/v/%40orbitdb/voyager)](https://www.npmjs.com/package/@orbitdb/voyager) [![node-current (scoped)](https://img.shields.io/node/v/%40orbitdb/voyager)](https://www.npmjs.com/package/@orbitdb/voyager)

A **storage service** for [OrbitDB](https://github.com/orbitdb/orbitdb) peer-to-peer databases.

Voyager replicates and stores OrbitDB databases and makes them available to others when the database's originating peer is offline.

It is designed to run on systems with guaranteed uptime and public availability and can be seen as a "data availability node" for OrbitDB. For example, a browser-based app running a OrbitDB database may rely on one or more Voyager peers to ensure the database is available when the browser peer is unreachable.

***Note!*** *This software is currently in alpha version status and thus may change, break backwards compatibility or contain major issues. It has not been security audited. Use it accordingly.*

## Installation

To use Voyager as a module:

```sh
npm i @orbitdb/voyager
```

To use Voyager from the CLI:

```sh
npm i -g @orbitdb/voyager
```

## Usage

Voyager, like OrbitDB, is peer-to-peer and does not have a traditional server/client architecture and so terms "server" and "client" do not apply. Therefore, in keeping with OrbitDB's "celestial" naming convention, the storage service peer is called ***"Orbiter"*** and the interface which the developer or user uses to communicate with the storage service peer is called ***"Lander"***.

### CLI

The `voyager` CLI tool can be used to manage a Voyager instance. Run `voyager` on the command line to get started.

Currently the following commands are available:

```
voyager daemon   Launch Voyager
voyager id       Show the voyager's id
voyager address  Show the voyager's network addresses
voyager auth     Add or remove authorized user
```

### Orbiter Daemon

Voyager's **Orbiter**, the storage service, can be run as a daemon process. You can install the package globally and run it using the `voyager` CLI binary:

```sh
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
docker build -t orbitdb-voyager ./
docker run --rm -d -p 8000:8000 orbitdb-voyager
```

Adjust the port if required.

## Managing Orbiter Access

Orbiter will deny all requests by default. To allow a user to interact with Orbiter, the (requesting) user's `id` must be added to Orbiter's "allow" list.

Access to Orbiter can be configured in two ways; from the terminal and programmatically, using RPC.

**NOTE** The user's `id` used in the examples below can be retrieved using **`orbitdb.identity.id`**, which is available from the user's OrbitDB instance.

### Managing access from the terminal

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

### Managing access using RPC

Authorizing users can be carried out programmatically using Voyager's RPC function.

Start by instantiating the rpc:

```
import { RPC } from '@orbitdb/voyager'

const rpc = await RPC({ directory: '' })
```

To add an authorization:

```
const id = '037ba2545db2e2ec0ba17fc9b35fbbf6bc09db82c9ab324521e62693e8aa96ceb4'
await rpc.authAdd({ id })
```

To list all authorizations:

```
const { message } = await rpc.authList()
console.log(message)
```

And to remove an authorization:

```
await rpc.authDel()
```

## Adding databases using Lander

To make databases accessible from Voyager, the database needs to be added to an Orbiter storage service instance. This can be achieved programmatically by using the **Lander** module.

To use Lander, first install the [@orbitdb/voyager](https://www.npmjs.com/package/@orbitdb/voyager) package:

```sh
npm i @orbitdb/voyager
```

Next, instantiate Lander:

```js
import { createLibp2p } from 'libp2p'
import { createHelia } from 'helia'
import { createOrbitDB } from '@orbitdb/core'
import { Lander } from '@orbitdb/voyager'

// set up libp2p, helia and orbitdb

const libp2p = await createLibp2p()
const ipfs = await createHelia({ libp2p })
const orbitdb = await createOrbitDB({ ipfs })

// deployed orbiter peer id or listening address, it looks like this:
// /ip4/127.0.0.1/tcp/54322/p2p/16Uiu2HAmATMovCwY46yyJib7bGZF2f2XLRar7d7R3NJCSJtuyQLt
const orbiterAddressOrId = '...'

const lander = await Lander({ orbitdb, orbiterAddressOrId })
``` 

To add a database to voyager:

```js
// create a db to be added to voyager
const db = await orbitdb.open('my-db')

// add the address to voyager (can also pass an array of addresses)
await lander.add(db.address)
```

To remove a database from voyager:

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

## License

[MIT](LICENSE) © 2024 OrbitDB Community
