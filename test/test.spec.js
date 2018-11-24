
// Native
import { EventEmitter } from 'events';
import { resolve } from 'path';

// Packages
import mockery from 'mockery';
import sinon from 'sinon';
import test from 'ava';

// Ours
import { EventEmitter as CustomEventEmitter } from "../lib/event-emitter"
import { validateWriteCall } from './helpers';

class DummyHID extends EventEmitter {
	constructor(devicePath) {
		super();
		this.write = sinon.spy();
		this.sendFeatureReport = sinon.spy();
		this.path = devicePath;
	}
}

const mockNodeHID = {
	devices() {
		return [{
			vendorId: 0x0fd9,
			productId: 0x0060,
			path: 'foo'
		}];
	},
	HID: DummyHID
};
mockery.registerMock('node-hid', mockNodeHID);

mockery.enable({
	warnOnUnregistered: false
});

// Must be required after we register a mock for `node-hid`.
const { getStreamDeckProduct, registerStreamDeckProduct, selectDevice, selectAllDevices, setHidAsyncType, VENDOR_ELGATO, PRODUCT_ELGATO_STREAMDECK } = require('..');

setHidAsyncType("emulated");

const semaphores = new Map();
function aquireSemaphore(name) {
	const sem = semaphores.get(name);
	const resolve = {};
	const p = new Promise((s) => {
		resolve.s = s;
	});
	const r = Promise.resolve(sem).then(() => (() => resolve.s()));
	semaphores.set(name, p);
	return r;
}

const fakeProduct = {
	vendorId: 0,
	productId: 1,
	path: 'foobar'
};

const fakeElgato = {
	vendorId: VENDOR_ELGATO,
	productId: 0,
	path: 'foobar'
};


test('selectDevice returns null when there are no connected Stream Decks', async t => {
	const release = await aquireSemaphore("devices");
	const devicesStub = sinon.stub(mockNodeHID, 'devices');
	try {
		devicesStub.returns([]);
		t.is(await selectDevice(), null);
	} finally {
		devicesStub.restore();
		release();
	}
});

test('selectAllDevices returns empty array when there are no connected Stream Decks', async t => {
	const release = await aquireSemaphore("devices");
	const devicesStub = sinon.stub(mockNodeHID, 'devices');
	try {
		devicesStub.returns([]);
		const sad = selectAllDevices();
		t.true(typeof sad.then === "function");
		const ds = await sad;
		t.true(Array.isArray(ds));
		t.is(ds.length, 0);
	} finally {
		devicesStub.restore();
		release();
	}
});

test('selectAllDevices returns an array containing a promise when there are no connected Stream Decks', async t => {
	let ds;
	const release = await aquireSemaphore("devices");
	try {
		ds = await selectAllDevices(VENDOR_ELGATO, PRODUCT_ELGATO_STREAMDECK);
	} finally {
		release();
	}
	t.true(Array.isArray(ds));
	t.is(ds.length, 1);
	t.true(ds[0] instanceof Promise);
});

test('handle no matching products in selectDevice', async t => {
	const release = await aquireSemaphore("devices");
	const devicesStub = sinon.stub(mockNodeHID, 'devices');
	try {
		devicesStub.returns([fakeProduct, fakeElgato]);
		await t.throws(Promise.resolve().then(() => selectDevice(fakeProduct.vendorId)), (err) => (err instanceof Error) && err.code === "STRMDCK_MISSING_VENDOR", "zero vendor");
		await t.throws(Promise.resolve().then(() => selectDevice(fakeElgato.vendorId, 0)), (err) => (err instanceof Error) && err.code === "STRMDCK_MISSING_PRODUCT", "zero product");
	} finally {
		devicesStub.restore();
		release();
	}
});

test('handle no matching products in selectAllDevices', async t => {
	const release = await aquireSemaphore("devices");
	const devicesStub = sinon.stub(mockNodeHID, 'devices');
	try {
		devicesStub.returns([fakeProduct, fakeElgato]);
		await t.throws(Promise.resolve().then(() => selectAllDevices(fakeProduct.vendorId)), (err) => (err instanceof Error) && err.code === "STRMDCK_MISSING_VENDOR");
		await t.throws(Promise.resolve().then(() => selectAllDevices(fakeElgato.vendorId, 0)), (err) => (err instanceof Error) && err.code === "STRMDCK_MISSING_PRODUCT");
	} finally {
		devicesStub.restore();
		release();
	}
});

