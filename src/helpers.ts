
/**
 * Checks a value is a valid RGB value. A number between 0 and 255.
 *
 * @param {number} value The number to check
 * @returns {number} The same number as in the parameter
 */
export function checkRGBValue(value: number): number {
    // tslint:disable-next-line:no-bitwise
    if ((value & 0xFF) !== value) {
        throw new TypeError("Expected a valid color RGB value 0 - 255");
    }
    return value;
}

/**
 * Pads a given buffer till padLength with 0s.
 *
 * @param {Buffer} buffer Buffer to pad
 * @param {number} padLength The length to pad to
 * @returns {Buffer} The Buffer padded to the length requested
 */
export function padBufferToLength(buffer: Buffer, padLength: number): Buffer {
    if (buffer.length >= padLength) {
        return buffer;
    }
    const b = Buffer.alloc(padLength);
    b.set(buffer);
    return b;
}
