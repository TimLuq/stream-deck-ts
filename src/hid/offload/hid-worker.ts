import { HidContainer } from "../hid-container";

// tslint:disable-next-line:no-var-requires
const { parentPort } = require("worker_threads");

const containers = new Map<string, HidContainer>();

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
