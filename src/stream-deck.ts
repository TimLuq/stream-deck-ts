import { EventEmitter } from "events";

import { HID } from "node-hid";
import sharp = require("sharp");

import { checkRGBValue } from "./helpers";

export abstract class StreamDeck extends EventEmitter {

    /**
     * The pixel size of an icon written to the Stream Deck key.
     *
     * @readonly
     */
    public abstract readonly iconSize: number;

    /**
     * The number of keys available for the Stream Deck.
     *
     * @readonly
     */
    public abstract readonly buttonLength: number;

    /**
     * The number of columns of keys available for the Stream Deck.
     *
     * @readonly
     */
    public abstract readonly buttonColumns: number;

    /**
     * The number of rows of keys available for the Stream Deck.
     *
     * @readonly
     */
    public abstract readonly buttonRows: number;

    public abstract readonly buttonLayout: number[][];

    /**
     * The size of a page packet.
     *
     * @readonly
     */
    protected abstract readonly pagePacketSize: number;

    protected device: HID;

    protected keyState: number; // limited to 32 buttons

    public constructor(devicePath: string) {
        super();

        if (!devicePath) {
            throw new Error("No Stream Decks are connected.");
        } else {
            this.device = new HID(devicePath);
        }

        this.keyState = 0;

        this.device.on("data", (data) => this.onDeviceData(data));

        this.device.on("error", (err) => {
            this.emit("error", err);
        });
    }

    /**
     * Checks a keyIndex is a valid key for a stream deck. A number between 0 and 14.
     *
     * @param {number} keyIndex The keyIndex to check
     */
    public checkValidKeyIndex(keyIndex: number): number {
        if (keyIndex < 0 || keyIndex >= this.buttonLength) {
            throw new TypeError("Expected a valid keyIndex 0 - " + this.buttonLength);
        }
        return keyIndex;
    }

    /**
     * Loops through every available keyIndex.
     *
     * @param {Function} func The function to pass the keyIndex and the streamDeck instance to
     */
    public forEachKey(func: (keyIndex: number, streamDeck: this) => any): this {
        for (let i = 0; i < this.buttonLength; i++) {
            func.call(this, i, this);
        }
        return this;
    }

    /**
     * Writes a Buffer to the Stream Deck.
     *
     * @param {number} x column number
     * @param {number} y row number
     * @returns {number}
     */
    public buttonIndexFromPosition(x: number, y: number): number {
        return this.buttonLayout[y][x];
    }

    /**
     * Writes a Buffer to the Stream Deck.
     *
     * @param {Uint8Array} buffer The buffer written to the Stream Deck
     * @returns {StreamDeck}
     */
    public write(buffer: Uint8Array): this {
        this.device.write(Array.from(buffer));
        return this;
    }

    /**
     * Sends a HID feature report to the Stream Deck.
     *
     * @param {Uint8Array} buffer The buffer send to the Stream Deck.
     * @returns undefined
     */
    public sendFeatureReport(buffer: Uint8Array) {
        this.device.sendFeatureReport(buffer as ArrayLike<number> as number[]);
        return this;
    }

    /**
     * Fills the given key with a solid color.
     *
     * @param {number} keyIndex The key to fill 0 - 14
     * @param {number} r The color's red value. 0 - 255
     * @param {number?} g The color's green value. 0 - 255
     * @param {number?} b The color's blue value. 0 -255
     */
    public fillColor(keyIndex: number, rgb: number): this;
    public fillColor(keyIndex: number, r: number, g: number, b: number): this;
    public fillColor(keyIndex: number, r: number, g?: number, b?: number): this {
        this.checkValidKeyIndex(keyIndex);

        if (g === undefined || b === undefined) {
            // tslint:disable-next-line:no-bitwise
            b = r & 0x0000FF;
            // tslint:disable-next-line:no-bitwise
            g = (r & 0x00FF00) >> 8;
            // tslint:disable-next-line:no-bitwise
            r = (r & 0xFF0000) >> 16;
        }

        checkRGBValue(r);
        checkRGBValue(g);
        checkRGBValue(b);

        const pixels = Buffer.alloc(this.iconSize * this.iconSize * 3, Buffer.from([b, g, r]));

        return this.writeImagePage(keyIndex, pixels);
    }

