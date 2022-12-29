"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var httpServer_1 = __importDefault(require("./lib/httpServer"));
var PORT = process.env.PORT || 8000;
httpServer_1["default"].listen(PORT, function () { return console.log("Orbit-pinner listening on port ".concat(PORT)); });
