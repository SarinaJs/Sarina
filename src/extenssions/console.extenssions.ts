import { format } from "url";

export function initializeConsoleLogger(types: string[]) {
	let FgBlack = "\x1b[30m";
	let FgRed = "\x1b[31m";
	let FgGreen = "\x1b[32m";
	let FgYellow = "\x1b[33m";
	let FgCyan = "\x1b[36m";
	let FgWhite = "\x1b[37m";

	let makeLog = function(
		original: Function,
		type: string,
		color: string = FgWhite
	) {
		return function(message?: any, ...optionalParams: any[]) {
			if ((types as string[]).count(t => t === type || t === "all") === 0) {
				return;
			}
			const now = new Date();
			const currentDate = `${now.toISOString()} - ${type} -`;
			let args = Array.from(arguments);
			args.unshift(currentDate);
			if (color) args.unshift(color + "%s" + color);

			let _args = [];
			args.forEach(a => {
				_args.pushRange(formatValue(a));
			});

			// args = args.map(value => formatValue(value));
			original.apply(this, _args);
		};
	};
	function formatValue(value) {
		if (value instanceof Error) {
			return [value as any];
		}
		if (!value) return [value];
		if (Array.isArray(value)) {
			let result = [];
			result.push(value.length + ":>[");
			value.forEach(v => {
				result.pushRange(formatValue(v));
			});
			result.push("]");
			return result;
		}
		if (typeof value === "function") {
			return [value.name];
		}
		if (value.toString && value.toString !== Object.prototype.toString)
			return [value.toString()];

		return [value];
	}

	let makeEmptyLog = function(...args: any[]) {
		return function() {};
	};

	console.debug = makeLog(console.debug, "DBG");
	console.log = makeLog(console.log, "DBG");
	console.error = makeLog(console.error, "ERR", FgRed);
	console.warn = makeLog(console.warn, "WRN", FgYellow);
	console.info = makeLog(console.info, "INF", FgGreen);
	console.trace = makeLog(console.trace, "TRC", FgCyan);
}
