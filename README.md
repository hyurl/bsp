# Basic Socket Protocol

## install

```
npm i bsp
```

## Purpose

To transfer as many types of data as possible in NodeJS and automatically handle
incomplete data.

## Usage

```javascript
import * as net from "net";
import { send, receive } from "bsp";

var server = net.createServer(socket => {
    let remains = []; // a container to store remaining/incomplete data.

    socket.on("data", buf => {
        for (let [msg] of receive(buf, remains)) {
            // the first message would be 'Hello, World!'
        }
    });
});

server.listen(8000, () => {
    var socket = net.createConnection(8000);

    socket.on("connect", () => {
        socket.write(send("Hello, World!"));
    });
});
```

## API

- `send(...data: any[]): Buffer`
- `receive(buf: Buffer, remains: Buffer[]): IterableIterator<any[]>`