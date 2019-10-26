# Basic Socket Protocol

Node.js provides a very simple and efficient way to transmit data over sockets,
at least that's what we've told ourselves. But let's face the fact, it sucks.

Look at the following example, we're expecting the socket would send and receive
data separately, piece by piece. However, they will be stuck together.

```js
const net = require("net");

var server = net.createServer(socket => {
    socket.on("data", buf => {
        console.log(buf.toString("utf8"));
    });
}).listen(4000);

var socket = net.createConnection(4000);

socket.write("Hello, World!");
socket.write("Hi, Mr. World!");

// We expected the output would be:
// => Hello, World!
// => Hi, Mr. World!

// However the actual output will be:
// => Hello, World!Hi, Mr. World!
```

Apparently that's not what we wanted, but that's how Node.js handles socket
messages, all data will be buffered (for efficiency concerns), and we have no
idea when they're going to be flushed.

So to solve this problem, a higher level protocol must be added to the socket,
and **bsp** is meant to do that. It will encode the message sent over the socket
(or any other kind of streams), padding the message type and length before the
actual payload, and decode the data on the receiving end, so that to guarantee
the continuous messages can be retrieved properly, one by one.

## Example

```js
const net = require("net");
const bsp = require("bsp");

var server = net.createServer(socket => {
    bsp.wrap(socket).on("data", msg => {
        console.log(msg);
    });
}).listen(4000);

var socket = bsp.wrap(net.createConnection(4000));

socket.write("Hello, World!");
socket.write("Hi, Mr. World!");

// Now the output would be what we expected:
// => Hello, World!
// => Hi, Mr. World!
```

## Why Not Using Delimiters

Some people may suggest adding delimiters fore each message, but it's very lame
and problematic, for example when sending a very large file in binary (buffer),
the socket may cut down the buffer and send partially at a time, or even more
complex scenario that the file is sent with a string message, and the first
chunk of the file is stuck with the string. Using a delimiter will be very
inefficient in such cases, the program have to scan the whole chunk to see if
there is a delimiter, and it want be acknowledged whether the chunk is a string,
or a buffer, since all data will be transmit in buffer.

## BSP Solution

The Basic Socket Protocol, however, will pad three marks ahead of each the
message, to tell the type and length of the buffer, there would be no scanning
looking fore any delimiter, only the heading marks will be checked. If the
receiving payload suits than the length mark, it will be decoded according to
the type mark, otherwise the decode function will buffer the data and wait for 
more data in order to decode.

### Protocol Fragments

1. `type` A mark of number indicates the data type of the payload.
    1. `0` null (as in empty buffer)
    2. `1` string (as in string)
    3. `2` number (as in string)
    4. `3` bigint (as in string)
    5. `4` boolean (as in buffer of number `0` and `1`)
    6. `5` object (as in json string)
    7. `6` binary (as in Buffer for Node.js and Uint8Array for Browsers)

2. `lengthType` A secondary type in number indicates the type of length mark.
    1. `1` payload length between 0 - 255.
    2. `2` payload length between 256 - 65535.
    3. `3` payload length larger than 65535.

3. `length` According to different `lengthType`. the marks of payload length is
    different.
    1. If `lengthType` is `1`, `length` is a mark of number between 0 - 255.
    2. If `lengthType` is `2`, `legnth` is a mark of two numbers, each of them
        is between 0 - 255.
    3. If `lengthType` is `3`, `length` is a mark of 8 numbers, each of them is
        between 0 - 255.

4. `payload` The actual message to be transmitted.

#### More Details

1. All messages will be encoded into buffer before transmit, regardless of the 
    original type or catted type.
2. To calculate `length` mark of the payload, except length type `1` (length 
    between 0 - 255), the others will be converted to binary strings and split 
    into 8-bit length chunks, then converted to numbers between 0 - 255.

## API

- `wrap<T extends Stream>(stream: T): T`
- `encode(...data: any[]): Buffer | Uint8Array`
- `decode`
    - `(buf: Buffer | Uint8Array) => any`
    - `(buf: Buffer | Uint8Array, temp: any[]) => IterableIterator<any>`

Most of the time, just use `wrap()` to automatically wrap the stream/socket
object, all data will be automatically encoded and decoded without any headache.
However if you want to explore the other two functions, this is how:

```js
const net = require("net");
const bsp = require("bsp");

var server = net.createServer(socket => {
    let temp = [];
    socket.on("data", buf => {
        for (let msg of bsp.decode(buf, temp)) {
            console.log(msg);
        }
    });
}).listen(4000);

var socket = bsp.wrap(net.createConnection(4000));

socket.write(bsp.encode("Hello, World!"));
socket.write(bsp.encode("Hi, Mr. World!"));
```

**NOTE:** an empty array of `temp` argument must be provided in order to receive
and decode truncated data, and cannot be mutated by any other means. If this
argument is not provided, the decode function will only parse and return the
first chunk of the data decoded.