import { DependencyInjectionError } from "./di-base.error";
import { Token } from './../di/token';

export class MultipleProviderFoundForTypeError extends DependencyInjectionError {
	public code = "multiple-provider-found-for-type";
	public message = "Multiple provider found for {0}!";
	public note = "The provider is multi, instead of 'get' use 'getAll' to fetch all providers for '{0}'.";

	constructor(token: Token) {
		super(arguments);
	}
}
