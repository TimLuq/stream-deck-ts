"use strict";

const { selectDevice } = require("..");

const fps = 4; // target 4 fps

exports.default = Promise.resolve(selectDevice()).then((streamDeck) => {

	streamDeck.on("error", error => {
		console.error(error);
	});

	let id = setInterval(() => {
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

	return Object.assign(streamDeck, {
		close() {
			if (id !== null) {
				clearInterval(id);
				id = null;
			}
			Object.getPrototypeOf(this).close.call(this);
		}
	});
});
