/* global describe, it */
"use strict";

const bsp = require(".");
const assert = require("assert");
const fs = require("fs");
const net = require("net");

describe("Basic Socket Protocol", () => {
    it("should encode and decode string as expected", () => {
        let data = "Hello, World!";
        let buf = bsp.encode(data);
        let temp = [];
        let res = bsp.decode(buf, temp);
        let result;

        for (let pack of res) {
            result = pack;
        }

        assert.strictEqual(result, data);
    });

    it("should encode and decode number as expected", () => {
        let data = 12345;
        let buf = bsp.encode(data);
        let temp = [];
        let res = bsp.decode(buf, temp);
        let result;

        for (let pack of res) {
            result = pack;
        }

        assert.strictEqual(result, data);
    });

    it("should encode and decode bigint as expected", () => {
        if (typeof BigInt === "function") {
            let data = BigInt("12345");
            let buf = bsp.encode(data);
            let temp = [];
            let res = bsp.decode(buf, temp);
            let result;

            for (let pack of res) {
                result = pack;
            }

            assert.strictEqual(result, data);
        }
    });

    it("should encode and decode boolean as expected", () => {
        let data = true;
        let buf = bsp.encode(data);
        let temp = [];
        let res = bsp.decode(buf, temp);
        let result;

        for (let pack of res) {
            result = pack;
        }

        assert.strictEqual(result, data);
    });

    it("should encode and decode object as expected", () => {
        let data = { foo: "Hello", bar: "World" };
        let buf = bsp.encode(data);
        let temp = [];
        let res = bsp.decode(buf, temp);
        let result;

        for (let pack of res) {
            result = pack;
        }

        assert.deepStrictEqual(result, data);
    });

    it("should encode and decode null as expected", () => {
        let data = null;
        let buf = bsp.encode(data);
        let temp = [];
        let res = bsp.decode(buf, temp);
        let result;

        for (let pack of res) {
            result = pack;
        }

        assert.strictEqual(result, data);
    });

    it("should encode and decode buffer as expected", () => {
        let filename = __dirname + "/test.bin";
        let data = fs.readFileSync(filename);
        let buf = bsp.encode(data);
        let temp = [];
        let res = bsp.decode(buf, temp);
        let result;

        for (let pack of res) {
            result = pack;
        }

        assert(Buffer.compare(result, data) === 0);
    });

    it("should encode and decode Uint8Array as expected", () => {
        let filename = __dirname + "/test.bin";
        let data = Uint8Array.from(fs.readFileSync(filename));
        let buf = bsp.encode(data);
        let temp = [];
        let res = bsp.decode(buf, temp);
        let result;

        for (let pack of res) {
            result = pack;
        }

        assert.deepStrictEqual([...result], [...data]);
    });

    it("should encode and decode string larger then 255 bytes as expected", () => {
        let data = [
            "Prior to the introduction of TypedArray, ",
            "the JavaScript language had no mechanism for reading or ",
            "manipulating streams of binary data. The Buffer class was ",
            "introduced as part of the Node.js API to enable interaction ",
            "with octet streams in TCP streams, file system operations, ",
            "and other contexts."
        ].join("");
        let buf = bsp.encode(data);
        let temp = [];
        let res = bsp.decode(buf, temp);
        let result;

        for (let pack of res) {
            result = pack;
        }

        assert.deepStrictEqual(result, data);
    });

    it("should encode and decode string larger than 65535 bytes as expected", () => {
        let filename = __dirname + "/test.bin";
        let data = fs.readFileSync(filename, "utf8");
        let buf = bsp.encode(data);
        let temp = [];
        let res = bsp.decode(buf, temp);
        let result;

        for (let pack of res) {
            result = pack;
        }

        assert.strictEqual(result, data);
    });

    it("should encode and decode multiple pieces of data as expected", () => {
        let filename = __dirname + "/test.bin";
        let data = ["Hello, World!", 12345, true, false, null];
        let obj = { foo: "Hello, World", bar: ["an", "array"] };
        let arr = ["Hello", "World"];
        let file = fs.readFileSync(filename);
        let buf = bsp.encode(...data);
        let objBuf = bsp.encode(obj);
        let arrBuf = bsp.encode(arr);
        let fileBuf = bsp.encode(file);
        let temp = [];

        buf = Buffer.concat([buf, objBuf, arrBuf, fileBuf]);

        let buf0 = buf.slice(0, 2);
        let buf1 = buf.slice(2, 255);
        let buf2 = buf.slice(255, 65535);
        let buf3 = buf.slice(65535);
        let result = [];

        for (let pack of bsp.decode(buf0, temp)) {
            result.push(pack);
        }

        for (let pack of bsp.decode(buf1, temp)) {
            result.push(pack);
        }

        for (let pack of bsp.decode(buf2, temp)) {
            result.push(pack);
        }

        for (let pack of bsp.decode(buf3, temp)) {
            result.push(pack);
        }

        assert.deepStrictEqual(result.slice(0, 7), [...data, obj, arr]);
        assert.ok(0 === Buffer.compare(result.slice(7)[0], file));
    });

    it("should wrap net socket as expected", (done) => {
        let filename = __dirname + "/test.bin";
        let data = ["Hello, World!", 12345, true, false, null];
        let obj = { foo: "Hello, World", bar: ["an", "array"] };
        let arr = ["Hello", "World"];
        let file = fs.readFileSync(filename);

        let serverData = [];
        let clientData = [];
        let server = net.createServer(socket => {
            bsp.wrap(socket).on("data", data => {
                serverData.push(data);
                socket.write(data);
            });
        }).listen(13333);
        let socket = bsp.wrap(net.createConnection(13333));

        socket.on("data", data => {
            clientData.push(data);
        });

        data.forEach(socket.write);
        socket.write(obj);
        socket.write(arr);
        socket.write(file);

        setTimeout(() => {
            socket.end(() => {
                server.close(() => {
                    try {
                        let file1 = serverData.pop();
                        let file2 = clientData.pop();

                        assert.deepStrictEqual(serverData, [...data, obj, arr]);
                        assert.deepStrictEqual(clientData, [...data, obj, arr]);
                        assert(Buffer.compare(file1, file2) === 0);
                        assert(Buffer.compare(file1, file) === 0);
                        done();
                    } catch (err) {
                        done(err);
                    }
                });
            });
        }, 100);
    });

    it("should encode and decode a single segment as expected", () => {
        let data = "Hello, World!";
        let buf = bsp.encode(data);
        let result = bsp.decode(buf);

        assert.strictEqual(result, data);
    });

    it("should throw TypeError on unsupported type", () => {
        let err;

        try {
            bsp.encode(Symbol("SS"));
        } catch (e) {
            err = e;
        }

        assert.strictEqual(err.name, "TypeError");
    });
});