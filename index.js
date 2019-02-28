"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

const splitBuffer = require("buffer-split");
const toBuffer = require("to-buffer");
const bufsep = toBuffer("\r\n");

function send() {
    let data = Array.from(arguments);
    return Buffer.concat([toBuffer(JSON.stringify(data)), bufsep]);
}

function* receive(buf, temp) {
    temp[0] || (temp[0] = toBuffer([]));

    /** @type {Buffer[]} */
    let packs = splitBuffer(Buffer.concat([temp[0], buf]), bufsep);

    temp[0] = toBuffer([]);

    for (let pack of packs) {
        if (pack && pack.byteLength) {
            try {
                yield JSON.parse(pack.toString("utf8"));
            } catch (err) {
                (err.name === "SyntaxError") && (temp[0] = pack);
            }
        }
    }
}

exports.send = send;
exports.receive = receive;