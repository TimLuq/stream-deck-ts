export const VENDOR_ELGATO = 0x0fd9;
export const PRODUCT_ELGATO_STREAMDECK = 0x0060;
export const PRODUCT_ELGATO_STREAMDECK_MINI = 0x0063;
export const DEVICE_MODELS_KNOWN = {
    [VENDOR_ELGATO]: {
        [PRODUCT_ELGATO_STREAMDECK]: "./models/elgato-stream-deck",
        [PRODUCT_ELGATO_STREAMDECK_MINI]: "./models/elgato-stream-deck-mini",
    },
};
export const DEVICE_MODELS: { [vendor: number]: { [product: number]: string; } } & typeof DEVICE_MODELS_KNOWN
    = Object.keys(DEVICE_MODELS_KNOWN)
        .reduce((p: any, k) => {
            p[k] = { ...(DEVICE_MODELS_KNOWN as any)[k] };
            return p;
        }, {});
