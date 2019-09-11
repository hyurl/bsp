export declare function send<T extends any>(...data: T[]): Buffer;
export declare function receive<T extends any>(buf: Buffer, temp: any[]): IterableIterator<T>;