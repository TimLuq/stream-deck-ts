import { emit, EventEmitter } from "../../event-emitter";
import { HidContainer } from "../hid-container";
import { IMessagePort } from "../hid-messageport";

let hidCache: Promise<IMessagePort> | undefined;

export default async function hidAsyncWorker(): Promise<IMessagePort> {
    if (hidCache) {
        return hidCache;
    }

    // tslint:disable-next-line:max-classes-per-file
    class CustomMessagePort extends EventEmitter implements IMessagePort {
        public target: CustomMessagePort = undefined as any;
        public postMessage(data: any) {
            this.target[emit]("message", data);
        }
    }
    const containers = new Map<string, HidContainer>();
    const port0 = new CustomMessagePort();
    const port1 = new CustomMessagePort();
    port0.target = port1;
    port1.target = port0;
    port1.on("message", (msg: any) => {
        if (!msg.p && msg.t === "n" && typeof msg.d === "string" && !containers.has(msg.d)) {
            const Hid = require("../hid-container").HidContainer;
            const hid = new Hid(msg.d, port1);
            containers.set(msg.d, hid);
            hid.init();
        }
    });
    (port0 as any).containers = containers;
    Promise.resolve().then(() => port1.postMessage({t: "ready"}));
    return hidCache = Promise.resolve(port0);
}

export function devices() {
    return import("node-hid").then((hid) => hid.devices());
}
