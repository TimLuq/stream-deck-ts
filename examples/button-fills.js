'use strict';

const NUM_FIRST_PAGE_PIXELS = 2583;
const NUM_SECOND_PAGE_PIXELS = 2601;
const NUM_TOTAL_PIXELS = NUM_FIRST_PAGE_PIXELS + NUM_SECOND_PAGE_PIXELS;
const SIZE = 72;
const path = require('path');
const streamDeck = require('../index');
const sharp = require('sharp');
sharp(path.resolve(__dirname, 'github_logo.png'))
	.flatten() // Eliminate alpha channel, if any.
	.resize(SIZE, SIZE)
	.raw()
	.toBuffer()
	.then(buffer => {
		streamDeck.on('down', keyIndex => {
			imageFill(keyIndex, buffer);
		});
	});

streamDeck.on('error', err => {
	console.error(err);
});

streamDeck.on('up', keyIndex => {
	colorFill(keyIndex, 0, 0, 0);
});

function pageStringToBuffer(pageString) {
	const byteStrings = pageString.split(':');
	const byteArray = byteStrings.map(byteStr => {
		return parseInt(byteStr, 16);
	});
	return Buffer.from(byteArray);
}

function colorFill(keyIndex, r, g, b) {
	const button = keyIndexToButtonHex(keyIndex);
	const rgb = `:${intToHexString(b)}:${intToHexString(g)}:${intToHexString(r)}`;
	const page1 = `02:01:01:00:00:${button}:00:00:00:00:00:00:00:00:00:00:42:4d:f6:3c:00:00:00:00:00:00:36:00:00:00:28:00:00:00:48:00:00:00:48:00:00:00:01:00:18:00:00:00:00:00:c0:3c:00:00:c4:0e:00:00:c4:0e:00:00:00:00:00:00:00:00:00:00${rgb.repeat(NUM_FIRST_PAGE_PIXELS)}:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00`;
	const page2 = `02:01:02:00:01:${button}:00:00:00:00:00:00:00:00:00:00${rgb.repeat(NUM_SECOND_PAGE_PIXELS)}:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00`;
	streamDeck.write(pageStringToBuffer(page1));
	streamDeck.write(pageStringToBuffer(page2));
}

function imageFill(keyIndex, buffer) {
	if (buffer.length !== 15552) {
		throw new Error(`Expected buffer of length 15552, got length ${buffer.length}`);
	}

	const button = keyIndexToButtonHex(keyIndex);
	let pixels = [];
	for (let r = 0; r < SIZE; r++) {
		const row = [];
		const start = r * 3 * SIZE;
		for (let i = start; i < start + (SIZE * 3); i += 3) {
			const r = buffer.readUInt8(i);
			const g = buffer.readUInt8(i + 1);
			const b = buffer.readUInt8(i + 2);
			const rgb = `${intToHexString(b)}:${intToHexString(g)}:${intToHexString(r)}`;
			row.push(rgb);
		}
		pixels = pixels.concat(row.reverse());
	}

	const firstPagePixels = pixels.slice(0, NUM_FIRST_PAGE_PIXELS);
	const secondPagePixels = pixels.slice(NUM_FIRST_PAGE_PIXELS, NUM_TOTAL_PIXELS);
	const page1 = `02:01:01:00:00:${button}:00:00:00:00:00:00:00:00:00:00:42:4d:f6:3c:00:00:00:00:00:00:36:00:00:00:28:00:00:00:48:00:00:00:48:00:00:00:01:00:18:00:00:00:00:00:c0:3c:00:00:c4:0e:00:00:c4:0e:00:00:00:00:00:00:00:00:00:00:${firstPagePixels.join(':')}:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00`;
	const page2 = `02:01:02:00:01:${button}:00:00:00:00:00:00:00:00:00:00:${secondPagePixels.join(':')}:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00`;
	streamDeck.write(pageStringToBuffer(page1));
	streamDeck.write(pageStringToBuffer(page2));
}

function keyIndexToButtonHex(keyIndex) {
	return (keyIndex + 1).toString(16);
}

function intToHexString(int) {
	let hexStr = int.toString(16);
	if (hexStr.length === 1) {
		hexStr = `0${hexStr}`;
	}
	return hexStr;
}