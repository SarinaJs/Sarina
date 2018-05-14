import { Type } from "./type";
import { formatValueToString } from "./util";

const FgBlack = "\x1b[30m";
const FgRed = "\x1b[31m";
const FgGreen = "\x1b[32m";
const FgYellow = "\x1b[33m";
const FgCyan = "\x1b[36m";
const FgWhite = "\x1b[37m";

let defaultLogLevels: string[] = ["INFO", "WARN", "ERROR"];
let defaultNamespaces: string[] = ["ALL"];
detectDefaultLogLevelsFromArgs();

export interface Logger {
	debug(...args: any[]);
	log(...args: any[]);
	trace(...args: any[]);
	info(...args: any[]);
	warn(...args: any[]);
	error(...args: any[]);
}

class ConsoleLogger implements Logger {
	public constructor(
		private namespace: String,
		private pkg: string,
		private prefix?: String
	) { }

	private makeLogger(logger: Function, level: string, color: string = FgWhite) {
		let me = this;
		return function (message?: any, ...optionalParams: any[]) {
			// check the rules
			if (defaultLogLevels.count(l => l === level || l === "ALL") === 0) {
				return;
			}
			if (
				defaultNamespaces.count(n => n === me.namespace || n === "ALL") === 0
			) {
				return;
			}

			// populate the argumenst
			let args = Array.from(arguments);

			// create the message
			const _message =
				`${new Date().toISOString()} - ${level} - ${this.namespace}` +
				(me.prefix ? ` - ${me.prefix}` : "");
			args.unshift(_message);

			// attach the collor
			if (color) args.unshift(color + "%s" + color);

			// format the arguments
			let _args = [];
			args.forEach(a => {
				_args.pushRange(formatValueToString(a));
			});

			// execute the handler
			logger.apply(this, _args);
		};
	}

	public debug: (...args: any[]) => void = this.makeLogger(
		console.debug,
		"DEBUG"
	);
	public log: (...args: any[]) => void = this.makeLogger(console.debug, "DEBUG");
	public error: (...args: any[]) => void = this.makeLogger(
		console.error,
		"ERROR",
		FgRed
	);
	public warn: (...args: any[]) => void = this.makeLogger(
		console.warn,
		"WARN",
		FgYellow
	);
	public info: (...args: any[]) => void = this.makeLogger(
		console.info,
		"INFO",
		FgGreen
	);
	public trace: (...args: any[]) => void = this.makeLogger(
		console.trace,
		"TRACE",
		FgCyan
	);
}

export function loggerFactory(
	namespace: string,
	pkg: Type<any>,
	prefix?: string
): Logger;
export function loggerFactory(
	namespace: string,
	pkg: string,
	prefix?: string
): Logger;
export function loggerFactory(
	namespace: string,
	pkg: Type<any> | string,
	prefix?: string
): Logger {
	if (typeof pkg === "function")
		return new ConsoleLogger(namespace, pkg.name, prefix);
	else return new ConsoleLogger(namespace, pkg, prefix);
}

function detectDefaultLogLevelsFromArgs() {
	if (process.argv.count(a => a === "--verbose") > 0) {
		defaultLogLevels.push("DEBUG", "TRACE");
	}

	process.argv.filter(a => a.indexOf("--logger-filter=") !== -1).forEach(a => {
		defaultNamespaces.pushRange(a.replace("--logger-filter=", "").split(","));
	});
	if (defaultNamespaces.length === 0) {
		defaultNamespaces = ["ALL"];
	}
}
export function makeLoggingSilent() {
	defaultLogLevels = [];
}
export function enableDebugModeForLogging() {
	if (!defaultLogLevels) defaultLogLevels = [];
	defaultLogLevels.push("DEBUG", "TRACE");
}
