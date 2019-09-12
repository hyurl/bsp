import { Stream } from "stream";

export default wrap;
export declare function wrap<T extends Stream>(stream: T): T;
export declare function encode<T extends any>(...data: T[]): Buffer;
export declare function decode<T extends any>(buf: Buffer, temp: any[]): IterableIterator<T>;
/** @deprecated synonym of `encode`. */
export declare function send<T extends any>(...data: T[]): Buffer;
/** @deprecated synonym of `decode`. */
export declare function receive<T extends any>(buf: Buffer, temp: any[]): IterableIterator<T>;