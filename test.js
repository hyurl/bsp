"use strict";

const bsp = require(".");
const assert = require("assert");

describe("Basic Socket Protocol", () => {
    it("should encode data to buffer and decode complete data as expected", () => {
        var data = ["a string", ["an", "array"]],
            buf = bsp.send.apply(void 0, data),
            remains = [],
            res = bsp.receive(buf, remains);

        for (let part of res) {
            assert.deepStrictEqual(part, data);
        }
    });

    it("should encode data to buffer and decode incomplete data as expected", () => {
        var data = [["a string", ["an", "array"]], ["another string"]],
            buf = bsp.send.apply(void 0, data[0]),
            buf2 = bsp.send.apply(void 0, data[1]),
            buf3 = Buffer.concat([buf, buf2]),
            index = buf.byteLength + 2,
            remains = [],
            i = 0;

        for (let part of bsp.receive(buf3.slice(0, index), remains)) {
            assert.deepStrictEqual(part, data[i]);
            i++;
        }

        assert.strictEqual(remains[0].byteLength, 2);

        for (let part of bsp.receive(buf3.slice(index), remains)) {
            assert.deepStrictEqual(part, data[i]);
            i++;
        }

        assert.strictEqual(remains[0].byteLength, 0);
    });
});