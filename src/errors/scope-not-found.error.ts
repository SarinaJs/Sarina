import { DependencyInjectionError } from "./di-base.error";
import { Token } from "./../di/token";

export class ScopeNotFoundError extends DependencyInjectionError {
	public code = "scope-not-found";
	public message = "The injector defined with scope of {0} not found.";
	public note = "This cause with registration of scopes in logic of application. be sure that you have registred the {0} scope in the process.";

	constructor(scope: Token) {
		super(arguments);
	}
}
