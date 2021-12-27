# orbitdb-pinner
A pinning service for [orbitdb](https://github.com/orbitdb/orbit-db/).

* Pass it a single orbitdb address to pin.
* Pin/unpin multiple orbitdb databases via http.
* Have it `follow` the pinning list of another instance of the service.

**This is the initial release. It is not production ready.**

## Installation
```
npm i
```

## CLI usage

```
node pinner				    \\ start the server with current config file
node pinner -address ORBITDB_ADDRESS 	    \\ start the server and start replicating ORBITDB_ADDRESS
node pinner -http -port 1111	  	    \\ receive http connections. Port defaults to 3000
node pinner -follow  PINNER_DB_ADDRESS \\ replicate a database of orbitdb instances
```

## Config


Configuration of ipfs and the http server are handled in the config directory.
You can set the configuration of your node in the "config" folder. You can define if you want to use the node based on the ipfs api or an ipfs wrapper.

Default conf:
```json
{
  "http": {
    "port": 3000,
    "enabled": true
  },
  "ipfsConfig": {
    "repo": "./orbitdb/pinner",
    "start": true,
    "EXPERIMENTAL": {
      "pubsub": true
    },
    "config": {
      "Addresses": {
        "Swarm": [
          "/dns4/ws-star.discovery.libp2p.io/tcp/443/wss/p2p-websocket-star"
        ]
      }
    }
  }
}
```

## Http api

The http api is turned off by default. Enable it with `-http` in the cli, or `"http": true` in the config file.

### `\pin?address=ADDRESS`

Pins the orbitdb at `ADDRESS`. Resumes on restart. Any `follow`ing servers will also pin this database.

### `\unpin?address=ADDRESS`

Forgets the orbitdb at `ADDRESS`. Any `follow`ing servers will also unpin this database.

### `\follow?address=PINNER_DB_ADDRESS`

* Drops all current streams
* Pins all orbitdb addresses in the list at PINNER_DB_ADDRESS.
