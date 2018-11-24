import sharp from "sharp";

export interface IImageLibraryExtract {
    top: number;
    left: number;
    height: number;
    width: number;
}

export interface IImageLibrary {
    /**
     * Extract a section of the image.
     *
     * If this is a immutable data structure a clone of the original should be returned with the new 2d slice.
     * A mutable structure should return the original but with a view which may be moved with another call to extract.
     *
     * @param {number} [opt.top] the distance from the top edge of the original
     * @param {number} [opt.left] the distance from the left edge of the original
     * @param {number} [opt.height] the height of this subsection
     * @param {number} [opt.width] the width of this subsection
     */
    extract(opt: IImageLibraryExtract): IImageLibrary | PromiseLike<IImageLibrary>;
    /** Remove alpha channel if one exists. */
    flatten(): IImageLibrary | PromiseLike<IImageLibrary>;
    /** Resize an image to a specific size. */
    resize(width: number, height: number): IImageLibrary | PromiseLike<IImageLibrary>;
    /** Get the RGB raw pixel bytes representing the image. */
    toUint8Array(): Uint8Array | PromiseLike<Uint8Array>;
}

export interface IImageRawOptions {
    channels: 1 | 2 | 3 | 4;
    height: number;
    width: number;
}

export interface IImageLibraryCreator {
    loadFile(filepath: string): IImageLibrary | PromiseLike<IImageLibrary>;
    loadFileData(filedata: Uint8Array): IImageLibrary | PromiseLike<IImageLibrary>;
    createRaw(data: Uint8Array, rawOptions: IImageRawOptions): IImageLibrary | PromiseLike<IImageLibrary>;
}

async function defLib() {
    const sharpi = await import("sharp");
    return typeof sharpi === "function" ? sharpi : sharpi.default;
}

interface IOverrideMethods {
    toUint8Array(): Promise<Buffer>;

    /** Extract a section of the image. */
    extract(opt: IImageLibraryExtract): IImageLibrary | PromiseLike<IImageLibrary>;
    /** Remove alpha channel if one exists. */
    flatten(): IImageLibrary | PromiseLike<IImageLibrary>;
    /** Resize an image to a specific size. */
    resize(width: number, height: number): IImageLibrary | PromiseLike<IImageLibrary>;
}

const lib = {
    _defLib: null as (null | Promise<typeof sharp>),

    _sharpProxy(img: sharp.Sharp): sharp.Sharp & IOverrideMethods {
        return new Proxy<sharp.Sharp>(img, {
            get(target: sharp.Sharp, p: PropertyKey, receiver: any) {
                if (p === "toUint8Array") {
                    return () => target.raw().toBuffer();
                }
                // mutable actions returning `this`.
                if (p === "extract" || p === "flatten" || p === "resize") {
                    return (...args: any[]) => {
                        target[p].apply(target, args);
                        return receiver;
                    };
                }
                return (target as any)[p];
            },
        }) as sharp.Sharp & IOverrideMethods;
    },

    async _load(file: string | Buffer): Promise<IImageLibrary> {
        if (!this._defLib) {
            this._defLib = defLib();
        }
        const Lib = await this._defLib;
        const x = Lib(file, { density: 300 });
        return this._sharpProxy(x);
    },
    loadFile(filepath: string) {
        return this._load(filepath);
    },
    loadFileData(filedata: Uint8Array) {
        return this._load(Buffer.isBuffer(filedata) ? filedata : Buffer.from(filedata));
    },

    async createRaw(data: Uint8Array, rawOptions: IImageRawOptions): Promise<IImageLibrary> {
        if (!this._defLib) {
            this._defLib = defLib();
        }
        const d = Buffer.isBuffer(data) ? data : Buffer.from(data);
        const Lib = await this._defLib;
        const x = Lib(d, { raw: rawOptions });
        return this._sharpProxy(x);
    },
};

export default lib as IImageLibraryCreator;
