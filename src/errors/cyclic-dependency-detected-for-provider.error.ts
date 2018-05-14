import { DependencyInjectionError } from "./di-base.error";
import { Provider } from "./../di/provider";
import { Token } from "./../di/token";

export class CyclicDependencyDetectedForProviderError extends DependencyInjectionError {
	public code = "cyclic-dependency-detected-for-provider";
	public message = "Cyclic dependency detected for {0}!";
	public note = "Cyclic dependency injection not supported! The {0} has dependency to {1} and vice versa. You should remove one of the dependency.";

	constructor(provider: Provider, token: Token) {
		super(arguments);
	}
}
