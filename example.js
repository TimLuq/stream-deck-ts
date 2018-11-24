#!/usr/bin/env node
"use strict";

const args = process.argv.slice(2);

const examples = [
    "brightness",
    "fill-button-when-pressed",
    "fill-panel-when-pressed",
    "rapid-fill",
    "text-generation"
];

const asyncModes = [
    "emulated",
    "process",
    "worker"
]

let streamDeck;


process.on("SIGINT", () => {
    if (streamDeck) {
        Promise.resolve(streamDeck).then((x) => x.close());
    }
});
process.on("SIGTERM", () => {
    if (streamDeck) {
        Promise.resolve(streamDeck).then((x) => x.close());
    }
});

for (let i = 0; i < args.length; i++) {
	if (args[i].startsWith("--hidAsyncType=")) {
		const asyncType = arg.substring("--hidAsyncType=".length);
		setHidAsyncType(asyncType);
        console.warn("Forcing hidAsyncType to %s", asyncType);
        args.splice(i, 1);
        i--;
	}
}

const ex = args[0];

if (!ex) {
    console.warn("Usage: %s %s [--hidAsyncType=TYPE] EXAMPLE\nwhere: TYPE      <%s>\n       EXAMPLE   <%s>", process.argv[0], process.argv[1], asyncModes.join(" | "), examples.join(" | "));
    process.exitCode = 1;
} else if (examples.indexOf(ex) === -1) {
    console.warn("Unknown example: %s", JSON.stringify(ex));
    console.warn("Usage: %s %s [--hidAsyncType=TYPE] EXAMPLE\nwhere: TYPE      <%s>\n       EXAMPLE   <%s>", process.argv[0], process.argv[1], asyncModes.join(" | "), examples.join(" | "));
    process.exitCode = 2;
} else {
    const { resolve } = require("path");
    streamDeck = require(resolve(__dirname, "examples", ex + ".js")).default;
}
