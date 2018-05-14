import { RuntimeError } from "./../error";
import { Version } from "./../version";

export class DependencyInjectionError extends RuntimeError {
	public namespace = "sarina/core";
	public code = "sarina:di"
	public url = Version.website + "/doc/" + Version.version + "/errors/{code}";
}

