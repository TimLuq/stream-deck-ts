export interface IStreamDeckMetaData {
    import: string;
    productName: string;
    vendorName: string;
}

export interface IStreamDeckDevices {
    [vendor: number]: {
        [product: number]: IStreamDeckMetaData;
    };
}

export const VENDOR_ELGATO = 0x0fd9;
export const PRODUCT_ELGATO_STREAMDECK = 0x0060;
export const PRODUCT_ELGATO_STREAMDECK_MINI = 0x0063;

const DEVICE_MODELS_KNOWN = {
    [VENDOR_ELGATO]: {
        [PRODUCT_ELGATO_STREAMDECK]: {
            import: "./models/elgato-stream-deck",
            productName: "Stream Deck",
            vendorName: "Elgato",
        },
        [PRODUCT_ELGATO_STREAMDECK_MINI]: {
            import: "./models/elgato-stream-deck-mini",
            productName: "Stream Deck Mini",
            vendorName: "Elgato",
        },
    },
};
export const DEVICE_MODELS: IStreamDeckDevices & typeof DEVICE_MODELS_KNOWN
    = Object.keys(DEVICE_MODELS_KNOWN)
        .reduce((p: any, k) => {
            p[k] = { ...(DEVICE_MODELS_KNOWN as any)[k] };
            return p;
        }, {});

/**
 * Register a `StreamDeck` compatable product.
 *
 * @param {number} vendor The numeric vendorId of the product.
 * @param {number} product The numeric productId of the product.
 * @param {Object} config The metadata descriptor for the product.
 * @returns {?Object} undefined, or the previous configuration if one existed.
 */
export function registerStreamDeckProduct(vendor: number, product: number,
                                          config: IStreamDeckMetaData,
): IStreamDeckMetaData | undefined {
    if (!DEVICE_MODELS[vendor]) {
        DEVICE_MODELS[vendor] = {};
    }
    const prev = DEVICE_MODELS[vendor][product];
    DEVICE_MODELS[vendor][product] = config;
    return prev;
}

/**
 * Get a previously registered `StreamDeck` compatable product.
 *
 * @param {number} vendor The numeric vendorId of the product.
 * @param {number} product The numeric productId of the product.
 * @returns {?Object} undefined, or the configuration if one existed.
 */
export function getStreamDeckProduct(vendor: number, product: number): IStreamDeckMetaData | undefined {
    if (!DEVICE_MODELS[vendor]) {
        return undefined;
    }
    return DEVICE_MODELS[vendor][product];
}