test('product registration', async t => {
	const prod = {
		import: "@null/null/null.js",
		productName: "Example",
		vendorName: "Example",
	};

	t.is(getStreamDeckProduct(0xdeadbeef, 0xdeadbeef), undefined, "Before registeration undefined should be the product config.");
	t.is(registerStreamDeckProduct(0xdeadbeef, 0xdeadbeef, prod), undefined, "Previous registration should be undefined.");
	t.is(getStreamDeckProduct(0xdeadbeef, 0xdeadbeef), prod, "Getting the product config should return the registered one.");
	t.is(registerStreamDeckProduct(0xdeadbeef, 0xdeadbeef, undefined), prod, "Previous registration should return the old config when overridden.");
});


test('fillColor(r, g, b)', async t => {
	const release = await aquireSemaphore("devices");
	let streamDeck;
	try {
		streamDeck = await selectDevice();
	} finally {
		release();
	}
	await streamDeck.fillColor(0, 255, 0, 0);
	await validateWriteCall(
		t,
		streamDeck.device.messagePort.containers.get(streamDeck.device.devicePath).device.write,
		[
			'fillColor-red-page1.json',
			'fillColor-red-page2.json'
		]
	);
});


test('checkRGBValue', async t => {
	const release = await aquireSemaphore("devices");
	let streamDeck;
	try {
		streamDeck = await selectDevice();
	} finally {
		release();
	}
	t.throws(() => streamDeck.fillColor(0, 256, 0, 0));
	t.throws(() => streamDeck.fillColor(0, 0, 256, 0));
	t.throws(() => streamDeck.fillColor(0, 0, 0, 256));
	t.throws(() => streamDeck.fillColor(0, -1, 0, 0));
});

test('checkValidKeyIndex', async t => {
	const release = await aquireSemaphore("devices");
	let streamDeck;
	try {
		streamDeck = await selectDevice();
	} finally {
		release();
	}
	t.throws(() => streamDeck.clearKey(-1));
	t.throws(() => streamDeck.clearKey(15));
});

test('clearKey', async t => {
	const release = await aquireSemaphore("devices");
	let streamDeck;
	try {
		streamDeck = await selectDevice();
	} finally {
		release();
	}
	const fillColorSpy = sinon.spy(streamDeck, 'fillColor');
	streamDeck.clearKey(0);
	t.true(fillColorSpy.calledOnce);
	t.deepEqual(fillColorSpy.firstCall.args, [0, 0, 0, 0]);
});

test('clearAllKeys', async t => {
	const release = await aquireSemaphore("devices");
	let streamDeck;
	try {
		streamDeck = await selectDevice();
	} finally {
		release();
	}
	const clearKeySpy = sinon.spy(streamDeck, 'clearKey');
	streamDeck.clearAllKeys();
	t.is(clearKeySpy.callCount, 15);
	for (let i = 0; i < 15; i++) {
		t.true(clearKeySpy.calledWithExactly(i, streamDeck));
	}
});

// no longer matching reference files, maybe due to updated image lib?
test.failing('fillImageFromFile', async t => {
	const release = await aquireSemaphore("devices");
	let streamDeck;
	try {
		streamDeck = await selectDevice();
	} finally {
		release();
	}
	await streamDeck.fillImageFromFile(0, resolve(__dirname, 'fixtures/nodecg_logo.png'));
	await validateWriteCall(
		t,
		streamDeck.device.write,
		[
			'fillImageFromFile-nodecg_logo-page1.json',
			'fillImageFromFile-nodecg_logo-page2.json'
		]
	);
});

// no longer matching reference files, maybe due to updated image lib?
test.failing('fillPanel', async t => {
	const release = await aquireSemaphore("devices");
	let streamDeck;
	try {
		streamDeck = await selectDevice();
	} finally {
		release();
	}
	const fillImageSpy = sinon.spy(streamDeck, 'fillImage');
	await streamDeck.fillPanel(resolve(__dirname, 'fixtures/mosaic.png'));

	// eslint-disable function-paren-newline
	const expectedWriteValues = await readFixtureJSON('expectedMosaicBuffers.json');
	// eslint-enable function-paren-newline

	t.is(fillImageSpy.callCount, 15);

	const spyCalls = fillImageSpy.getCalls();
	expectedWriteValues.forEach((entry, index) => {
		const callForThisButton = spyCalls.find(call => call.args[0] === index);
		if (!callForThisButton) {
			t.fail(`Could not find the fillImage call for button #${index}`);
			return;
		}

		const suppliedBuffer = callForThisButton.args[1];
		const expectedBuffer = Buffer.from(entry.data);
		t.true(suppliedBuffer.equals(expectedBuffer));
	});
});

