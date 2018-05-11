import { SarinaError } from "./../error";

export class NoPackageAnnotationError extends SarinaError {
	public code = "package:no-package-annotation";
	public template = "No 'Package' annotation found for '{0}'.";
	public helpTemplate = "You should define '@Package' decorator for '{0}'.";
}
