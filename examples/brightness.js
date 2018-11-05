"use strict";

const { selectDevice } = require("..");

Promise.resolve(selectDevice()).then(function (streamDeck) {

	// Fill it white so we can see the brightness changes
	streamDeck.forEachKey((k, d) => {
		return d.fillColor(k, 0xFFFFFF);
	});

	streamDeck.on("down", (keyIndex) => {
		const percentage = (100 / (streamDeck.buttonLength - 1)) * keyIndex;
		console.log(`Setting brightness to ${percentage.toFixed(2)}%`);
		streamDeck.setBrightness(percentage);
	});

	streamDeck.on("error", (error) => {
		console.error("HID error:", error);
	});
});
