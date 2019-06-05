# orbitdb-pinner
An orbitdb pinning service. Pass it orbitdb database addresses, and it will replicate them until you tell it to stop.

## Installation
```
	npm i
```

## CLI usage

```
	npm run start  			   		 \\ start the server. service defaults to config
	npm run start -db dfsfsf 	   		 \\ start the server and start replicating
	npm run start -replicate sfafdafsf 		 \\ replicate a database of orbitdb instances
	npm run start -replicate-server 101.234.456:8080 \\ request a replication database from another satellite instance
	npm run start -http 				 \\ receive http connections
```

## Config

Use the `config` npm package.

Create separate `default` and `production` configurations in separate files. Switch between them via env.

```
{
	"address": "dfgdfd",      		// optional
	"server" : "123.565.656", 		// optional
	"http"	 : false, 						// default
	"port"	 : 3000, 							// default
	"ipfsConfig": { ... }					// required
}
```

## Http api

The http api is turned off by default. Enable it with `-http` in the cli, or `"http": true` in the config file.

###`\replicate`

* Drops all current streams
* Replicates all streams in the passed in database manifest. Writes new pins to the manifest. Existing pins are forgotten.

###`\replicateServer`

* Requests a server's manifest and starts using it. Forgets any existing pins.

###`\pin`

Pins an orbitdb. Resumes on restart. Any `replicating` servers will also pin this database.

###`\unpin`

Forgets an orbitdb, unless it is in the config file. Any `replicating` servers will also unpin this database.

###`\getManifest`

Returns the address of the service's database of currently pinned instances.
