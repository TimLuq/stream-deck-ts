import { emit, EventEmitter } from "../event-emitter";
import { IMessagePort, IPostMessage } from "./hid-messageport";

import { Device } from "node-hid";

/**
 * Gets either a Worker or a SubProcess set up for communication.
 */
function getMessagePort(): Promise<IMessagePort> {
    return getMessagePortFunctions[hidAsyncType]();
}

export interface IHidAsyncEventEmitter {
    on(event: "data", listener: (data: Uint8Array) => any): this;
}

export type HidAsyncType = "auto" | "process" | "worker" | "emulated";

// const keepAlive = Symbol("keepAlive");
const isOpen = Symbol("isOpen");
const asyncCounter = Symbol("asyncCounter");
const connectedDeviceCount = Symbol("connectedDeviceCount");
// const connectedDeviceCountTotal = Symbol("connectedDeviceCountTotal");

/**
 * An async controller for a connected HID device.
 */
export class HidAsync extends EventEmitter implements IHidAsyncEventEmitter {
    private static [asyncCounter]: number = 0;
    // private static [connectedDeviceCountTotal]: number = 0;
    // private static [keepAlive]: any;
    private static readonly [connectedDeviceCount] = new Map<string, number>();

    protected readonly awaitingAsync = new Map<number, [(x: any) => void, (e: any) => void]>();
    protected messagePort: IPostMessage = undefined as any;
    protected [isOpen]: boolean = false;

    public constructor(protected readonly devicePath: string) {
        super();
        this.open();
    }

    /**
     * Read data from the device.
     */
    public read(): Promise<Uint8Array> {
        return this.postMessageAsync({ t: "r", p: this.devicePath });
    }

    public open() {
        if (this[isOpen]) {
            return false;
        }
        this[isOpen] = true;
        const portP = getMessagePort();
        this.messagePort = {
            postMessage(a, b) {
                return portP.then((x) => x.postMessage(a, b));
            },
        };
        portP.then((x) => {
            this.messagePort = x;
            x.on("message", (msg) => {
                if (msg.p === this.devicePath || (typeof msg.c === "number" && this.awaitingAsync.has(msg.c))) {
                    this.receiveMessage(msg);
                }
            });
        });
        const pc = HidAsync[connectedDeviceCount].get(this.devicePath);
        if (!pc) {
            this.messagePort.postMessage({ t: "n", d: this.devicePath });
        }
        HidAsync[connectedDeviceCount].set(this.devicePath, (pc || 0) + 1);
        // HidAsync[connectedDeviceCountTotal]++;
        /*
        if (HidAsync[keepAlive] === undefined) {
            HidAsync[keepAlive] = setInterval(() => {}, 10000000);
        }
        */
        return true;
    }

    /**
     * Closes the reference to this device.
     */
    public close(): false | undefined | Promise<true> {
        const pc = this[isOpen] && HidAsync[connectedDeviceCount].get(this.devicePath);
        if (pc) {
            // const t =
            // --HidAsync[connectedDeviceCountTotal];
            /*
            if (t === 0 && HidAsync[keepAlive] !== undefined) {
                clearInterval(HidAsync[keepAlive]);
                HidAsync[keepAlive] = undefined;
            }
            */
            if (pc === 1) {
                const r = this.postMessageAsync({ t: "c", p: this.devicePath });
                HidAsync[connectedDeviceCount].delete(this.devicePath);
                return r.then(() => true as true);
            } else {
                HidAsync[connectedDeviceCount].set(this.devicePath, (pc || 0) + 1);
                return false;
            }
        }
        return undefined;
    }

    /**
     * Write data to the device.
     * @param {Uint8Array} data data to asynchronously write to the device.
     */
    public write(data: Uint8Array): Promise<number> {
        return this.writeMulti([data]);
    }

    /**
     * Write multiple data blocks to the device.
     * @param {Uint8Array[]} datas data blocks to asynchronously write to the device.
     */
    public writeMulti(datas: Uint8Array[]): Promise<number> {
        const transferList = datas
            .map((data) => data && (data.buffer instanceof ArrayBuffer) ? data.buffer : undefined)
            .filter((x) => Boolean(x));
        return this.postMessageAsync({ t: "w", p: this.devicePath, d: datas }, transferList as ArrayBuffer[]);
    }

