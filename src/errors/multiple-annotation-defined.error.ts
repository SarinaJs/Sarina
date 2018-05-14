import { RuntimeError } from "./../error";
import { Type } from './../type';


export class MultipleAnnotationDefinedError extends RuntimeError {
	public code = "metadata:defined_multiple_annotation";
	public message = "Multiple '{0}' annotation found for '{1}'.";
	public note =
		"The '{0}' annotation has defined more than once for {1}.You should remove one of '{0}' annotation from the {1}.";

	constructor(decorator: string, target: Type<any>) {
		super(decorator, target);
	}
}
