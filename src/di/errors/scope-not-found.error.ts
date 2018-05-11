import { DependencyInjectionError } from "./di-base.error";

export class ScopeNotFoundError extends DependencyInjectionError {
	public code = "scope-not-found";
	public template = "The injector defined with scope of {0} not found.";
	public helpTemplate = "This cause with registration of scopes in logic of application. be sure that you have registred the {0} scope in the process.";
}
