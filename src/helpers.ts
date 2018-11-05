
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