test('down and up events', async t => {
	const release = await aquireSemaphore("devices");
	let streamDeck;
	try {
		streamDeck = await selectDevice();
	} finally {
		release();
	}
	
	// press and release before any listeners
	streamDeck.device[CustomEventEmitter.emitSymbol]("data", Buffer.from([0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]));
	streamDeck.device[CustomEventEmitter.emitSymbol]("data", Buffer.from([0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]));
	streamDeck.off('down', () => {});

	// setup listeners and press, gather info, release
	const onceSpy = sinon.spy();
	const downSpy = sinon.spy();
	const upSpy = sinon.spy();
	streamDeck.once('down', key => onceSpy(key));
	streamDeck.on('down', key => downSpy(key));
	streamDeck.on('up', key => upSpy(key));
	streamDeck.device[CustomEventEmitter.emitSymbol]("data", Buffer.from([0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]));
	streamDeck.device[CustomEventEmitter.emitSymbol]("foo", null);
	const hasKeys = streamDeck.hasPressedKeys;
	const pressedKeys = streamDeck.pressedKeys;
	streamDeck.device[CustomEventEmitter.emitSymbol]("data", Buffer.from([0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]));

	// validate that the event got emitted using the correct button
	t.is(downSpy.getCall(0).args[0], 0);
	t.is(upSpy.getCall(0).args[0], 0);

	// validate `hasPressedKey` state while pressed and released
	t.is(hasKeys, true, "state of hasPressedKeys when a key is pressed");
	t.is(streamDeck.hasPressedKeys, false, "state of hasPressedKeys when no key is pressed");

	// validate `pressedKey` state while pressed and released
	t.is(pressedKeys.length, 1, "length of pressedKeys when a single key is pressed");
	t.is(streamDeck.pressedKeys.length, 0, "length of pressedKeys when no key is pressed");
	t.is(pressedKeys[0], 0, "first key of pressedKeys when a single key is pressed");
	
	// trigger another key press
	streamDeck.device[CustomEventEmitter.emitSymbol]("data", Buffer.from([0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]));
	
	// validate the number of times listeners has been called
	t.is(downSpy.callCount, 2);
	t.is(upSpy.callCount, 1);
	t.is(onceSpy.callCount, 1, "expects once-event to only be called once");

	// release all keys
	streamDeck.device[CustomEventEmitter.emitSymbol]("data", Buffer.from([0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]));
});

test('forwards error events from the device', async t => {
	const release = await aquireSemaphore("devices");
	let streamDeck;
	try {
		streamDeck = await selectDevice();
	} finally {
		release();
	}
	return new Promise((resolve) => {
		let id;
		const cb = () => {
			t.pass("error gets forwarded");
			if (id) {
				clearInterval(id);
				id = null;
			}
			streamDeck.off("error", cb);
			resolve();
		};
		setTimeout(() => {
			streamDeck.off("error", cb);
			t.fail("error does not get forwarded");
			resolve();
		}, 50);
		streamDeck.on('error', cb);
		streamDeck.device[CustomEventEmitter.emitSymbol]('error', new Error('Test'));
	});
});

test('fillImage throws on undersized buffers', async t => {
	const release = await aquireSemaphore("devices");
	let streamDeck;
	try {
		streamDeck = await selectDevice();
	} finally {
		release();
	}
	const smallBuffer = Buffer.alloc(1);
	t.throws(() => streamDeck.fillImage(0, smallBuffer));
});

test('setBrightness', async t => {
	const release = await aquireSemaphore("devices");
	let streamDeck;
	try {
		streamDeck = await selectDevice();
	} finally {
		release();
	}
	await streamDeck.setBrightness(100);
	await streamDeck.setBrightness(0);

	t.deepEqual(Array.from(streamDeck.device.messagePort.containers.get(streamDeck.device.devicePath).device.sendFeatureReport.getCall(1).args[0]), [0x05, 0x55, 0xaa, 0xd1, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
	t.deepEqual(Array.from(streamDeck.device.messagePort.containers.get(streamDeck.device.devicePath).device.sendFeatureReport.getCall(0).args[0]), [0x05, 0x55, 0xaa, 0xd1, 0x01, 0x64, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);

	t.throws(() => streamDeck.setBrightness(101));
	t.throws(() => streamDeck.setBrightness(-1));
});

test.after("debugger break", () => setTimeout(() => {
	debugger;
}, 10));
