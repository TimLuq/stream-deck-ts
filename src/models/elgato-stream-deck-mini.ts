
import { StreamDeck } from "../stream-deck";

import { IImageLibrary } from "../image-library";

const NUM_PIXELS_PG0_BYTES = 0x03c3;
const NUM_TOTAL_PIXEL_BYTES = 80 * 80 * 3;

export const DEV_VENDOR  = 0x0fd9;
export const DEV_PRODUCT = 0x0063;

export default class ElgatoStreamDeckMini extends StreamDeck {
    public readonly iconSize = 80;
    public readonly buttonColumns = 3;
    public readonly buttonRows = 2;
    public readonly buttonLength = 2 * 3;
    public readonly buttonLayout = [
        [ 0,  1,  2],
        [ 3,  4,  5],
    ];
    protected readonly pagePacketSize = 1024;

    public constructor(devicePath: string) {
        super(devicePath);
    }

    public fillImage(keyIndex: number, imageBuffer: Uint8Array) {
        this.checkValidKeyIndex(keyIndex);

        const iconWidth = this.iconSize;
        const iconHeight = this.iconSize;
        const area = iconWidth * iconHeight;
        const areadepth = area * 3;

        if (imageBuffer.length !== areadepth) {
            throw new RangeError(`Expected image buffer of length ${areadepth}, got length ${imageBuffer.length}`);
        }

        const pixels = Buffer.alloc(area * 3);
        const l = iconWidth * 3;
        for (let y = 0; y < iconHeight; y++) {
            for (let x = 0; x < iconWidth; x++) {
                const x3 = x * 3;
                const y3 = y * 3;
                const lx = l * x;
                const lxY3 = lx + y3;
                const ly = l * y;
                const lyX3 = ly + l - x3 - 3;
                const r = imageBuffer[lyX3];
                const g = imageBuffer[lyX3 + 1];
                const b = imageBuffer[lyX3 + 2];
                pixels[lxY3] = b;
                pixels[lxY3 + 1] = g;
                pixels[lxY3 + 2] = r;
            }
        }

        return this.writeImagePage(keyIndex, pixels);
    }

    protected writeImagePage(keyIndex: number, pixels: Uint8Array) {
        if (pixels.length !== NUM_TOTAL_PIXEL_BYTES) {
            throw Error("Unexpected amounts of bytes, got " + pixels + " but expected " + NUM_TOTAL_PIXEL_BYTES);
        }
        this._writePage0(keyIndex, pixels);
        const header = new Uint8Array([
            0x02, 0x01, 0x00, 0x00, 0x00, keyIndex + 1, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        ]);
        const hdrlen = header.length;
        const pcklen = this.pagePacketSize;
        const pxllen = pcklen - hdrlen;
        const ret: Uint8Array[] = [];
        for (let i = 1, pxlusd = NUM_PIXELS_PG0_BYTES; pxlusd < NUM_TOTAL_PIXEL_BYTES; i++) {
            const packet = new Uint8Array(pcklen);
            packet.set(header);
            packet[2] = i;
            const after = pxlusd + pxllen;
            if (after >= NUM_TOTAL_PIXEL_BYTES) {
                packet[4] = 1; // end signal on last packet
                packet.set(pixels.subarray(pxlusd, NUM_TOTAL_PIXEL_BYTES), hdrlen);
                packet.fill(0, hdrlen + NUM_TOTAL_PIXEL_BYTES - pxlusd);
            } else {
                packet.set(pixels.subarray(pxlusd, after), hdrlen);
            }
            pxlusd = after;
            ret.push(packet);
        }

        return this.writeMulti(ret);
    }

    protected async processImage(image: IImageLibrary): Promise<Uint8Array> {
        const img0 = await image.flatten(); // Eliminate alpha channel, if any.
        const img1 = await img0.resize(72, 72);
        const img72 = await img1.toUint8Array();

        // center in a 4px black border
        const hoff = 4 * 3;
        const row72 = 72 * 3;
        const rowlen = this.iconSize * 3;
        const center = Buffer.alloc(NUM_TOTAL_PIXEL_BYTES);
        for (let y = 0; y < 72; y++) {
            const p = y * row72;
            center.set(img72.subarray(p, p + row72), (y + 4) * rowlen + hoff);
        }
        return center;
    }

    /**
     * Writes a Stream Deck's page 0 headers and image data to the Stream Deck.
     *
     * @private
     * @param {number} keyIndex The key to write to 0 - 14
     * @returns {Promise<number>}
     */
    protected _writePage0(keyIndex: number, pixels: Uint8Array): Promise<number> {
        const header = [
            0x02, 0x01, 0x00, 0x00, 0x00,
            keyIndex + 1, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x42, 0x4d, 0x36, 0x4b, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x36, 0x00, 0x00,
            0x00, 0x28, 0x00, 0x00, 0x00, this.iconSize, 0x00, 0x00,
            0x00, this.iconSize, 0x00, 0x00, 0x00, 0x01, 0x00, 0x18,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x4b, 0x00,
            0x00, 0xc4, 0x0e, 0x00, 0x00, 0xc4, 0x0e, 0x00,
        ];

        const packet = Buffer.alloc(this.pagePacketSize);
        packet.set(header);
        packet.set(pixels.subarray(0, NUM_PIXELS_PG0_BYTES), packet.length - NUM_PIXELS_PG0_BYTES);

        return this.write(packet);
    }
}
