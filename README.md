# orbitdb-pinner
An orbitdb pinning service. Pass it orbitdb database addresses, and it will replicate them until you tell it to stop.

**This is the initial release. It is not production ready.**

## Installation
```
	npm i
```

## CLI usage

```
	node pinner										  			\\ start the server with current config file
	node pinner -address ORBITDB_ADDRESS 	\\ start the server and start replicating ORBITDB_ADDRESS
	node pinner -http -port 1111	  			\\ receive http connections. Port defaults to 3000
	node pinner -replicate    		  			\\ replicate a database of orbitdb instances
```

## Config

The `config` npm package is used for configuration handling.

Configuration of ipfs and the http server are handled via json files in the config directory, allowing development and production configurations to be set via env

```
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

###`\pin`

Pins an orbitdb. Resumes on restart. Any `replicating` servers will also pin this database.

###`\unpin`

Forgets an orbitdb, unless it is in the config file. Any `replicating` servers will also unpin this database.

###`\replicate`

* Drops all current streams
* Replicates all streams in the passed in database manifest. Writes new pins to the manifest. Existing pins are forgotten.
