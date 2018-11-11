"use strict";

const sharp = require("sharp");
const { resolve } = require("path");
const streamDeckP = require("..").selectDevice();

const { writeFileSync } = require("fs");

const xmlescapes = {
	">": "gt",
	"<": "lt",
	"&": "amp"
};
const xmlescapex = new RegExp("[" + Object.keys(xmlescapes).join("") + "]", "g");
function xmlescape(s) {
	return s.replace(xmlescapex, (k) => "&" + xmlescapes[k] + ";");
}

function randColor() {
	const r = Math.round(Math.random() * 15);
	const g = Math.round(Math.random() * 15);
	const b = Math.round(Math.random() * 15);
	return r.toString(16) + g.toString(16) + b.toString(16);
}

Promise.resolve(streamDeckP).then((streamDeck) => {
	if (!streamDeck) {
		throw new Error("No stream deck found.");
	}

	streamDeck.on("down", async (keyIndex) => {
		console.log("Filling button #%d", keyIndex);

		const textString = `FOO #${keyIndex}`;
		const textColor  = randColor();
		const fontSize = 12;

		const img = `<svg xmlns="http://www.w3.org/2000/svg">
	<text x="0" y="${fontSize * 0.8}" font-size="${fontSize}" fill="#${textColor}">
		${xmlescape(textString)}
	</text>
</svg>`;

		const imagedata = Buffer.from(img);
		const size = Math.floor((streamDeck.iconSize - 4) * 0.9);
		const i = await sharp(imagedata, { density: 300 })
			.resize(size, size, { fit: "contain", background: {r:0,g:0,b:0,alpha:0} })
			.png().toBuffer();
	
		const compositImage = await sharp(resolve(__dirname, "fixtures", "github_logo.png"))
			.resize(streamDeck.iconSize, streamDeck.iconSize)
			.overlayWith(i)
			.flatten()
			.removeAlpha()
			.raw().toBuffer();

		return streamDeck.fillImage(keyIndex, compositImage);
	});

	streamDeck.on("up", keyIndex => {
		// Clear the key when it is released.
		console.log("Clearing button #%d", keyIndex);
		streamDeck.clearKey(keyIndex);
	});

	streamDeck.on("error", error => {
		console.error(error);
	});
});
