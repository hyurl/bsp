import { Stream } from "stream";

export declare function wrap<T extends Stream>(stream: T): T;
export declare function encode<T extends any>(...data: T[]): Buffer | Uint8Array;
export declare function decode<T extends any>(buf: Buffer | Uint8Array): T;
export declare function decode<T extends any>(buf: Buffer | Uint8Array, temp: any[]): IterableIterator<T>;

export declare class BSP {
    constructor(options: {
        objectSerializer: (obj: any) => string | Buffer | Uint8Array;
        objectDeserializer: (data: string | Buffer | Uint8Array) => any;
        /** @default "string" */
        serializationStyle?: "string" | "buffer";
    });
    encode<T extends any>(...data: T[]): Buffer | Uint8Array;
    decode<T extends any>(buf: Buffer | Uint8Array): T;
    decode<T extends any>(buf: Buffer | Uint8Array, temp: any[]): IterableIterator<T>;
    wrap<T extends Stream>(stream: T): T;
}