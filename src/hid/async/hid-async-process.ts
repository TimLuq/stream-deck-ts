import { Device } from "node-hid";

import { resolve } from "path";

import { IMessagePort } from "../hid-messageport";

interface IProcessMessagePort extends IMessagePort {
    process: any;
}

let cachedProcess: Promise<IMessagePort> | undefined;

export default async function hidAsyncProcess(): Promise<IMessagePort> {
    if (cachedProcess) {
        return cachedProcess;
    }
    const fork = await import("child_process").then((m) => m.fork);
    const proc = fork(resolve(__dirname, "..", "offload", "hid-process"));
    // tslint:disable-next-line:ban-types
    const funcmods = new Set<string>();
    const mp: IProcessMessagePort = {
        process: proc,
        on(event: "message", listener: (message: any) => any) {
            if (event === "message" && !funcmods.has(event)) {
                const f = (msg: any) => {
                    if (msg.d && !(msg.d instanceof Uint8Array) && msg.d.type === "Buffer") {
                        msg.d = new Uint8Array(msg.d.data);
                    }
                };
                funcmods.add(event);
                this.process.on(event, f);
            }
            this.process.on(event, listener);
            return this;
        },
        off(event: "message", listener: (message: any) => any) {
            this.process.off(event, listener);
            return this;
        },
        postMessage(data: any) {
            if (data && data.d) {
                if (data.d instanceof Uint8Array) {
                    data.d = Array.from(data.d);
                } else if (Array.isArray(data.d) && data.d.length) {
                    data.d = data.d.map((x: any) => x instanceof Uint8Array ? Array.from(x) : x);
                }
            }
            this.process.send(data);
        },
    };
    return cachedProcess = new Promise<IMessagePort>((res, rej) => {
        const f = (m: any) => {
            proc.off("message", f);
            if (m && m.t === "ready") {
                res(mp);
            } else {
                rej(new Error("Unexpected response: " + JSON.stringify(m)));
            }
        };
        proc.on("message", f);
        proc.once("error", (err) =>  rej(err));
    });
}

export async function devices() {
    const port = await hidAsyncProcess();
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
