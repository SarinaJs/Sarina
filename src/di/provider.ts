import { RuntimeError, makeErrorFactory } from "./../error/error";
import {
  TypeDecorator,
  TypeDecoratorFactory,
  getMetadata,
  makeParamDecoratorFactory,
  makeTypeDecoratorFactory,
  setMetadata
} from "./../metadata/decorators";

import { StaticToken } from "./token";
import { Type } from "./../type";
import { loggerFactory } from "./../core-logger";

/*

	Providers:
		- Provider should have at least one Token
		- Provider can have more than one Token
		- Tokens:
			- Overwrite supported for token
			- Multi provider supported ?? TODO : we should implement this feature in 'future'
		- Types:
			- TypeProvider
				- Support dependecy injection ( Only into constructor )
			- ValueProvider
			- FactoryProvider
				- Support dependecy injection ( as function parameters )

*/
export interface Dependency {
  token: StaticToken;
  optional: boolean;
}
export interface Interceptor {
  beforeInstantiate?: () => void;
}

export interface ProviderBase {
  tokens?: StaticToken[];
  interceptors?: any[];
}
export interface TypeProvider extends ProviderBase {
  useType: Type<any>;
  dependencies: Dependency[];
}
export interface ValueProvider extends ProviderBase {
  useValue: any;
}
export interface FactoryProvider extends ProviderBase {
  useFactory: () => any;
  dependencies: Dependency[];
}
export type Provider = TypeProvider | ValueProvider | FactoryProvider;

// ERRORS
export const InvalidUsageOfInjectAnnotation: (
  target: Type<any>,
  propertyKey: string | symbol
) => RuntimeError = makeErrorFactory({
  namespace: "sarina",
  code: "di:invalid-inject-annotation-definition",
  template: "'@Inject' annotation only is possible on constructor parameters.",
  helpTemplate:
    "You have used @Inject annoation on {1} for {0}. The @Inject annoation only allowed for constructor parameter and you can't use it for functions of class. To fix this error remove the @Inject annotation for {1} in {0}."
});

// THE PROVIDER META_KEY
const __PROVIDER_METADATA__ = "sarina::provider";
const __PROVIDER_INJECT_METADATA__ = "sarina::provider::dependency";

interface InjectMetadata {
  index: number;
  dependency: Dependency;
}
export const InjectDecoratorFactory = (token: StaticToken) => {
  return function(
    target: Type<any>,
    propertyKey: string | symbol,
    parameterIndex: number
  ) {
    // only constructor parameter is allowed
    if (propertyKey) {
      throw InvalidUsageOfInjectAnnotation(target, propertyKey);
    }

    let deps = getMetadata<InjectMetadata[]>(
      __PROVIDER_INJECT_METADATA__,
      target,
      []
    );

    let propertyDep: InjectMetadata = deps.find(
      dep => dep.index === parameterIndex
    );
    if (!propertyDep) {
      propertyDep = {
        index: parameterIndex,
        dependency: {
          token: null,
          optional: false
        }
      };
      deps.push(propertyDep);
    }

    propertyDep.dependency.token = token;

    setMetadata(__PROVIDER_INJECT_METADATA__, target, deps);
  };
};

// THE PROVIDER DECORATOR FACTORY
export const ProviderDecoratorFactory = (provider?: {
  tokens?: StaticToken[];
}) => {
  return function(target: Type<any>) {
    // fetch all current providers metdata
    let the_provider = getMetadata<TypeProvider>(
      __PROVIDER_METADATA__,
      target,
      {
        useType: target,
        tokens: [],
        dependencies: []
      }
    );

    target.prototype.__type__ = target.name;

    // add current provider to the list of tokens
    if (the_provider.tokens.count(t => target === t) === 0) {
      the_provider.tokens.push(target);
    }

    // add all tokens into final result
    if (provider && provider.tokens)
      the_provider.tokens.pushRange(provider.tokens);

    // fetch dependencies
    const constructor_dependecnies = getMetadata(
      "design:paramtypes",
      target,
      []
    );
    const constructor_inject: InjectMetadata[] = getMetadata<any[]>(
      __PROVIDER_INJECT_METADATA__,
      target,
      []
    );
    the_provider.dependencies = constructor_dependecnies.map((cdep, index) => {
      let dependency: Dependency = {
        token: null,
        optional: false
      };
      let inject = constructor_inject.find(inject => inject.index === index);
      if (inject) {
        dependency.token = inject.dependency.token || cdep;
        dependency.optional = inject.dependency.optional || false;
      } else {
        dependency.token = cdep;
      }
      return dependency;
    });
    setMetadata(__PROVIDER_METADATA__, target, the_provider);
  };
};

// The provider decorator factory
export const Provider: (
  provider?: { tokens?: StaticToken[] }
) => TypeDecorator = makeTypeDecoratorFactory([ProviderDecoratorFactory]);

// The inject decorator factory
// 		- The original inject factory
export const Inject: (
  token?: StaticToken
) => ParameterDecorator = makeParamDecoratorFactory([InjectDecoratorFactory]);

export const getProvider = (type: Type<any>) =>
  getMetadata<Provider>(__PROVIDER_METADATA__, type);
