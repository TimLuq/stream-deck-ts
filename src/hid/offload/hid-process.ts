import { HidContainer } from "../hid-container";
import { IMessagePort } from "../hid-messageport";

const containers = new Map<string, HidContainer>();

let msgatt = false;
const parentPort: IMessagePort = {
    on(event: "message", listener: (message: any) => any) {
        if (!msgatt) {
            const f = (msg: any) => {
                if (msg.d && !(msg.d instanceof Uint8Array) && msg.d.type === "Buffer") {
                    msg.d = msg.d.data;
                }
                listener(msg);
            };
            process.on(event, f);
            msgatt = true;
        }
        process.on(event, listener);
        return this;
    },
    off(event: "message", listener: (message: any) => any) {
        process.off(event, listener);
        return this;
    },
    postMessage(data: any) {
        if (!process.send) {
            throw new Error("process.send is undefined");
        }
        process.send(data);
    },
};

parentPort.on("message", (msg: any) => {
    if (!msg.p && msg.t === "n" && typeof msg.d === "string" && !containers.has(msg.d)) {
        const hid = new HidContainer(msg.d, parentPort);
        containers.set(msg.d, hid);
        hid.init();
    } else if (!msg.p && msg.t === "d") {
        import("node-hid").then((hid) => {
            parentPort.postMessage({ t: "d", d: hid.devices() });
        });
    }
});

parentPort.postMessage({ t: "ready" });
