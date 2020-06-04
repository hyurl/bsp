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

    if (type > 6 || lenType > 3) {
        return false; // malformed/unencoded data
    }

    if (buf.byteLength < offset) {
        return null;  // header frame
    }

    if (lenType === 1) {
        length = buf[2];
    } else {
        let bin = "";
        let headEnd = lenType === 2 ? 4 : 10;

        for (let i = 2; i < headEnd; i++) {
            bin += sprintf("%08b", buf[i]);
        }

        length = parseInt(bin, 2);
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
 * @param {Function} deserialize
 * @param {"string" | "buffer"} serializationStyle
 * @returns {IterableIterator<any>}
 */
function* decodeSegment(buf, temp, deserialize, serializationStyle) {
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

            case 1: // string
                yield decodeText(payload);
                break;

            case 2: // number
                yield Number(decodeText(payload));
                break;

            case 3: // bigint
                yield BigInt(decodeText(payload));
                break;

            case 4: // boolean
                yield Boolean(payload[0]);
                break;

            case 5: // object
                if (serializationStyle === "string")
                    yield deserialize(decodeText(payload));
                else
                    yield deserialize(payload);
                break;

            case 6: // binary
                yield payload;
                break;

            default:
                throw TypeError(
                    `unknown payload type (${sprintf("%02X", type)})`);
        }

        if (buf.byteLength > 0) {
            fillTemp(buf, temp);
        } else {
            temp.splice(0, 3); // clean temp
        }
    }
}

class BSP {
    /**
     * @param {{
            objectSerializer: Function,
            objectDeserializer: Function,
            serializationStyle?: "string" | "buffer"
        }} options 
     */
    constructor(options) {
        this._serialize = options.objectSerializer;
        this._deserialize = options.objectDeserializer;
        this._serializationStyle = options.serializationStyle || "string";
    }

    encode(...data) {
        if (data.length === 0) {
            throw new SyntaxError("encode function requires at least one argument");
        }

        let buf = TypedArray.from([]);

        for (let payload of data) {
            let type = NaN;
            let _type = typeof payload;

            switch (_type) {
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
                case "undefined":
                    if (null === payload || undefined === payload) {
                        type = 0;
                        payload = TypedArray.from([]);
                    } else if (isBufferLike(payload)) {
                        type = 6; // raw data
                    } else {
                        type = 5;
                        payload = this._serialize(payload);

                        if (typeof payload === "string")
                            payload = encodeText(payload);
                    }
                    break;

                default:
                    throw new TypeError(`unsupported payload type (${_type})`);
            }

            let head = [type];
            let len = payload.byteLength;

            if (len <= 255) {
                head.push(1, len);
            } else {
                let binLen = len <= 65535 ? 16 : 64;
                let bin = sprintf(`%0${binLen}b`, len);

                head.push(len <= 65535 ? 2 : 3);

                for (let i = 0; i < binLen;) {
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
    decode(buf) {
        if (arguments.length === 2 && Array.isArray(arguments[1])) {
            return decodeSegment(
                buf, arguments[1],
                this._deserialize,
                this._serializationStyle
            );
        } else {
            return decodeSegment(
                buf,
                [],
                this._deserialize,
                this._serializationStyle
            ).next().value;
        }
    }

    wrap(stream) {
        let _write = stream.write.bind(stream);
        let _on = stream.on.bind(stream);
        let _once = stream.once.bind(stream);
        let _prepend = stream.prependListener.bind(stream);
        let _prependOnce = stream.prependOnceListener.bind(stream);
        let addListener = (fn, event, listener) => {
            if (event === "data") {
                let temp = [];
                let _listener = (buf) => {
                    for (let data of this.decode(buf, temp)) {
                        listener(data);
                    }
                };
                return fn("data", _listener);
            } else {
                return fn(event, listener);
            }
        };

        stream.write = (chunk, encoding, callback) => {
            return _write(this.encode(chunk), encoding, callback);
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
}

const BSPStatic = new BSP({
    objectSerializer: JSON.stringify,
    objectDeserializer: JSON.parse
});

exports.BSP = BSP;
exports.encode = BSPStatic.encode.bind(BSPStatic);
exports.decode = BSPStatic.decode.bind(BSPStatic);
exports.wrap = BSPStatic.wrap.bind(BSPStatic);