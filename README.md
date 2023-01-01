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

### **GET** `\`
UI Dashboard for the Three0Pinner service.

### **POST** `\pin?address=ADDRESS`

Pins the orbitdb at `ADDRESS`. Resumes on restart. Any `follow`ing servers will also pin this database.

### **DELETE** `\pin?address=ADDRESS`

Forgets the orbitdb at `ADDRESS`. Any `follow`ing servers will also unpin this database.

## Referral
We use Digital Ocean to host our pinning service. We recommend using the same and getting $100 in free credit to do so via this referral link.

[![DigitalOcean Referral Badge](https://web-platforms.sfo2.digitaloceanspaces.com/WWW/Badge%203.svg)](https://www.digitalocean.com/?refcode=3a852b46ecfd&utm_campaign=Referral_Invite&utm_medium=Referral_Program&utm_source=badge)

