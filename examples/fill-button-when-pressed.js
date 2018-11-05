'use strict';

const { resolve } = require("path");
const { selectDevice } = require("..");

Promise.resolve(selectDevice()).then((streamDeck) => {

	streamDeck.on("down", (keyIndex) => {
		// Fill the pressed key with an image of the GitHub logo.
		console.log("Filling button #%d", keyIndex);
		streamDeck.fillImageFromFile(keyIndex, resolve(__dirname, keyIndex % 2 ? "fixtures/github_logo.png" : "fixtures/sunny_field.png"))
			.catch(error => {
				console.error(error);
			});
	});

	streamDeck.on("up", (keyIndex) => {
		// Clear the key when it is released.
		console.log("Clearing button #%d", keyIndex);
		streamDeck.clearKey(keyIndex);
	});

	streamDeck.on("error", (error) => {
		console.error("HID error:", error);
	});
});
