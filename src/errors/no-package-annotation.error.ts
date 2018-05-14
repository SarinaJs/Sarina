import { RuntimeError } from "./../error";
import { Type } from './../type';

export class NoPackageAnnotationError extends RuntimeError {
	public code = "package:no-package-annotation";
	public message = "No 'Package' annotation found for '{0}'.";
	public note = "You should define '@Package' decorator for '{0}'.";

	constructor(packageType: Type<any>) {
		super(arguments);
	}
}
