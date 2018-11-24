# elgato-stream-deck
[![npm version](https://img.shields.io/npm/v/stream-deck-ts.svg)](https://npm.im/stream-deck-ts)
[![license](https://img.shields.io/npm/l/stream-deck-ts.svg)](https://npm.im/stream-deck-ts)


> ❗ Please note that `stream-deck-ts` is **NOT a standalone application**. It is not something you download and run on its own. It is not an alternative to the [official Stream Deck program provided by Elgato](https://www.elgato.com/en/gaming/downloads). Instead, `stream-deck-ts` is a code library which provides an API to the Stream Deck. Developers can use this API to make their own applications which interface with the Stream Deck.
>
> To further clarify: **this is not an installable program**. There is no user interface, and you cannot do anything with this library on its own. Out of the box, this library does nothing. It's purpose is to provide tools for programmers to **build** programs from the ground up which interact with a Stream Deck.
>
> This is a tool for developers to use. It is not a program for end users. It cannot and will not replace the official Stream Deck program. That is not its goal. However, it does enable someone to more easily write a program which *does* do that.


## Supported devices

Any additional devices would be appriciated. If you are able to control another device than those listed - please send a PR.

### Elgato
- [Elgato Stream Deck](products/elgato/elgato-stream-deck.md).
- [Elgato Stream Deck Mini](products/elgato/elgato-stream-deck-mini.md).


## Install

`$ npm install --save stream-deck-ts`

All of this library's native dependencies ship with prebuilt binaries, so having a full compiler toolchain should not be necessary to install `stream-deck-ts`.

However, in the event that installation _does_ fail (**or if you are on a platform that our dependencies don't provide prebuilt binaries for, such as a Raspberry Pi**), you will need to install a compiler toolchain to enable npm to build some of `stream-deck-ts`'s dependencies from source. Expand the details block below for full instructions on how to do so.

<details>
	<summary>Compiling dependencies from source</summary>
	
* Windows
  * Install [`windows-build-tools`](https://github.com/felixrieseberg/windows-build-tools):
  ```bash
  npm install --global windows-build-tools
  ```
* MacOS
  * Install the Xcode Command Line Tools:
  ```bash
  xcode-select --install
  ```
* Linux (**including Raspberry Pi**)
  * Follow the instructions for Linux in the ["Compiling from source"](https://github.com/node-hid/node-hid#compiling-from-source) steps for `node-hid`:
	```bash
	sudo apt-get install build-essential git
	sudo apt-get install gcc-4.8 g++-4.8 && export CXX=g++-4.8
	sudo apt-get install sudo apt install libusb-1.0-0 libusb-1.0-0-dev
	```
  * Install a recent version of Node.js.:
	```bash
	curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
	sudo apt-get install -y nodejs 
	```
  * Try installing `stream-deck-ts`
  * If you still have issues, ensure everything is updated and try again:
	```bash
	sudo apt-get update && sudo apt-get upgrade
	```
</details>

## Table of Contents

* [Example](#example)
* [Features](#features)
* [Planned Features](#planned-features)
* [Contributing](#contributing)
* [API](#api)
  * [DEVICE_MODELS](#devicemodels)
  * [PRODUCT_ELGATO_STREAMDECK](#productelgatostreamdeck)
  * [PRODUCT_ELGATO_STREAMDECK_MINI](#productelgatostreamdeckmini)
  * [VENDOR_ELGATO](#vendorelgato)
  * [devices()](#devices)
  * [selectDevice([vendor[, product]])](#selectdevice-vendor-product)
  * [selectAllDevices([vendor[, product]])](#selectalldevices-vendor-product)
  * [setHidAsyncType(asyncMode)](#sethidasynctype-asyncmode)
  * [Class: StreamDeck](#class-streamdeck)
    * [Event: 'down'](#event-down)
    * [Event: 'up'](#event-up)
    * [Event: 'error'](#event-error)
	* [streamDeck.buttonColumns](#streamdeck-buttoncolumns)
	* [streamDeck.buttonLength](#streamdeck-buttonlength)
	* [streamDeck.buttonRows](#streamdeck-buttonrows)
	* [streamDeck.iconSize](#streamdeck-iconsize)
	* [streamDeck.pressedKeys](#streamdeck-pressedkeys)
	* [streamDeck.buttonIndexFromPosition(x, y)](#streamdeck-buttonindexfromposition-x-y)
	* [streamDeck.checkValidKeyIndex(keyIndex)](#streamDeck-checkvalidkeyindex-keyindex)
	* [streamDeck.clearAllKeys()](#streamdeck-clearallkeys)
	* [streamDeck.clearKey(keyIndex)](#streamdeck-clearkey-keyIndex)
	* [streamDeck.fillColor(keyIndex, rgb)](#streamdeck-fillcolor-keyindex-rgb)
	* [streamDeck.fillColor(keyIndex, r, g, b)](#streamdeck-fillcolor-keyindex-r-g-b)
	* [streamDeck.fillImage(keyIndex, buffer)](#streamdeck-fillimage-keyindex-buffer)
	* [streamDeck.fillImageFromFile(keyIndex, filePath)](#streamdeck-fillimagefromfile-keyindex-filepath)
	* [streamDeck.fillPanel(imagePathOrBuffer[, rawOptions])](#streamdeck-fillpanel-imagepathorbuffer-rawoptions)
	* [streamDeck.forEachKey(callback)](#streamdeck-foreachkey-callback)
    * [streamDeck.sendFeatureReport(buffer)](#streamdeck-sendfeaturereport-buffer)
    * [streamDeck.setBrightness(percentage)](#streamdeck-setbrightness-percentage)
    * [streamDeck.setImageLibrary(library)](#streamdeck-setimagelibrary-library)
	* [streamDeck.write(buffer)](#streamdeck-write-buffer)
	* [streamDeck.writeMulti(buffers)](#streamdeck-writemulti-buffers)
  * [Interface: IImageLibrary](#interface-iimagelibrary)
  	* [IImageLibrary.extract(options)](#iimagelibrary-extract-options)
  	* [IImageLibrary.flatten()](#iimagelibrary-flatten)
  	* [IImageLibrary.resize(width, height)](#iimagelibrary-resize-width-height)
  	* [IImageLibrary.toUint8Array()](#iimagelibrary-touint8array)
  * [Interface: IImageLibraryCreator](#interface-iimagelibrarycreator)
  	* [IImageLibraryCreator.createRaw(options)](#iimagelibrarycreator-createraw-data-rawoptions)
  	* [IImageLibraryCreator.loadFile(filepath)](#iimagelibrarycreator-loadfile-filepath)
  	* [IImageLibraryCreator.loadFileData(filedata)](#iimagelibrarycreator-loadfiledata-filedata)

## Example

```javascript
import { resolve } from "path";
import { selectDevice } from "stream-deck-ts";

(async function asyncMain() {
	// Automatically discovers connected Stream Decks, and attaches to the first one.
	// Returns `null` if there are no connected stream decks.
	// You also have the option of providing the numeric vendor identifier and product identifier.
	// For example: `const myStreamDeck = await selectDevice(VENDOR_ELGATO, PRODUCT_ELGATO_STREAMDECK_MINI);`
	const myStreamDeck = await selectDevice();
	if (!myStreamDeck) {
		throw new Error("No StreamDeck found.");
	}

	myStreamDeck.on('down', (keyIndex) => {
		console.log('key %d down', keyIndex);
	});

	myStreamDeck.on('up', (keyIndex) => {
		console.log('key %d up', keyIndex);
	});

	// Fired whenever an error is detected by the `node-hid` library.
	// Always add a listener for this event!
	myStreamDeck.on('error', (error) => {
		console.error(error);
	});

	// Fill button 3 with an image of the GitHub logo.
	// This is asynchronous and returns a promise.
	myStreamDeck.fillImageFromFile(3, resolve(__dirname, 'github_logo.png')).then(() => {
		console.log('Successfully wrote a GitHub logo to key 3.');
	});

	// Fill the first button form the left in the first row with a solid red color. This is synchronous.
	myStreamDeck.fillColor(4, 255, 0, 0);
	console.log('Successfully wrote a red square to key 4.');
}());
```

## Features

* Multiplatform support: Windows 7-10, MacOS, Linux, and even Raspberry Pi!
* Key `down` and key `up` events
* Fill keys with images or solid RGB colors
* Fill the entire panel with a single image, spread across all keys
* Set the Stream Deck brightness
* TypeScript support
* Multi device support
* Optional user supplier image processing library

## API

### DEVICE_MODELS

- &lt;Object&lt;number, Object&lt;number, Object&gt;&gt;&gt; 

An object containing devices which are supported.

- `DEVICE_MODELS[vendor][device].import` &lt;string&gt; A path to the device implementation.
- `DEVICE_MODELS[vendor][device].productName` &lt;string&gt; A name representing the product of the device.
- `DEVICE_MODELS[vendor][device].vendorName` &lt;string&gt; A name representing the vendor of the device.

### PRODUCT_ELGATO_STREAMDECK

```js
export const PRODUCT_ELGATO_STREAMDECK = 96;
```

Exported constant to use as the `product` filter while selecting a device.

### PRODUCT_ELGATO_STREAMDECK_MINI

```js
export const PRODUCT_ELGATO_STREAMDECK_MINI = 99;
```

Exported constant to use as the `product` filter while selecting a device.

### VENDOR_ELGATO

```js
export const VENDOR_ELGATO = 4057;
```

Exported constant to use as the `vendor` filter while selecting a device.

### devices ()

- Returns: &lt;Promise&lt;Object[]&gt;&gt;

* `object.vendorId` &lt;number&gt; Numeric vendor id.
* `object.productId` &lt;number&gt; Numeric product id.
* `object.release` &lt;number&gt; Numeric release value.
* `object.interface` &lt;number&gt; Interface number.
* `object.path` &lt;string&gt; Path to the specific device.

Get a list of connected HID devices.

### selectDevice ([vendor[, product]])

- `vendor` &lt;number&gt; An optional vendor identity number to limit which device will be selected.
- `product` &lt;number&gt; An optional product identity number to limit which device will be selected.
- Returns: &lt;Promise&lt;[StreamDeck](#Class_StreamDeck) | null&gt;&gt;

Select the first supported device. If no supported device is found `null` is returned.

### selectAllDevices ([vendor[, product]])

- `vendor` &lt;number&gt; An optional vendor identity number to limit which devices will be selected.
- `product` &lt;number&gt; An optional product identity number to limit which devices will be selected.
- Returns: &lt;Promise&lt;Array&lt;Promise&lt;[StreamDeck](#Class_StreamDeck)&gt;&gt;&gt;&gt;

Get a list of all supported devices while they're being opened.

### setHidAsyncType (type)

- `type` &lt;string&gt; Sets which type of async provider should be used.

The async provider type handles how async calls are made.

- `auto` selects one of the other modes available to the system, based on priority.
- `emulated` will emulate an async environment with microtasks while still running synchronously inside the main thread. This might be good for debugging or as a last resort fallback but should be avoided if possible.
- `process` creates a [`forked`](https://nodejs.org/api/child_process.html#child_process_child_process_fork_modulepath_args_options) process to handle the USB communication which is first sent serialized over an IPC channel.
- `worker` spins up a [`Worker`](https://nodejs.org/api/worker_threads.html) to handle the USB communication, which should be the most performant mode by using transferrable `ByteArray`s. But workers are not currently supported by `node-hid`.

### Class: StreamDeck

Instances of the `StreamDeck` class have an active connection to a device.

#### Event: 'down'

- `keyIndex` &lt;number&gt; The index of the key that got pressed.

The `down` event is triggered when a button on the Stream Deck has been pressed down.

#### Event: 'up'

- `keyIndex` &lt;number&gt; The index of the key that got released.

The `up` event is triggered when a button on the Stream Deck has been released which previously had been pressed down.

#### Event: 'error'

- `error` &lt;Error&gt; The index of the key that got released.

Fired whenever an error is detected by the `node-hid` library.
**Always** add a listener for this event! If you don't, errors will be silently dropped.

#### streamDeck .buttonColumns

- &lt;number&gt;

Returns the number of button columns available to this `StreamDeck`.

#### streamDeck. buttonLength

- &lt;number&gt;

Returns the number of buttons available to this `StreamDeck`.

#### streamDeck .buttonRows

- &lt;number&gt;

Returns the number of button rows available to this `StreamDeck`.

#### streamDeck .hasPressedKeys

- &lt;boolean&gt;

A boolean showing if there currently are any pressed keys.

#### streamDeck .iconSize

- &lt;number&gt;

Returns the size in pixels used for icons.

#### streamDeck .pressedKeys

- &lt;Array&lt;number&gt;&gt;

A sorted list of all buttons currently pressed.

#### streamDeck .buttonIndexFromPosition (x, y)

- `x` &lt;number&gt; Cloumn number counted from from the left.
- `y` &lt;number&gt; Row number counted from from the top.
- Returns: &lt;number&gt; The `keyIndex` at the given position or `undefined` if out of bounds.

Get the `keyIndex` at a specific column and row.

#### streamDeck .checkValidKeyIndex (keyIndex)

- `keyIndex` &lt;number&gt; Cloumn number counted from from the left.
- `y` &lt;number&gt; Row number counted from from the top.
- Returns: &lt;number&gt; The `keyIndex` at the given position or `undefined` if out of bounds.

Validate a `keyIndex`. If the number is not valid the function will throw a `TypeError`, otherwise the same value will be returned.

#### streamDeck .clearAllKeys ()

- Returns: &lt;StreamDeck&gt;

Synchronously clears all keys on the device.

##### Example: clear all keys

```javascript
// Clear all keys.
streamDeck.clearAllKeys();
```

#### streamDeck .clearKey (keyIndex)

- `keyIndex` &lt;number&gt; Key to affect.
- Returns: &lt;StreamDeck&gt;

Synchronously clears the given `keyIndex`'s screen.

##### Example: clear button 2

```javascript
// Clear button 2.
streamDeck.clearKey(2);
```

#### streamDeck .close ()

Closes this reference to the device.

#### streamDeck .fillColor (keyIndex, rgb)

- `keyIndex` &lt;number&gt; Key to affect.
- `rgb` &lt;number&gt; Fill color.

Synchronously sets the given `keyIndex`'s screen to a solid RGB color.

##### Example: set button 4 to solid red

```javascript
// Turn key 4 solid red.
streamDeck.fillColor(4, 0xFF0000);
```

#### streamDeck .fillColor (keyIndex, r, g, b)

- `keyIndex` &lt;number&gt; Key to affect.
- `r` &lt;number&gt; Red component between `0` - `255`.
- `g` &lt;number&gt; Green component between `0` - `255`.
- `b` &lt;number&gt; Blue component between `0` - `255`.

Synchronously sets the given `keyIndex`'s screen to a solid RGB color.

##### Example: set button 5 to solid blue

```javascript
// Turn key 5 solid blue.
streamDeck.fillColor(5, 0, 0, 0xFF);
```

#### streamDeck .fillImage (keyIndex, buffer)

- `keyIndex` &lt;number&gt; Key to affect.
- `buffer` &lt;[Buffer](https://nodejs.org/api/buffer.html)&gt; Image bytes.
- Returns: &lt;Promise&lt;StreamDeck&gt;&gt;

Synchronously writes a buffer of `streamDeck.iconSize` * `streamDeck.iconSize` RGB image data to the given `keyIndex`'s screen.
The buffer must be exactly the expected length of bytes. Any other length will result in an error being thrown.

##### Example: fill button 2 with an image of the GitHub logo

```javascript
// Fill button 2 with an image of the GitHub logo.
import * as sharp from "sharp"; // See http://sharp.dimens.io/en/stable/ for full docs on this great library!
import { resolve } from "path";

const filepath = resolve(__dirname, 'github_logo.png');
const buffer = await sharp(filepath)
	.flatten() // Eliminate alpha channel, if any.
	.resize(streamDeck.iconSize, streamDeck.iconSize) // Scale up/down to the right size, cropping if necessary.
	.raw() // Give us uncompressed RGB.
	.toBuffer();

streamDeck.fillImage(2, buffer);
```

#### streamDeck .fillImageFromFile (keyIndex, filePath)

- `keyIndex` &lt;number&gt; Key to affect.
- `filePath` &lt;string&gt; File system path to an image file.
- Returns: &lt;Promise&lt;StreamDeck&gt;&gt;

Asynchronously reads an image from `filePath` and sets the given `keyIndex`'s screen to that image.
Automatically scales the image to the expected height and width and strips out the alpha channel.
If necessary, the image will be center-cropped to fit into a square.

##### Example: fill the button 3 with an image of the GitHub logo

```javascript
// Fill the button 3 with an image of the GitHub logo.
await streamDeck.fillImageFromFile(3, path.resolve(__dirname, 'github_logo.png'));
console.log('Successfully wrote a GitHub logo to key 3.');
```

#### streamDeck .fillPanel (imagePathOrBuffer[, rawOptions])

- `imagePathOrBuffer` &lt;string | Uint8Array | [Buffer](https://nodejs.org/api/buffer.html)&gt; Image data or path to a file.
- `rawOptions` &lt;object&gt; Optional options object used if the image buffer contained raw pixel data.
  - `rawOptions.channels` &lt;number&gt; Number of channels per pixel. `RGBA = 4`.
  - `rawOptions.height` &lt;number&gt; Height in pixels.
  - `rawOptions.width` &lt;number&gt; Width in pixels.
- Returns: &lt;Promise&lt;StreamDeck&gt;&gt;

Asynchronously applies an image to the entire panel, spreading it over all keys. The image is scaled down and center-cropped to fit. This method does not currently account for the gaps between keys, and behaves as if each key was directly connected to its neighbors. If you wish to account for the gaps between keys, you'll need to do so via other means, and bake that into the image you provide to `fillPanel`.

This method accepts either a path to an image on the disk, or a buffer. The image path or buffer is passed directly to [`sharp`](https://github.com/lovell/sharp). Therefore, this method accepts all images and buffers which `sharp` can accept.

##### Example: fill the entire panel with a photo of a sunny field

```javascript
// Fill the entire panel with a photo of a sunny field.
import { resolve } from "path";

const filepath = resolve(__dirname, 'examples/fixtures/sunny_field.png');
await streamDeck.fillPanel(filepath);
console.log('Successfully filled the panel with an image.');
```

#### streamDeck .forEachKey (callback)

- `callback` &lt;Function&gt; The function to call for each button in the stream deck.
- Returns: &lt;StreamDeck&gt;

Execute a function for each button available to the `StreamDeck`.

#### streamDeck .sendFeatureReport (buffer)

- `buffer` &lt;[Buffer](https://nodejs.org/api/buffer.html) | Uint8Array&gt; The buffer send to the Stream Deck.
- Returns: &lt;StreamDeck&gt;

Sends a HID feature report to the Stream Deck.

#### streamDeck .setBrightness (percentage)

- `percentage` &lt;number&gt; Percentage of brightness.
- Returns: &lt;StreamDeck&gt;

Synchronously set the brightness of the Stream Deck. This affects all keys at once. The brightness of individual keys cannot be controlled.

##### Example: set the Stream Deck to maximum brightness

```javascript
// Set the Stream Deck to maximum brightness
streamDeck.setBrightness(100);
```

#### streamDeck .setImageLibrary (library)

- `library` &lt;string | [IImageLibraryCreator](#interface-iimagelibrarycreator) | Promise&lt;IImageLibraryCreator&gt;&gt; An object capable to create image contexts or a string representing a module exporting such an object as `default`.
- Returns: &lt;StreamDeck&gt;

Allows users to switch image processing library to a non standard version.
This might be because of the library providing better performance or image quality, or simply to minimize bloat when another image library is used somewhere else.

#### streamDeck .write (buffer)

- `buffer` &lt;[Buffer](https://nodejs.org/api/buffer.html) | Uint8Array&gt; Data to write.
- Returns: &lt;Promise&lt;number&gt;&gt; When written this resolves to the number of bytes

Asynchronously writes an arbitrary `Uint8Array` instance to the Stream Deck.
The promise is rejected if an error is encountered during the write operation.

#### streamDeck .writeMulti (buffers)

- `buffers` &lt;Array&lt;[Buffer](https://nodejs.org/api/buffer.html) | Uint8Array&gt;&gt; Data buffers to write.
- Returns: &lt;Promise&lt;number&gt;&gt; When written this resolves to the number of bytes

Asynchronously writes a bunch of arbitrary `Uint8Array` instances to the Stream Deck.
The promise is rejected if an error is encountered during the write operation.

##### Example: write a number of zeros to the stream deck

```javascript
// Writes a total of 32 bytes of zero to the Stream Deck in two pages and waits for the last one to finish.
streamDeck.write(Buffer.alloc(16));
await streamDeck.write(Buffer.alloc(16));
```

### Interface: IImageLibrary

An image instance controlled by an image library.

Any library implementing, or wrapped by an object implementing, this interface could be used for image operations.

#### IImageLibrary .extract (options)

- `options` &lt;Object&gt; Data to write.
- Returns: &lt;[IImageLibrary](#interface-iimagelibrary) | Promise&lt;[IImageLibrary](#interface-iimagelibrary)&gt;&gt;

Extract a section of the image.

If this is a immutable data structure a clone of the original should be returned with the new 2d slice.
A mutable structure should return the original but with a view which may be moved with another call to extract.

* `options.left` &lt;number&gt; the distance from the left edge of the original
* `options.top` &lt;number&gt; the distance from the top edge of the original
* `options.width` &lt;number&gt; the width of this subsection
* `options.height` &lt;number&gt; the height of this subsection

#### IImageLibrary .flatten ()

- Returns: &lt;[IImageLibrary](#interface-iimagelibrary) | Promise&lt;[IImageLibrary](#interface-iimagelibrary)&gt;&gt;

Remove alpha channel if one exists.

#### IImageLibrary .resize (width, height)

- `width` &lt;number&gt; Width of the resulting image.
- `height` &lt;number&gt; Height of the resulting image.
- Returns: &lt;[IImageLibrary](#interface-iimagelibrary) | Promise&lt;[IImageLibrary](#interface-iimagelibrary)&gt;&gt;

Resizes an image to the specified size.
Interpolation and ratio perservation mode is up to the library or wrapper.
However it is recommended that the image be applied in a `cover` fashion.

#### IImageLibrary .toUint8Array ()

- Returns: &lt;Uint8Array | Promise&lt;Uint8Array&gt;&gt;

Get the RGB raw pixel bytes representing the image.

### Interface: IImageLibraryCreator

An object implementing this interface is tasked with instantiating image contexts using a library or a custom implementation.

#### IImageLibraryCreator .createRaw (data, rawOptions)

- `data` &lt;Uint8Array&gt; Raw RGB pixel data.
- `rawOptions` &lt;Object&gt; Parameters describing the raw image.
- Returns: &lt;[IImageLibrary](#interface-iimagelibrary) | Promise&lt;[IImageLibrary](#interface-iimagelibrary)&gt;&gt;

Creates an image context containing the pixels given in the `data` argument.
The image size and number of channels are specified in the `rawOptions` argument.

- `rawOptions.channels` &lt;number&gt; The number of channels used. `4` is RGBA, `3` is RGB.
- `rawOptions.height` &lt;number&gt; The height of the image.
- `rawOptions.width` &lt;number&gt; The width of the image.

The total number of bytes should be equal to `height * width * channels`.

#### IImageLibraryCreator .loadFile (filepath)

- `filepath` &lt;string&gt; Path to an image file.
- Returns: &lt;[IImageLibrary](#interface-iimagelibrary) | Promise&lt;[IImageLibrary](#interface-iimagelibrary)&gt;&gt;

If using a library exposing a way to read a file or support stream decoding such a function sould be used here.
If no streaming optimization is available this could be implemented by doing an async `readFile` and passing the resulting data to [`loadFileData`](#iimagelibrarycreator-loadimagedata-filedata).

#### IImageLibraryCreator .loadFileData (filedata)

- `filedata` &lt;Uint8Array&gt; Bytes of some image format hoping to be decoded.
- Returns: &lt;[IImageLibrary](#interface-iimagelibrary) | Promise&lt;[IImageLibrary](#interface-iimagelibrary)&gt;&gt;

Creates an image context based on an existing image.
Which image encodings is supported is determined by the library or implementor.
Recommended formats are `PNG`, `JPEG`, and `SVG`.
