import { emit, EventEmitter } from "./event-emitter";

import { HID } from "node-hid";

import { checkRGBValue } from "./helpers";
import { IImageLibrary, IImageLibraryCreator, IImageRawOptions } from "./image-library";

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

    /**
     * The layout of the stream deck showing which position has a specific `keyIndex`.
     *
     * @readonly
     */
    public abstract readonly buttonLayout: number[][];

    /**
     * The size of a page packet.
     *
     * @readonly
     */
    protected abstract readonly pagePacketSize: number;

    /**
     * The connected device.
     */
    protected device: HID;

    /**
     * The current state of key presses.
     *
     * Limited to 32 buttons.
     */
    protected keyState: number;

    // tslint:disable-next-line:variable-name
    protected _imageLibrary?: string | IImageLibraryCreator | PromiseLike<IImageLibraryCreator>;

    /**
     * The image library to use.
     * If not already imported getting this property will trigger the import.
     *
     * @readonly
     */
    public get imageLibrary() {
        if (!this._imageLibrary) {
            this._imageLibrary = import("./image-library").then((x) => x.default);
        } else if (typeof this._imageLibrary === "string") {
            this._imageLibrary = import(this._imageLibrary).then((x) => x.default || x);
        }
        return this._imageLibrary;
    }

    /**
     * A sorted list containing the `keyIndex` of all buttons currently pressed.
     *
     * @readonly
     */
    public get pressedKeys(): number[] {
        const r: number[] = [];
        for (let i = 0; i < this.buttonLength; i++) {
            // tslint:disable-next-line:no-bitwise
            if (this.keyState & (1 << i)) {
                r.push(i);
            }
        }
        return r;
    }

    /**
     * A boolean showing if there currently are any pressed keys.
     *
     * @readonly
     */
    public get hasPressedKeys(): boolean {
        return this.keyState !== 0;
    }

    /**
     * Connects to a HID device.
     *
     * @param {string} devicePath path to the HID device.
     */
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
            if (typeof err !== "object") {
                err = new Error(err);
            }
            if (!this[emit]("error", err)) {
                Promise.resolve().then(() => {
                    throw err;
                });
            }
        });
    }

    /**
     * Sets which image library should be used.
     *
     * If the parameter is a `string` the module or file will be imported when needed
     * and expects `default` to be an `IImageLibraryCreator`.
     * If no `default` is exported the functions defined in an `IImageLibraryCreator` must have been exported directly.
     *
     * @param {string | Promise<Object> | Object} library A name, path, or reference to an image library.
     * @return {StreamDeck} this
     */
    public setImageLibrary(library: string | IImageLibraryCreator | PromiseLike<IImageLibraryCreator>): this {
        this._imageLibrary = library;
        return this;
    }

    /**
     * Checks a keyIndex is a valid key for a stream deck. An integer between 0 and `buttonLength - 1`.
     *
     * @param {number} keyIndex The keyIndex to check
     */
    public checkValidKeyIndex(keyIndex: number): number {
        // tslint:disable-next-line:no-bitwise
        if (typeof keyIndex !== "number" || (keyIndex | 0) !== keyIndex) {
            throw new TypeError("Expected keyIndex to be an integer");
        }
        if (keyIndex < 0 || keyIndex >= this.buttonLength) {
            throw new TypeError("Expected a valid keyIndex 0 - " + (this.buttonLength - 1));
        }
        return keyIndex;
    }

    /**
     * Loops through every available keyIndex.
     *
     * @param {Function} func The function to pass the keyIndex and the streamDeck instance to
     * @returns {StreamDeck} this
     */
    public forEachKey(func: (keyIndex: number, streamDeck: this) => any): this {
        for (let i = 0; i < this.buttonLength; i++) {
            func.call(this, i, this);
        }
        return this;
    }

    /**
     * Get the `keyIndex` at a specific column and row.
     *
     * @param {number} x column number
     * @param {number} y row number
     * @returns {number} keyIndex
     */
    public buttonIndexFromPosition(x: number, y: number): number | undefined {
        if (this.buttonLayout[y] === undefined) {
            return undefined;
        }
        return this.buttonLayout[y][x];
    }

    /**
     * Writes a Buffer to the Stream Deck.
     *
     * @param {Uint8Array} buffer The buffer written to the Stream Deck
     * @returns {StreamDeck} this
     */
    public write(buffer: Uint8Array): this {
        this.device.write(Array.from(buffer));
        return this;
    }

    /**
     * Sends a HID feature report to the Stream Deck.
     *
     * @param {Uint8Array} buffer The buffer send to the Stream Deck.
     * @returns {StreamDeck} this
     */
    public sendFeatureReport(buffer: Uint8Array): this {
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
     * @return {StreamDeck} this
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
     * @param {string} filePath A file path to an image file
     * @returns {Promise<StreamDeck>} Resolves when the file has been written
     */
    public async fillImageFromFile(keyIndex: number, filePath: string): Promise<this> {
        this.checkValidKeyIndex(keyIndex);
        const imglib = await this.imageLibrary;
        const imgins = await imglib.loadFile(filePath);
        const buffer = await this.processImage(imgins);
        return this.fillImage(keyIndex, buffer);
    }

    /**
     * Fills the whole panel with an image in a Buffer.
     * The image is scaled to fit, and then center-cropped (if necessary).
     *
     * @param {Uint8Array|string} imagePathOrBuffer
     * @param {Object} [rawOptions] If supplying a buffer of raw pixels the size of the image must be specified.
     * @param {Object} [rawOptions.channels] Number of channels per pixel.
     * @param {Object} [rawOptions.height] Height of the raw pixel image.
     * @param {Object} [rawOptions.width] Width of the raw pixel image.
     */
    public async fillPanel(imagePathOrBuffer: Uint8Array | string): Promise<this>;
    public async fillPanel(imagePathOrBuffer: Uint8Array, rawOptions: IImageRawOptions): Promise<this>;
    public async fillPanel(imagePathOrBuffer: Uint8Array | string, rawOptions?: IImageRawOptions): Promise<this> {
        const iconHeight = this.iconSize;
        const iconWidth = this.iconSize;
        const cols = this.buttonColumns;
        const imglib = await this.imageLibrary;
        const image0 = await (rawOptions
            ? imglib.createRaw(imagePathOrBuffer as Uint8Array, rawOptions)
            : typeof imagePathOrBuffer === "string"
            ? imglib.loadFile(imagePathOrBuffer)
            : imglib.loadFileData(imagePathOrBuffer)
        );
        const image1 = await image0.resize(cols * iconWidth, this.buttonRows * iconHeight);
        const image = await image1.flatten(); // Eliminate alpha channel, if any.

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

        for (const button of buttons) {
            const part = await image.extract({
                height: iconHeight,
                left: button.x * iconWidth,
                top: button.y * iconHeight,
                width: iconWidth,
            });
            this.fillImage(button.index, await part.toUint8Array());
        }

        return this;
    }

    /**
     * Clears the given key.
     *
     * @param {number} keyIndex The key to clear 0 - 14
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
        return this.sendFeatureReport(brightnessCommandBuffer);
    }

    protected onDeviceData(data: Uint8Array) {
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
                    this[emit]("down", i);
                } else {
                    this[emit]("up", i);
                }
            }
        }
    }

    /**
     * Process an image to be shown on the stream deck.
     *
     * @param {Object} image image to extract pixels from.
     */
    protected async processImage(image: IImageLibrary): Promise<Uint8Array> {
        const i0 = await image.flatten(); // Eliminate alpha channel, if any.
        const i1 = await i0.resize(this.iconSize, this.iconSize);
        return i1.toUint8Array();
    }

    protected abstract writeImagePage(keyIndex: number, pixels: Uint8Array): this;
}
