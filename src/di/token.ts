import { Type } from "./../type";
export class ProviderToken {
	public description?: string;
	public multiple?: boolean;
	public constructor(options: { description?: string; multiple?: boolean }) {
		this.description = !options ? "" : options.description;
		this.multiple = !options ? false : options.multiple;
	}
	public toString = (): string => {
		return (
			"{ description: '" +
			this.description +
			"', multiple: '" +
			this.multiple +
			"'}"
		);
	};
}

export type Token = ProviderToken | Type<any>;
