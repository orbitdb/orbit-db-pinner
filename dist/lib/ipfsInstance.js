"use strict";
exports.__esModule = true;
var IPFS = require('ipfs-core');
var config = require('../config');
exports["default"] = IPFS.create(config);
