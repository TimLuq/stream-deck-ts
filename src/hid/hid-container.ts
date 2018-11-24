import { HID } from "node-hid";
import { IMessagePort } from "./hid-messageport";

export class HidContainer {
    protected readonly device: HID;
    public constructor(protected readonly devicePath: string, protected readonly messagePort: IMessagePort) {
        this.device = new HID(devicePath);
    }

    public init() {
        this.device.on("data", (val) => {
            const uarr = val instanceof Uint8Array ? val : new Uint8Array(val);
            this.messagePort.postMessage(
                { t: "e", e: "data", p: this.devicePath, d: uarr },
                [uarr.buffer as ArrayBuffer],
            );
        });
        this.device.on("error", (val) => {
            this.messagePort.postMessage({ t: "e", e: "error", p: this.devicePath, d: val });
        });
        this.messagePort.on("message", (msg) => {
            if (msg.p === this.devicePath) {
                this.onMessage(msg);
            }
        });
    }

    protected onMessage(data: any) {
        const t = data.t;
        try {
            if (t === "w") {
                let r = 0;
                let brk = false;
                // tslint:disable-next-line:no-console
                // console.warn(typeof data.d, data.d);
                for (const d of data.d) {
                    const a: number[] = Array.isArray(d) ? d : Array.from(d);
                    for (let n = 0; n < a.length; ) {
                        const m = this.device.write(n ? a.slice(n) : a);
                        if (m <= 0) {
                            brk = true;
                            break;
                        }
                        n += m;
                        r += m;
                    }
                    if (brk) {
                        break;
                    }
                }
                if (typeof data.c === "number") {
                    this.messagePort.postMessage({ t: "v", p: this.devicePath, c: data.c, d: r });
                }
            } else if (t === "f") {
                const r = this.device.sendFeatureReport(Array.from(data.d));
                if (typeof data.c === "number") {
                    this.messagePort.postMessage({ t: "v", p: this.devicePath, c: data.c, d: r });
                }
            } else if (t === "c") {
                this.device.close();
                if (typeof data.c === "number") {
                    this.messagePort.postMessage({ t: "c", p: this.devicePath, c: data.c });
                }
            } else if (t === "r") {
                this.device.read((err, rdat: Uint8Array | ArrayLike<number>) => {
                    if (typeof data.c === "number") {
                        if (err) {
                            const m = { t: "t", p: this.devicePath, c: data.c, d: err && err.stack };
                            this.messagePort.postMessage(m);
                        } else {
                            const uarr = rdat instanceof Uint8Array ? rdat : new Uint8Array(rdat);
                            const m = { t: "v", p: this.devicePath, c: data.c, d: uarr };
                            this.messagePort.postMessage(m, [uarr.buffer as ArrayBuffer]);
                        }
                    } else if (err) {
                        // tslint:disable-next-line:no-console
                        console.error(err);
                    }
                });
            } else {
                throw new Error("Unknown message type: " + JSON.stringify(t));
            }
        } catch (e) {
            // tslint:disable-next-line:no-console
            console.error("HID Error:", e, data);
            if (typeof data.c === "number") {
                this.messagePort.postMessage({ t: "t", p: this.devicePath, c: data.c, d: e });
            }
        }
    }
}
