"use strict";

const { selectDevice } = require("..");

Promise.resolve(selectDevice()).then((streamDeck) => {

	streamDeck.on("error", error => {
		console.error(error);
	});

	const fps = 4; // target 4 fps

	setInterval(() => {
		streamDeck.forEachKey((k, d) => {
			const rgb = Math.round(Math.random() * 0xFFFFFF);
			let hex = rgb.toString(16);
			while (hex.length < 6) {
				hex = "0" + hex;
			}
			// console.log("Filling with #", hex);
			d.fillColor(k, rgb);
		});
	}, 1000 / fps);
});
