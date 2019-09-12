"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

const sprintf = require("sprintf-js").sprintf;

function encode(...data) {
    let buf = Buffer.from([]);

    for (let payload of data) {
        let type = NaN;

        switch (typeof payload) {
            case "string":
                type = 1;
                payload = Buffer.from(payload);
                break;

            case "number":
                type = 2;
                payload = Buffer.from(payload.toString());
                break;

            case "bigint":
                type = 3;
                payload = Buffer.from(payload.toString());
                break;

            case "boolean":
                type = 4;
                payload = Buffer.from([Number(payload)]);
                break;

            case "object":
                if (null === payload) {
                    type = 0;
                    payload = Buffer.from([]);
                } else if (Buffer.isBuffer(payload)) {
                    type = 6;
                } else {
                    type = 5;
                    payload = Buffer.from(JSON.stringify(payload));
                }
                break;
        }

        let head = [type];
        let len = payload.byteLength;

        if (len <= 255) {
            head.push(1, len);
        } else if (len <= 65535) {
            head.push(2);

            for (let i = 0, bin = sprintf("%016b", len); i < 16;) {
                head.push(parseInt(bin.slice(i, i += 8), 2));
            }
        } else {
            head.push(3);

            for (let i = 0, bin = sprintf("%064b", len); i < 64;) {
                head.push(parseInt(bin.slice(i, i += 8), 2));
            }
        }

        buf = Buffer.concat([buf, Buffer.from(head), payload]);
    }

    return buf;
}

/**
 * @param {Buffer} buf
 */
function parsePayloadInfo(buf) {
    if (buf.byteLength < 3) {
        return null; // header frame
    }

    let type = buf.readUInt8(0);
    let lenType = buf.readUInt8(1);
    let offset = [0, 3, 4, 10][lenType];
    let length = -1;
    let bin = "";

    if (type > 6 || lenType > 3) {
        return false; // malformed/unencoded data
    }

    if (buf.byteLength < offset) {
        return null;  // header frame
    }

    switch (lenType) {
        case 1:
            length = buf.readUInt8(2);
            break;

        case 2:
            for (let i = 2; i < 4; i++) {
                bin += sprintf("%08b", buf.readUInt8(i));
            }

            length = parseInt(bin, 2);
            break;

        case 3:
            for (let i = 2; i < 10; i++) {
                bin += sprintf("%08b", buf.readUInt8(i));
            }

            length = parseInt(bin, 2);
            break;
    }

    return { type, offset, length };
}

/**
 * @param {[number, number, Buffer]} temp 
 */
function isHeaderTemp(temp) {
    return temp.length === 3
        && temp[0] === undefined
        && temp[1] === undefined
        && Buffer.isBuffer(temp[2]);
}

/**
 * @param {Buffer} buf 
 * @param {[number, number, Buffer]} temp 
 */
function fillTemp(buf, temp) {
    if (isHeaderTemp(temp)) {
        buf = Buffer.concat([temp[2], buf]);
    }

    let info = parsePayloadInfo(buf);

    if (info === false) {
        return; // malformed/unencoded data
    } else if (info === null) {
        temp[0] = temp[1] = void 0;
        temp[2] = buf;
    } else {
        let { type, length, offset } = info;

        if (offset !== 0) {
            temp[0] = type;
            temp[1] = length;
            temp[2] = buf.slice(offset);
        }
    }
}

/**
 * @param {Buffer} buf 
 * @param {[number, number, Buffer]} temp 
 */
function* decode(buf, temp) {
    // put the buffer into the temp
    if (temp.length === 0 || isHeaderTemp(temp)) {
        fillTemp(buf, temp);
    } else if (temp.length === 3) {
        temp[2] = Buffer.concat([temp[2], buf]);
    }

    // scan the temp and yield any parsed data
    while (temp.length === 3 && temp[2].byteLength >= temp[1]) {
        let [type, length, buf] = temp;
        let payload = buf.slice(0, length);

        buf = buf.slice(length);

        switch (type) {
            case 0: // null
                yield null;
                break;

            case 1:
                yield payload.toString("utf-8");
                break;

            case 2:
                yield Number(payload.toString("utf-8"));
                break;

            case 3:
                yield BigInt(payload.toString("utf-8"));
                break;

            case 4:
                yield Boolean(payload.readUInt8(0));
                break;

            case 5:
                yield JSON.parse(payload.toString("utf-8"));
                break;

            case 6:
                yield payload;
                break;
        }

        if (buf.byteLength > 0) {
            fillTemp(buf, temp);
        } else {
            temp.splice(0, 3); // clean temp
        }
    }
}

function wrap(stream) {
    let _write = stream.write.bind(stream);
    let _on = stream.on.bind(stream);
    let _once = stream.once.bind(stream);
    let _prepend = stream.prependListener.bind(stream);
    let _prependOnce = stream.prependOnceListener.bind(stream);
    let temp = [];
    let addListener = (fn, event, listener) => {
        if (event === "data") {
            let _listener = (buf) => {
                for (let data of decode(buf, temp)) {
                    listener(data);
                }
            };
            return fn("data", _listener);
        } else {
            return fn(event, listener);
        }
    };

    stream.write = function write(chunk, encoding, callback) {
        return _write(encode(chunk), encoding, callback);
    };

    stream.on = stream.addListener = function on(event, listener) {
        return addListener(_on, event, listener);
    };

    stream.once = function once(event, listener) {
        return addListener(_once, event, listener);
    };

    stream.prependListener = function prependListener(event, listener) {
        return addListener(_prepend, event, listener);
    };

    stream.prependOnceListener = function prependOnceListener(event, listener) {
        return addListener(_prependOnce, event, listener);
    };

    return stream;
}

exports.send = exports.encode = encode;
exports.receive = exports.decode = decode;
exports.wrap = wrap;