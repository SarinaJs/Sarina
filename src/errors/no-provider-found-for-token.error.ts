import { DependencyInjectionError } from "./di-base.error";
import { Token } from "./../di/token";

export class NoProviderFoundForTokenError extends DependencyInjectionError {
	public code = "no-provider-found-for-token";
	public message = "No provider found for {0}!";
	public note = "Maybe you have missed to add the '{0}' to the package providers.";

	constructor(token: Token) {
		super(arguments);
	}
}
