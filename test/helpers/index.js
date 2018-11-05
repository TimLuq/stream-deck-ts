// Native
import { readFile } from 'fs';
import { resolve as resolvePath } from 'path';

async function validateWriteCall(t, spy, files, filter) {
	const callCount = spy.callCount;
	if (callCount !== files.length) {
		t.fail('Spy was not called correct number of times');
		return;
	}

	for (let i = 0; i < callCount; i++) {
		let data = await readFixtureJSON(files[i]);
		if (filter) {
			data = filter(data);
		}
		t.deepEqual(spy.getCall(i).args[0], data, "equivalence of file " + i + " " + JSON.stringify(files[i]));
	}
}

function readFixtureJSON(fileName) {
	return new Promise((resolve, reject) => {
		const filePath = resolvePath(__dirname, '../fixtures', fileName);
		readFile(filePath, "utf8", (err, dat) => err ? reject(err) : resolve(JSON.parse(dat)));
	});
}

module.exports = {
	validateWriteCall,
	readFixtureJSON
};
