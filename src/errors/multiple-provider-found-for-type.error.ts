import { DependencyInjectionError } from "./di-base.error";

export class MultipleProviderFoundForTypeError extends DependencyInjectionError {
	public code = "multiple-provider-found-for-type";
	public template = "Multiple provider found for {0} !";
	public helpTemplate = "The provider is multi, instead of 'get' use 'getAll' to fetch all providers for '{0}'.";
}
