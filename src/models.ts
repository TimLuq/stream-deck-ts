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
