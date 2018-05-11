import { DependencyInjectionError } from "./di-base.error";

export class NoProviderFoundForTypeDependencyError extends DependencyInjectionError {
	public code = "no-provider-found-for-type-dependency";
	public template = "Can't resolve the dependency of {1} for {0}!";
	public helpTemplate = "The injector service couldn't find any {0} to inject into {1}. Be sure that you have defined the {1} as providers in module. Or you can make dependency Optional by using '@Optional' decorator.";
}