    /**
     * Write data to the device.
     * @param {Uint8Array} data data to asynchronously write to the device.
     */
    public sendFeatureReport(data: Uint8Array): Promise<number> {
        const transferList = data.buffer instanceof ArrayBuffer ? [ data.buffer ] : undefined;
        return this.postMessageAsync({ t: "f", p: this.devicePath, d: data }, transferList);
    }

    protected postMessageAsync<T extends {}, R>(data: T, transferList?: ArrayBuffer[]) {
        return new Promise<R>((res, rej) => {
            this.awaitingAsync.set(HidAsync[asyncCounter], [res, rej]);
            (data as any).c = HidAsync[asyncCounter];
            this.messagePort.postMessage(data, transferList);
            // tslint:disable-next-line:no-bitwise
            HidAsync[asyncCounter] = (HidAsync[asyncCounter] + 1) & 0x7FFFFFFF;
        });
    }

    protected receiveMessage(data: any) {
        if (data.p !== this.devicePath) {
            return;
        }
        const t = data.t;
        if (t === "e") {
            this[emit](data.e, data.d);
        } else if (t === "t") {
            if (typeof data.c === "number") {
                const resrej = this.awaitingAsync.get(data.c);
                if (resrej) {
                    this.awaitingAsync.delete(data.c);
                    resrej[1](data.d);
                }
                return;
            }
            // tslint:disable-next-line:no-console
            console.error(data.d);
        } else if (t === "v") {
            if (typeof data.c === "number") {
                const resrej = this.awaitingAsync.get(data.c);
                if (resrej) {
                    this.awaitingAsync.delete(data.c);
                    resrej[0](data.d);
                }
                return;
            }
            // tslint:disable-next-line:no-console
            console.error("Unhandeled result value #%d: %s", data.c, JSON.stringify(data.d));
        }
    }
}

let hidAsyncType: HidAsyncType = "auto";
export function setHidAsyncType(type: HidAsyncType) {
    if (!getMessagePortFunctions.hasOwnProperty(type)) {
        const o = JSON.stringify(Object.keys(getMessagePortFunctions));
        throw new TypeError("Invalid hidAsyncType " + JSON.stringify(type) + ", expected one of " + o);
    }
    hidAsyncType = type;
}

const asyncCache: { emulated?: IMessagePort; process?: IMessagePort; worker?: IMessagePort; } = {};

/**
 * Get a list of all devices.
 */
export function devices(): Promise<Device[]> {
    return getDevicesFunctions[hidAsyncType]();
}

const getDevicesFunctions = {
    /** try to start a worker or process, fallback to emulated */
    auto() {
        // TODO: currently node-hid crashes inside a worker context
        // try {
        //     return getDevicesFunctions.worker();
        // } catch (_) { /* do nothing */ }

        try {
            return getDevicesFunctions.process();
        } catch (_) { /* do nothing */ }

        return getDevicesFunctions.emulated();
    },
    emulated() {
        return import("./async/hid-async-emulated").then((x) => x.devices());
    },
    process() {
        return import("./async/hid-async-process").then((x) => x.devices());
    },
    worker() {
        return import("./async/hid-async-worker").then((x) => x.devices());
    },
};

const getMessagePortFunctions = {
    /** try to start a worker or process, fallback to emulated */
    auto() {
        // TODO: currently node-hid crashes inside a worker context
        // try {
        //     return getMessagePortFunctions.worker();
        // } catch (_) { /* do nothing */ }

        try {
            return getMessagePortFunctions.process();
        } catch (_) { /* do nothing */ }

        return getMessagePortFunctions.emulated();
    },
    emulated() {
        return asyncCache.emulated || (asyncCache.emulated = require("./async/hid-async-emulated").default());
    },
    process() {
        return asyncCache.process || (asyncCache.process = require("./async/hid-async-process").default());
    },
    worker() {
        return asyncCache.worker || (asyncCache.worker = require("./async/hid-async-worker").default());
    },
};
