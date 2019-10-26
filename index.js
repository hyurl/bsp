"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

const sprintf = require("sprintf-js").sprintf;
const concatTypedArray = require("concat-typed-array");
const { isBufferLike } = require("is-like");

const hasBuffer = typeof Buffer === "function";
const TypedArray = hasBuffer ? Buffer : Uint8Array;

/** @type {TextEncoder} */
let encoder;
/** @type {TextDecoder} */
let decoder;

if (typeof TextEncoder === "function") {
    encoder = new TextEncoder();
}

if (typeof TextDecoder === "function") {
    decoder = new TextDecoder("utf8");
}

/**
 * @param {string} text 
 * @returns {Buffer|Uint8Array}
 */
function encodeText(text) {
    if (hasBuffer) {
        return Buffer.from(text);
    } else if (encoder) {
        return encoder.encode(text);
    } else {
        throw new Error("No implementation of text encoder was found");
    }
}

/**
 * @param {Buffer|Uint8Array} buf 
 * @returns {string}
 */
function decodeText(buf) {
    if (hasBuffer) {
        return Buffer.from(buf).toString("utf8");
    } else if (decoder) {
        return decoder.decode(buf);
    } else {
        throw new Error("No implementation of text decoder was found");
    }
}

/**
 * @param {Buffer[] | Uint8Array[]} bufs
 * @returns {Buffer|Uint8Array}
 */
function concatBuffers(bufs) {
    return concatTypedArray(TypedArray, ...bufs);
}

function encode(...data) {
    let buf = TypedArray.from([]);

    for (let payload of data) {
        let type = NaN;

        switch (typeof payload) {
            case "string":
                type = 1;
                payload = encodeText(payload);
                break;

            case "number":
                type = 2;
                payload = encodeText(payload.toString());
                break;

            case "bigint":
                type = 3;
                payload = encodeText(payload.toString());
                break;

            case "boolean":
                type = 4;
                payload = TypedArray.from([Number(payload)]);
                break;

            case "object":
                if (null === payload) {
                    type = 0;
                    payload = TypedArray.from([]);
                } else if (isBufferLike(payload)) {
                    type = 6; // raw data
                } else {
                    type = 5;
                    payload = encodeText(JSON.stringify(payload));
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

        buf = concatBuffers([buf, TypedArray.from(head), payload]);
    }

    return buf;
}

/**
 * @param {Buffer|Uint8Array} buf
 */
function parsePayloadInfo(buf) {
    if (buf.byteLength < 3) {
        return null; // header frame
    }

    let [type, lenType] = buf;
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
            length = buf[2];
            break;

        case 2:
            for (let i = 2; i < 4; i++) {
                bin += sprintf("%08b", buf[i]);
            }

            length = parseInt(bin, 2);
            break;

        case 3:
            for (let i = 2; i < 10; i++) {
                bin += sprintf("%08b", buf[i]);
            }

            length = parseInt(bin, 2);
            break;
    }

    return { type, offset, length };
}

/**
 * @param {[number, number, Buffer|Uint8Array]} temp 
 */
function isHeaderTemp(temp) {
    return temp.length === 3
        && temp[0] === undefined
        && temp[1] === undefined
        && temp[2] instanceof Uint8Array;
}

/**
 * @param {Buffer|Uint8Array} buf 
 * @param {[number, number, Buffer|Uint8Array]} temp 
 */
function fillTemp(buf, temp) {
    if (isHeaderTemp(temp)) {
        buf = concatBuffers([temp[2], buf]);
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
 * @param {Buffer|Uint8Array} buf 
 * @param {[number, number, Buffer|Uint8Array]} temp
 * @returns {IterableIterator<any>}
 */
function* decode(buf, temp) {
    // put the buffer into the temp
    if (temp.length === 0 || isHeaderTemp(temp)) {
        fillTemp(buf, temp);
    } else if (temp.length === 3) {
        temp[2] = concatBuffers([temp[2], buf]);
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
                yield decodeText(payload);
                break;

            case 2:
                yield Number(decodeText(payload));
                break;

            case 3:
                yield BigInt(decodeText(payload));
                break;

            case 4:
                yield Boolean(payload[0]);
                break;

            case 5:
                yield JSON.parse(decodeText(payload));
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
    let addListener = (fn, event, listener) => {
        if (event === "data") {
            let temp = [];
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

exports.encode = encode;
exports.decode = decode;
exports.wrap = wrap;