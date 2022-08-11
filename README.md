# Three0Pinner
A pinning service for [orbitdb](https://github.com/orbitdb/orbit-db/) formed from [orbitdb-pinner](https://github.com/orbitdb/orbit-db-pinner).

* Pass it a single orbitdb address to pin.
* Pin/unpin multiple orbitdb databases via http.

**This is the initial release. It is in alpha stage.**

## Installation
```
npm i
```

## Usage

### **GET** `\stats`
Gets the stats of the databases that are currently pinned

### **POST** `\pin?address=ADDRESS`

Pins the orbitdb at `ADDRESS`. Resumes on restart. Any `follow`ing servers will also pin this database.

### **POST** `\unpin?address=ADDRESS`

Forgets the orbitdb at `ADDRESS`. Any `follow`ing servers will also unpin this database.
