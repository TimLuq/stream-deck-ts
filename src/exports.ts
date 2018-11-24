import { devices } from "./hid/hid-async";
import { DEVICE_MODELS } from "./models";
import { StreamDeck as StreamDeckImpl } from "./stream-deck";

export { IImageLibrary, IImageLibraryCreator, IImageLibraryExtract, IImageRawOptions } from "./image-library";

export { devices, setHidAsyncType, HidAsyncType } from "./hid/hid-async";

export * from "./models";

// tslint:disable-next-line:no-empty-interface interface-name
export interface StreamDeck extends StreamDeckImpl {
    on(event: "down" | "up", cb: (keyIndex: number) => any): this;
    on(event: "error", cb: (err: Error) => any): this;
    once(event: "down" | "up", cb: (keyIndex: number) => any): this;
    once(event: "error", cb: (err: Error) => any): this;
    off(event: "down" | "up", cb: (keyIndex: number) => any): this;
    off(event: "error", cb: (err: Error) => any): this;
}

/**
 * Select the first identified `StreamDeck`.
 * Optional vendor and product id could be used to narrow the search to a specific device.
 *
 * @param {number?} vendor optional vendor identity number
 * @param {number?} product optional product identity number
 * @returns {Promise<StreamDeck>?} the first supported `StreamDeck` within the vendor and product search space, or null
 */
export async function selectDevice(vendor?: number, product?: number): Promise<StreamDeck | null> {
    const devs = await devices();
    for (const device of devs) {
        if (vendor === undefined || vendor === device.vendorId) {
            const models = DEVICE_MODELS[device.vendorId];
            if (models) {
                if (product === undefined || product === device.productId) {
                    const productModule = models[device.productId];
                    if (productModule) {
                        const m = await import(productModule.import);
                        return new m.default(device.path);
                    } else if (product !== undefined) {
                        const m = "No implementations for the product " + product + " of vendor " + vendor;
                        const e = new Error(m);
                        (e as any).code = "STRMDCK_MISSING_PRODUCT";
                        throw e;
                    }
                }
            } else if (vendor !== undefined) {
                const m = "No implementations for any product of vendor " + vendor;
                const e = new Error(m);
                (e as any).code = "STRMDCK_MISSING_VENDOR";
                throw e;
            }
        }
    }
    return null;
}

/**
 * Select all the identified `StreamDeck`s.
 * Optional vendor and product id could be used to narrow the search to range of devices.
 *
 * @param {number?} vendor optional vendor identity number
 * @param {number?} product optional product identity number
 * @returns {Array<Promise<StreamDeck>>} a list of promises to `StreamDeck`s within the vendor and product search space
 */
export async function selectAllDevices(vendor?: number, product?: number): Promise<Array<Promise<StreamDeck>>> {
    const res: Array<Promise<StreamDeck>> = [];
    const devs = await devices();
    for (const device of devs) {
        if (vendor === undefined || vendor === device.vendorId) {
            const models = DEVICE_MODELS[device.vendorId];
            if (models) {
                if (product === undefined || product === device.productId) {
                    const productModule = models[device.productId];
                    if (productModule) {
                        res.push(import(productModule.import).then((m) => new m.default(device.path)));
                    } else if (product !== undefined) {
                        const m = "No implementations for the product " + product + " of vendor " + vendor;
                        const e = new Error(m);
                        (e as any).code = "STRMDCK_MISSING_PRODUCT";
                        throw e;
                    }
                }
            } else if (vendor !== undefined) {
                const m = "No implementations for any product of vendor " + vendor;
                const e = new Error(m);
                (e as any).code = "STRMDCK_MISSING_VENDOR";
                throw e;
            }
        }
    }
    return res;
}
