export function convertToAscii(inputString: string) {
	const asciiString = inputString.replace(/[^\x00-\x7F]+/g, '');
	return asciiString;
}
