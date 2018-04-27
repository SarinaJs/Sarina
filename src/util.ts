export function generateId() {
	let char;
	let arr = [];
	const len = 50;

	do {
		char = ~~(Math.random() * 128);

		if (
			(char > 47 && char < 58) || // 0-9
			(char > 64 && char < 91) || // A-Z
			(char > 96 && char < 123) // a-z
		) {
			arr.push(String.fromCharCode(char));
		}
	} while (arr.length < len);

	return arr.join("");
}
