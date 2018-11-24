"use strict";

const { resolve } = require("path");
const { selectDevice } = require("..");

exports.default = Promise.resolve(selectDevice()).then((streamDeck) => {

	console.log("Press even buttons to show the first image, and odd buttons to show the second image.");

	let filled = false;
	streamDeck.on("down", (keyIndex) => {
		if (filled) {
			return;
		}

		filled = true;

		let imagePath;
		if (keyIndex % 2) {
			console.log("Filling entire panel with an image of a sunny field.");
			imagePath = resolve(__dirname, "fixtures/sunny_field.png");
		} else {
			console.log("Filling entire panel with a mosaic which will show each key as a different color.");
			imagePath = resolve(__dirname, "../test/fixtures/mosaic.png");
		}

		streamDeck.fillPanel(imagePath)
			.catch(error => {
				filled = false;
				console.error(error);
			});
	});

	streamDeck.on("up", () => {
		if (!filled) {
			return;
		}

		// Clear the key when all keys are released.
		if (!streamDeck.hasPressedKeys) {
			console.log("Clearing all buttons");
			streamDeck.clearAllKeys();
			filled = false;
		}
	});

	streamDeck.on("error", error => {
		console.error("HID error:", error);
	});

	return streamDeck;
});
