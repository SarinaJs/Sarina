import { Type } from "./../type";
export class StaticToken {
  public description?: string;
  public multiple?: boolean;
  public constructor(options?: { description?: string; multiple?: boolean }) {
    this.description = !options ? "" : options.description;
    this.multiple = !options ? false : options.multiple;
    (this as any)._toStringSupport = true;
  }
  public toString = (): string => {
    return (
      "{ name: '" + this.description + "', multiple: '" + this.multiple + "'}"
    );
  };
}

export type Token = StaticToken | Type<any> | Symbol;
