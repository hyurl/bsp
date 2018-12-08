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

    let pack = splitBuffer(Buffer.concat([remains[0], buf]), bufsep);

    for (let part of pack) {
        if (part && part.byteLength) {
            let data = eb.decode(part);

            if (data) {
                yield data;
            } else {
                remains[0] = part;
            }
        }
    }
}

exports.send = send;
exports.receive = receive;