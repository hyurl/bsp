# Basic Socket Protocol

## install

```
npm i bsp
```

## Usage

```javascript
import * as net from "net";
import { send, receive } from "bsp";

var server = net.createServer(socket => {
    let temp = []; // a container to store incomplete data.

    socket.on("data", buf => {
        for (let [msg] of receive(buf, temp)) {
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
- `receive(buf: Buffer, temp: Buffer[]): IterableIterator<any[]>`

## Notice

Due to performance and compatibility considerations, this module (since version 
0.2) uses *JSON* to transfer data instead.