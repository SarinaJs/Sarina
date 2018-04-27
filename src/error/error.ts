import { error } from "util";
import { isType } from "./../type";

export interface IConfig {
	maxDepth?: number;
}
export class RuntimeError extends Error {
	constructor(message: Message, parameters: any[]) {
		super("NO MESSAGE");

		let config = {
			maxDepth: 5
		};

		if (message.config) {
			config.maxDepth = message.config.maxDepth || config.maxDepth;
		}

		this.message = this.createMessage(
			this,
			message.namespace,
			message.code,
			config,
			message.template,
			message.helpTemplate || null,
			parameters
		);
	}

	private createMessage(
		errorInstance: Error,
		namespace: string,
		code: string,
		config: IConfig,
		template: string | ((...args: any[]) => string),
		helpTemplate: string | ((...args: any[]) => string),
		parameters: any[]
	): string {
		let me = this;
		let message = "[Runtime Error]\n ";
		message += "\t Code : " + (namespace ? namespace + ":" : "") + code;

		let templateArgs = parameters.map(function(param) {
			return me.toDebugString(param, config.maxDepth);
		});

		message += "\n\t Message : " + this.formatTemplate(template, templateArgs);

		if (helpTemplate) {
			message +=
				"\n\t Note : " + this.formatTemplate(helpTemplate, templateArgs);
		}

		return message;
	}

	private formatTemplate(
		template: ((...args: any[]) => string) | string,
		parameters: any[]
	) {
		let strTemplate: string = "";
		if (template == null) {
			return "";
		}
		if (typeof template === "function") {
			strTemplate = template.apply(template, parameters);
		} else {
			strTemplate = template as string;
		}

		return strTemplate.replace(/\{\d+\}/g, function(match) {
			let index = +match.slice(1, -1);
			if (index < parameters.length) {
				return parameters[index];
			}
			return match;
		});
	}

	private toDebugString(obj, maxDepth) {
		if (isType(obj)) {
			return obj.name;
		} else if (typeof obj === "function") {
			return obj.toString().replace(/ \{[\s\S]*$/, "");
		} else if (typeof obj === "undefined") {
			return "undefined";
		} else if (typeof obj !== "string") {
			return this.serializeObject(obj, maxDepth);
		}
		return obj;
	}
	private serializeObject(obj, maxDepth) {
		let seen = [];

		if (!this.isValidObjectMaxDepth(maxDepth)) {
			maxDepth = 5;
		}
		return JSON.stringify(obj);
	}

	private isValidObjectMaxDepth(maxDepth) {
		return typeof maxDepth === "number" && maxDepth > 0;
	}
}

export interface Message {
	namespace: string;
	code: string;
	template: ((...args: any[]) => string) | string;
	helpTemplate?: ((...args: any[]) => string) | string;
	config?: IConfig;
}

export function makeErrorFactory(message: Message) {
	return function(...args: any[]) {
		return new RuntimeError(message, args);
	};
}
