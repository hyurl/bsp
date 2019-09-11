"use strict";

const bsp = require(".");
const assert = require("assert");
const fs = require("fs");

describe("Basic Socket Protocol", () => {
    it("should encode and decode string as expected", () => {
        let data = "Hello, World!";
        let buf = bsp.send(data);
        let temp = [];
        let res = bsp.receive(buf, temp);
        let result;

        for (let pack of res) {
            result = pack;
        }

        assert.strictEqual(result, data);
    });

    it("should encode and decode number as expected", () => {
        let data = 12345;
        let buf = bsp.send(data);
        let temp = [];
        let res = bsp.receive(buf, temp);
        let result;

        for (let pack of res) {
            result = pack;
        }

        assert.strictEqual(result, data);
    });

    it("should encode and decode bigint as expected", () => {
        if (typeof BigInt === "function") {
            let data = BigInt("12345");
            let buf = bsp.send(data);
            let temp = [];
            let res = bsp.receive(buf, temp);
            let result;

            for (let pack of res) {
                result = pack;
            }

            assert.strictEqual(result, data);
        }
    });

    it("should encode and decode boolean as expected", () => {
        let data = true;
        let buf = bsp.send(data);
        let temp = [];
        let res = bsp.receive(buf, temp);
        let result;

        for (let pack of res) {
            result = pack;
        }

        assert.strictEqual(result, data);
    });

    it("should encode and decode object as expected", () => {
        let data = { foo: "Hello", bar: "World" };
        let buf = bsp.send(data);
        let temp = [];
        let res = bsp.receive(buf, temp);
        let result;

        for (let pack of res) {
            result = pack;
        }

        assert.deepStrictEqual(result, data);
    });

    it("should encode and decode null as expected", () => {
        let data = null;
        let buf = bsp.send(data);
        let temp = [];
        let res = bsp.receive(buf, temp);
        let result;

        for (let pack of res) {
            result = pack;
        }

        assert.strictEqual(result, data);
    });

    it("should encode and decode buffer as expected", () => {
        let filename = __dirname + "/buffer.html";
        let data = fs.readFileSync(filename);
        let buf = bsp.send(data);
        let temp = [];
        let res = bsp.receive(buf, temp);
        let result;

        for (let pack of res) {
            result = pack;
        }

        assert(Buffer.compare(result, data) === 0);
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
        let buf = bsp.send(data);
        let temp = [];
        let res = bsp.receive(buf, temp);
        let result;

        for (let pack of res) {
            result = pack;
        }

        assert.deepStrictEqual(result, data);
    });

    it("should encode and decode string larger than 65535 bytes as expected", () => {
        let filename = __dirname + "/buffer.html";
        let data = fs.readFileSync(filename, "utf8");
        let buf = bsp.send(data);
        let temp = [];
        let res = bsp.receive(buf, temp);
        let result;

        for (let pack of res) {
            result = pack;
        }

        assert.strictEqual(result, data);
    });

    it("should encode and decode multiple pieces of data as expected", () => {
        let filename = __dirname + "/buffer.html";
        let data = ["Hello, World!", 12345, true, false, null];
        let obj = { foo: "Hello, World", bar: ["an", "array"] };
        let arr = ["Hello", "World"];
        let file = fs.readFileSync(filename)
        let buf = bsp.send(...data);
        let objBuf = bsp.send(obj);
        let arrBuf = bsp.send(arr);
        let fileBuf = bsp.send(file);
        let temp = [];

        buf = Buffer.concat([buf, objBuf, arrBuf, fileBuf]);

        let buf1 = buf.slice(0, 255);
        let buf2 = buf.slice(255, 65535);
        let buf3 = buf.slice(65535);
        let result = [];

        for (let pack of bsp.receive(buf1, temp)) {
            result.push(pack);
        }

        for (let pack of bsp.receive(buf2, temp)) {
            result.push(pack);
        }

        for (let pack of bsp.receive(buf3, temp)) {
            result.push(pack);
        }

        assert.deepStrictEqual(result.slice(0, 7), [...data, obj, arr]);
        assert.ok(0 === Buffer.compare(result.slice(7)[0], file));
    });
});