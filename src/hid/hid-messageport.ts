
export interface IPostMessage {
    postMessage(data: any, transferList?: ArrayBuffer[]): void;
}

export interface IMessagePort extends IPostMessage {
    on(event: "message", listener: (message: any) => any): this;
    off(event: "message", listener: (message: any) => any): this;
}
