"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

const eb = require("encoded-buffer");
const splitBuffer = require("buffer-split");
const toBuffer = require("to-buffer");
const bufsep = toBuffer("\r\n");

function send() {
    let data = Array.from(arguments);
    return Buffer.concat([eb.encode.apply(void 0, data), bufsep]);
}

function* receive(buf, remains) {
    remains[0] || (remains[0] = toBuffer([]));

    let packs = splitBuffer(Buffer.concat([remains[0], buf]), bufsep);

    remains[0] = toBuffer([]);

    for (let pack of packs) {
        if (pack && pack.byteLength) {
            let data = eb.decode(pack);

            if (data) {
                yield data;
            } else {
                remains[0] = pack;
            }
        }
    }
}

exports.send = send;
exports.receive = receive;