import { SarinaError } from "./../../error";

export class DependencyInjectionError extends SarinaError {
	public code = "di" + ((this.code) ? ":" + this.code : "");
}

