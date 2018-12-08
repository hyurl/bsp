export declare function send<T extends Array<any>>(...data: T): Buffer;
export declare function receive<T extends Array<any>>(buf: Buffer, remains: Buffer[]): IterableIterator<T>;