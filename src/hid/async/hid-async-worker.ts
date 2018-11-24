import { Device } from "node-hid";

import { resolve } from "path";

import { IMessagePort } from "../hid-messageport";

interface IWorkerMessagePort extends IMessagePort {
    worker: any;
}

let hidCache: Promise<IMessagePort> | undefined;

export default async function hidAsyncWorker(): Promise<IMessagePort> {
    if (hidCache) {
        return hidCache;
    }
    const { Worker } = await import("worker_threads" as any);
    const worker = new Worker(resolve(__dirname, "..", "offload", "hid-worker.js"));
    // tslint:disable-next-line:ban-types
    const funcmods = new Set<string>();
    const mp: IWorkerMessagePort = {
        worker,
        on(event: "message", listener: (message: any) => any) {
            if (event === "message" && funcmods.has(event)) {
                const f = (msg: any) => {
                    if (msg.d && !(msg.d instanceof Uint8Array) && msg.d.type === "Buffer") {
                        msg.d = new Uint8Array(msg.d.data);
                    }
                    listener(msg);
                };
                this.worker.on(event, f);
            }
            this.worker.on(event, listener);
            return this;
        },
        off(event: "message", listener: (message: any) => any) {
            this.worker.off(event, listener);
            return this;
        },
        postMessage(data: any, transferList?: ArrayBuffer[]) {
            this.worker.postMessage(data, transferList);
        },
    };
    return hidCache = new Promise<IMessagePort>((res, rej) => {
        const f = (m: any) => {
            worker.off("message", f);
            if (m && m.t === "ready") {
                res(mp);
            } else {
                rej(new Error("Unexpected response: " + JSON.stringify(m)));
            }
        };
        worker.on("message", f);
    });
}

export async function devices() {
    const port = await hidAsyncWorker();
    return new Promise<Device[]>((res) => {
        const f = (msg: any) => {
            if (msg.t === "d" && msg.d) {
                res(msg.d);
                port.off("message", f);
            }
        };
        port.on("message", f);
        port.postMessage({ t: "d" });
    });
}
