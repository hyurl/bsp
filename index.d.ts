import { Stream } from "stream";

export declare function send<T extends any>(...data: T[]): Buffer;
export declare function receive<T extends any>(buf: Buffer, temp: any[]): IterableIterator<T>;
export declare function wrap<T extends Stream>(stream: T): T;