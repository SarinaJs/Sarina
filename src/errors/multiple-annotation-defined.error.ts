import { SarinaError } from "./../error";


export class MultipleAnnotationDefinedError extends SarinaError {
	public code = "metadata:defined_multiple_annotation";
	public template = "Multiple '{0}' annotation found for '{1}'.";
	public helpTemplate =
		"The '{0}' annotation has defined more than once for {1}.You should remove one of '{0}' annotation from the {1}.";
}
