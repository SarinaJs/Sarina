import { error } from "util";
import { isType, Type } from "./type";
import { formatValueToString } from "./util";
import { Version } from "./version";

export abstract class RuntimeError extends Error {

	private parameters: any[];

	private _type: string;
	private _namespace: string;
	private _code: string;
	private _message: string;
	private _note: string;
	private _url: string;
	private _finalMessage: string;

	// Type
	public get type(): string {
		return this._type;
	}
	public set type(type: string) {
		this._type = this.formatType(type, this.parameters);
	}
	// Namespace
	public get namespace(): string {
		return this._namespace;
	}
	public set namespace(namespace: string) {
		this._namespace = ((this._namespace && this._namespace !== "") ? this._namespace + ":" : "") + this.formatNamespace(namespace, this.parameters);
	}
	// Code
	public get code(): string {
		return this._code;
	}
	public set code(code: string) {
		this._code = this.formatCode(code, this.parameters);
	}
	// Message
	public get message() {
		return this._message;
	}
	public set message(message: string) {
		this._message = this.formatMessage(message, this.parameters);
	}
	// Note
	public get note(): string {
		return this._note;
	}
	public set note(note: string) {
		this._note = this.formatNote(note, this.parameters);
	}
	// Url
	public get url(): string {
		return this._url;
	}
	public set url(url: string) {
		this._url = this.formatUrl(url, this.parameters);
	}


	constructor(...parameters: any[]) {
		super();
		this.parameters = parameters;

		this.type = this.constructor.name;
	}
	public toString() {
		let message = `[${this._type}] ${this._message}`;
		if (this._namespace) message += `\n\tNamespace: ${this._namespace}`;
		if (this._code) message += `\n\tCode: ${this._code}`;
		if (this._note) message += `\n\tNote: ${this._note}`;
		if (this._url) message += `\n\tUrl: ${this._url}`;
		return message;
	}
	protected formatType(type: string, parameters: any[]) {
		return this.formatTemplate(type, parameters);
	}
	protected formatNamespace(namespace: string, parameters: any[]) {
		return this.formatTemplate(namespace, parameters);
	}
	protected formatCode(code: string, parameters: any[]) {
		return this.formatTemplate(code, parameters);
	}
	protected formatMessage(message: string, parameters: any[]) {
		return this.formatTemplate(message, parameters);
	}
	protected formatNote(note: string, parameters: any[]) {
		return this.formatTemplate(note, parameters);
	}
	protected formatUrl(url: string, parameters: any[]) {
		return this.formatTemplate(url, parameters);
	}

	private formatTemplate(
		template: string,
		parameters: any[]
	) {
		if (template == null) {
			return "";
		}

		return template.replace(/\{\d+\}/g, function (match) {
			let index = +match.slice(1, -1);
			if (index < parameters.length) {
				if (typeof parameters[index] === "symbol") {
					return (parameters[index] as Symbol).toString();
				}
				return formatValueToString(parameters[index]).join(" ");
			}
			return match;
		});
	}
}
