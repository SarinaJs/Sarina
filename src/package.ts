import { Type } from "./type";
import { StaticToken } from "./di/token";
import { Provider, ProviderDecoratorFactory } from "./di/provider";
import {
  TypeDecorator,
  makeTypeDecoratorFactory,
  getMetadata,
  setMetadata,
  MultipleAnnotationDefinedError
} from "./metadata/decorators";

// The package provider token
export const PACKAGE_PROVIDER_TOKEN: StaticToken = new StaticToken({
  description: "PACKAGE_PROVIDER",
  multiple: true
});

// The package definition
export interface Package {
  name?: string;
  imports?: Array<Type<any> | Package>;
  providers?: Array<Type<any> | Provider>;
}

// The key which metadata of package will store into target type
const __PACKAGE_METADATA__ = "sarina:package";

// The package decorator factory instance
export const PackageDecoratorFactory = (the_package: Package) => {
  return function(target: Type<any>) {
    let _the_package = getMetadata<Package>(__PACKAGE_METADATA__, target);
    if (_the_package != null) {
      throw MultipleAnnotationDefinedError("@Package", target);
    }
    the_package.name = the_package.name || target.name;
    setMetadata(__PACKAGE_METADATA__, target, the_package);
  };
};

// The package decorator with two multiple decorator
// 		- package decorator factory
// 		- provider decorator factory for this module
export const Package: (
  the_package: Package
) => TypeDecorator = makeTypeDecoratorFactory([
  PackageDecoratorFactory,
  (pkg: Package) => {
    // register current module class a ModuleProvider
    return ProviderDecoratorFactory({
      tokens: [PACKAGE_PROVIDER_TOKEN]
    });
  }
]);

export const getPackage = (type: Type<any>) =>
  getMetadata<Package>(__PACKAGE_METADATA__, type);
