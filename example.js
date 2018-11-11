#!/usr/bin/env node
'use strict';

const args = process.argv.slice(2);

const ex = args[0];

const examples = [
    "brightness",
    "fill-button-when-pressed",
    "fill-panel-when-pressed",
    "rapid-fill",
    "text-generation"
];

if (!ex) {
    console.warn("Usage: %s %s <%s>", process.argv[0], process.argv[1], examples.join(" | "));
    process.exitCode = 1;
} else if (examples.indexOf(ex) === -1) {
    console.warn("Unknown example: %s", JSON.stringify(ex));
    console.warn("Usage: %s %s <%s>", process.argv[0], process.argv[1], examples.join(" | "));
    process.exitCode = 2;
} else {
    const { resolve } = require("path");
    require(resolve(__dirname, "examples", ex + ".js"));
}
