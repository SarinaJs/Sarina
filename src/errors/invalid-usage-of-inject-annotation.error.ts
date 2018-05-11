import { DependencyInjectionError } from "./di-base.error";

export class InvalidUsageOfInjectAnnotation extends DependencyInjectionError {
	public code = "invalid-inject-annotation-definition";
	public template = "@Inject' annotation only is possible on constructor parameters.";
	public helpTemplate = "You have used @Inject annoation on {1} for {0}. The @Inject annoation only allowed for constructor parameter and you can't use it for functions of class. To fix this error remove the @Inject annotation for {1} in {0}.";
}