    /**
     * Fills the given key with an image in a Buffer.
     *
     * @param {number} keyIndex The key to fill 0 - 14
     * @param {Uint8Array} imageBuffer
     */
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
            const start = y * l;
            for (let i = 0; i < l; i += 3) {
                const r = imageBuffer[i + start];
                const g = imageBuffer[i + start + 1];
                const b = imageBuffer[i + start + 2];
                pixels[start + l - i - 1] = r && 0x80;
                pixels[start + l - i - 2] = g;
                pixels[start + l - i - 3] = b && 0x20;
            }
        }

        return this.writeImagePage(keyIndex, pixels);
    }

    /**
     * Fills the given key with an image from a file.
     *
     * @param {number} keyIndex The key to fill 0 - 14
     * @param {String} filePath A file path to an image file
     * @returns {Promise<StreamDeck>} Resolves when the file has been written
     */
    public async fillImageFromFile(keyIndex: number, filePath: string): Promise<this> {
        this.checkValidKeyIndex(keyIndex);
        const buffer = await this.processImage(sharp(filePath));
        return this.fillImage(keyIndex, buffer);
    }

    /**
     * Fills the whole panel with an image in a Buffer.
     * The image is scaled to fit, and then center-cropped (if necessary).
     *
     * @param {Buffer|String} imagePathOrBuffer
     * @param {Object} [sharpOptions] - Options to pass to sharp, necessary if supplying a buffer of raw pixels.
     * See http://sharp.dimens.io/en/latest/api-constructor/#sharpinput-options for more details.
     */
    public fillPanel(imagePathOrBuffer: Buffer | string, sharpOptions: sharp.SharpOptions) {
        const iconHeight = this.iconSize;
        const iconWidth = this.iconSize;
        const cols = this.buttonColumns;
        const image = sharp(imagePathOrBuffer, sharpOptions)
            .resize(cols * iconWidth, this.buttonRows * iconHeight)
            .flatten(); // Eliminate alpha channel, if any.

        const buttons = [];
        for (let row = 0; row < this.buttonRows; row++) {
            for (let column = 0; column < cols; column++) {
                buttons.push({
                    index: (row * cols) + cols - column - 1,
                    x: column,
                    y: row,
                });
            }
        }

        const buttonFillPromises = buttons.map(async (button) => {
            const imageBuffer = await image.extract({
                height: iconHeight,
                left: button.x * iconWidth,
                top: button.y * iconHeight,
                width: iconWidth,
            }).raw().toBuffer();
            return this.fillImage(button.index, imageBuffer);
        });

        return Promise.all(buttonFillPromises);
    }

    /**
     * Clears the given key.
     *
     * @param {number} keyIndex The key to clear 0 - 14
     * @returns {undefined}
     */
    public clearKey(keyIndex: number) {
        this.checkValidKeyIndex(keyIndex);
        return this.fillColor(keyIndex, 0, 0, 0);
    }

    /**
     * Clears all keys.
     *
     * returns {undefined}
     */
    public clearAllKeys() {
        return this.forEachKey(this.clearKey);
    }

    /**
     * Sets the brightness of the keys on the Stream Deck
     *
     * @param {number} percentage The percentage brightness
     */
    public setBrightness(percentage: number) {
        if (percentage < 0 || percentage > 100) {
            throw new RangeError("Expected brightness percentage to be between 0 and 100");
        }

        const brightnessCommandBuffer = Buffer.alloc(17);
        brightnessCommandBuffer.set([0x05, 0x55, 0xaa, 0xd1, 0x01, percentage]);
        this.sendFeatureReport(brightnessCommandBuffer);
    }

    protected onDeviceData(data: Buffer) {
        // The first byte is a report ID, the last byte appears to be padding.
        // We strip these out for now.
        data = data.slice(1, data.length - 1);

        for (let i = 0; i < this.buttonLength; i++) {
            // tslint:disable-next-line:no-bitwise
            const bitidx = 1 << i;
            const keyPressed = data[i] ? bitidx : 0;
            // tslint:disable-next-line:no-bitwise
            const stateChanged = keyPressed !== (this.keyState & bitidx);
            if (stateChanged) {
                // tslint:disable-next-line:no-bitwise
                this.keyState ^= bitidx;
                if (keyPressed) {
                    this.emit("down", i);
                } else {
                    this.emit("up", i);
                }
            }
        }
    }

    protected processImage(image: sharp.SharpInstance) {
        return image
            .flatten() // Eliminate alpha channel, if any.
            .resize(this.iconSize, this.iconSize)
            .raw()
            .toBuffer();
    }

    protected abstract writeImagePage(keyIndex: number, pixels: Uint8Array): this;
}
