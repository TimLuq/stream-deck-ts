import { devices } from "node-hid";
import { DEVICE_MODELS } from "./models";
import { StreamDeck as StreamDeckImpl } from "./stream-deck";

// tslint:disable-next-line:no-empty-interface interface-name
export interface StreamDeck extends StreamDeckImpl {}

export function selectDevice(vendor?: number, product?: number): StreamDeck | null {
    for (const device of devices()) {
        if (vendor === undefined || vendor === device.vendorId) {
            const models = DEVICE_MODELS[device.vendorId];
            if (models) {
                if (product === undefined || product === device.productId) {
                    const productModule = models[device.productId];
                    if (productModule) {
                        return new (require(productModule).default)(device.path);
                    } else if (product !== undefined) {
                        const m = "No implmentations for the product " + product + " of vendor " + vendor;
                        const e = new Error(m);
                        (e as any).code = "STRMDCK_MISSING_PRODUCT";
                        throw e;
                    }
                }
            } else if (vendor !== undefined) {
                const m = "No implmentations for any product of vendor " + vendor;
                const e = new Error(m);
                (e as any).code = "STRMDCK_MISSING_VENDOR";
                throw e;
            }
        }
    }
    return null;
}

export function selectAllDevices(vendor?: number, product?: number): StreamDeck[] {
    const res: StreamDeck[] = [];
    for (const device of devices()) {
        if (vendor === undefined || vendor === device.vendorId) {
            const models = DEVICE_MODELS[device.vendorId];
            if (models) {
                if (product === undefined || product === device.productId) {
                    const productModule = models[device.productId];
                    if (productModule) {
                        res.push(new (require(productModule).default)(device.path));
                    } else if (product !== undefined) {
                        const m = "No implmentations for the product " + product + " of vendor " + vendor;
                        const e = new Error(m);
                        (e as any).code = "STRMDCK_MISSING_PRODUCT";
                        throw e;
                    }
                }
            } else if (vendor !== undefined) {
                const m = "No implmentations for any product of vendor " + vendor;
                const e = new Error(m);
                (e as any).code = "STRMDCK_MISSING_VENDOR";
                throw e;
            }
        }
    }
    return res;
}
