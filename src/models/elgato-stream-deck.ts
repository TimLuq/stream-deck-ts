
import { StreamDeck } from "../stream-deck";

const NUM_FIRST_PAGE_PIXELS = 2583;
const NUM_SECOND_PAGE_PIXELS = 2601;

const NUM_FIRST_PAGE_PIXEL_BYTES = NUM_FIRST_PAGE_PIXELS * 3;
const NUM_SECOND_PAGE_PIXEL_BYTES = NUM_SECOND_PAGE_PIXELS * 3;
const NUM_TOTAL_PIXEL_BYTES = NUM_FIRST_PAGE_PIXEL_BYTES + NUM_SECOND_PAGE_PIXEL_BYTES;

export const DEV_VENDOR  = 0x0fd9;
export const DEV_PRODUCT = 0x0060;

export default class ElgatoStreamDeck extends StreamDeck {
    public readonly iconSize = 72;
    public readonly buttonColumns = 5;
    public readonly buttonRows = 3;
    public readonly buttonLength = 3 * 5;
    public readonly buttonLayout = [
        [ 4,  3,  2,  1,  0],
        [ 9,  8,  7,  6,  5],
        [14, 13, 12, 11, 10],
    ];
    protected readonly pagePacketSize = 8191;

    public constructor(devicePath: string) {
        super(devicePath);
    }

    protected writeImagePage(keyIndex: number, pixels: Uint8Array): Promise<number> {
        if (pixels.length !== NUM_TOTAL_PIXEL_BYTES) {
            throw Error("Unexpected amounts of bytes, got " + pixels + " but expected " + NUM_TOTAL_PIXEL_BYTES);
        }
        const a = this._writePage1(keyIndex, pixels);
        const b = this._writePage2(keyIndex, pixels);
        return Promise.all([a, b]).then(([x, y]) => x + y);
    }

    /**
     * Writes a Stream Deck's page 1 headers and image data to the Stream Deck.
     *
     * @private
     * @param {number} keyIndex The key to write to 0 - 14
     * @param {Uint8Array} pixels Full image data for extraction to page 1
     * @returns {Promise<number>}
     */
    protected _writePage1(keyIndex: number, pixels: Uint8Array): Promise<number> {
        const header = Buffer.from([
            0x02, 0x01, 0x01, 0x00, 0x00, keyIndex + 1, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x42, 0x4d, 0xf6, 0x3c, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x36, 0x00, 0x00, 0x00, 0x28, 0x00,
            0x00, 0x00, 0x48, 0x00, 0x00, 0x00, 0x48, 0x00,
            0x00, 0x00, 0x01, 0x00, 0x18, 0x00, 0x00, 0x00,
            0x00, 0x00, 0xc0, 0x3c, 0x00, 0x00, 0xc4, 0x0e,
            0x00, 0x00, 0xc4, 0x0e, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        ]);

        const packet = Buffer.alloc(this.pagePacketSize);
        packet.set(header);
        packet.set(pixels.subarray(0, NUM_FIRST_PAGE_PIXEL_BYTES), header.length);

        return this.write(packet);
    }

    /**
     * Writes a Stream Deck's page 2 headers and image data to the Stream Deck.
     *
     * @private
     * @param {number} keyIndex The key to write to 0 - 14
     * @param {Uint8Array} pixels Image data for page 2
     * @returns {Promise<number>}
     */
    protected _writePage2(keyIndex: number, pixels: Uint8Array): Promise<number> {
        const header = Buffer.from([
            0x02, 0x01, 0x02, 0x00, 0x01, keyIndex + 1, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        ]);

        const packet = Buffer.alloc(this.pagePacketSize);
        packet.set(header);
        packet.set(pixels.subarray(NUM_FIRST_PAGE_PIXEL_BYTES), header.length);

        return this.write(packet);
    }
}
