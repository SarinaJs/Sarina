import { Type, isType } from "./../type";
import { makeErrorFactory, RuntimeError } from "./../error/error";
import { Token, StaticToken } from "./token";
import { generateId } from "./../util";
import {
  Provider,
  TypeProvider,
  FactoryProvider,
  ValueProvider,
  Dependency
} from "./provider";

export const NoProviderFoundForTokenError: (
  token: any
) => RuntimeError = makeErrorFactory({
  namespace: "sarina",
  code: "di:no-provider-found-for-token",
  template: "No provider for {0} !",
  helpTemplate:
    "Maybe you have missed to add the '{0}' to the package providers."
});
export const NoProviderFoundForTypeDependencyError: (
  provider: Provider,
  token: any
) => RuntimeError = makeErrorFactory({
  namespace: "sarina",
  code: "di:no-provider-found-for-type-dependency",
  template: "Can't resolve the dependency of {1} for {0}!",
  helpTemplate:
    "The injector service couldn't find any {0} to inject into {1}. Be sure that you have defined the {1} as providers in module. Or you can make dependency Optional by using '@Optional' decorator."
});
export const MultipleProviderFoundForTypeError: (
  token: any
) => RuntimeError = makeErrorFactory({
  namespace: "sarina",
  code: "di:multiple-provider-found-for-type",
  template: "Multiple provider found for {0} !",
  helpTemplate:
    "The provider is multi, instead of 'get' use 'getAll' to fetch all providers for '{0}'."
});
export const circularDependencyDetectedError: (
  source: any,
  destination: any
) => RuntimeError = makeErrorFactory({
  namespace: "sarina",
  code: "di:circular-dependency-detected",
  template: "Circular dependency detected for {0} to {1}",
  helpTemplate:
    "We dont support circular dependency. Remove dependency of {1} from {0}."
});

interface ProviderWrapper {
  provider: Provider;
  instance?: any;
  isPending?: boolean;
}
interface TokenWrapper {
  token: StaticToken;
  providerWrappers: ProviderWrapper[];
}

export class Injector {
  public key: string = generateId();
  private providerWrappers: ProviderWrapper[] = [];
  private tokensWrappers: TokenWrapper[] = [];

  // a debug util function
  private debug(...args: any[]) {
    args.unshift("sarina - Injector");
    console.debug.apply(this, args);
  }

  // TODO : Remove this method then
  private print(level: number = 0) {
    let tabs = "";
    for (let i = 0; i < level; i++) tabs += "\t";

    let injector = this;
    //////////////////////////////////////////////////////////

    this.debug(tabs, `I> Injector ( ${injector.key} )`);

    injector.providerWrappers.forEach(wrapper => {
      let provider = wrapper.provider;
      if ((provider as Object).hasOwnProperty("useType")) {
        this.debug(
          tabs,
          `\t P> TypeProvider [ `,
          (provider as TypeProvider).useType,
          `]`
        );
      }
      if ((provider as Object).hasOwnProperty("useValue")) {
        this.debug(tabs, `\t P> ValueProvider [ Value ]`);
      }
      if ((provider as Object).hasOwnProperty("useFactory")) {
        this.debug(tabs, `\t P> FactoryProvider [ Factory Function ]`);
      }

      provider.tokens.forEach(token => {
        this.debug(
          tabs,
          "\t\t T> Token [ " +
            (isType(token) ? token.name : token.toString()) +
            " ]"
        );
      });
      if ((provider as any).dependencies) {
        (provider as any).dependencies.forEach((dep: any) => {
          this.debug(tabs, `\t\t D> Dependency`, dep);
        });
      }
    });
    injector.dependencies.forEach(_injector => _injector.print(level + 1));
    //////////////////////////////////////////////////////////
  }

  // create an injector class
  constructor(public dependencies: Injector[], providers: Provider[]) {
    providers.forEach(provider => {
      let wrapper = {
        provider: provider,
        isPending: false
      };
      this.providerWrappers.push(wrapper);

      provider.tokens.forEach(pt => {
        let tokenWrapper = this.tokensWrappers.find(t => t.token === pt);
        if (!tokenWrapper) {
          if (pt instanceof StaticToken) {
            tokenWrapper = {
              token: pt,
              providerWrappers: []
            };
          } else {
            tokenWrapper = {
              token: pt,
              providerWrappers: []
            };
          }
          this.tokensWrappers.push(tokenWrapper);
        }
        tokenWrapper.providerWrappers.push(wrapper);
      });
    });
  }

  // instantiate a type
  public get<T>(token: Token): T {
    let isMulti = false;
    if (token instanceof StaticToken) {
      isMulti = (token as StaticToken).multiple || false;
    }

    let instances = this.resolveByToken(token);

    if (!isMulti && instances.length === 0) {
      throw NoProviderFoundForTokenError(token);
    }
    if (!isMulti && instances.length > 1) {
      throw MultipleProviderFoundForTypeError(token);
    }

    if (!isMulti) {
      return instances[0];
    } else {
      return instances as any;
    }
  }
  private resolveByToken(token: Token) {
    let isMulti = false;
    if (token instanceof StaticToken) {
      isMulti = (token as StaticToken).multiple || false;
    }

    let instances = this.resolveTokenInSelfRepo(token);
    if (instances.length === 0 || isMulti) {
      instances.pushRange(this.resolveProvidersByDependencies(token));
    }

    return instances;
  }
  private resolveTokenInSelfRepo(token: Token) {
    let tokenWrappers = this.tokensWrappers.filter(t => {
      return t.token === token;
    });
    // let tokenWrappers = this.tokensWrappers.filter(t => t.token === token);
    let instances: any = [];

    tokenWrappers.forEach(tw => {
      instances.pushRange(
        tw.providerWrappers.map(wrapper => this.resolveTokenWrapper(wrapper))
      );
    });
    return instances;
  }
  private resolveProvidersByDependencies(token: Token) {
    let result: any[] = [];
    this.dependencies.forEach(injector => {
      result.pushRange(injector.get(token));
    });
    return result;
  }
  private resolveTokenWrapper(wrapper: ProviderWrapper) {
    let provider = wrapper.provider;

    if (wrapper.instance) {
      return wrapper.instance;
    }

    if (wrapper.isPending) {
      throw circularDependencyDetectedError(wrapper.provider, null); // TODO : Throw valid error
    }

    // we are resolving the provider
    wrapper.isPending = true;

    if ((provider as Object).hasOwnProperty("useType")) {
      wrapper.instance = this.resolveTypeProvider(provider as TypeProvider);
    }
    if ((provider as Object).hasOwnProperty("useValue")) {
      wrapper.instance = this.resolveValueProvider(provider as ValueProvider);
    }
    if ((provider as Object).hasOwnProperty("useFactory")) {
      wrapper.instance = this.resolveFactoryProvider(
        provider as FactoryProvider
      );
    }

    wrapper.isPending = false;
    return wrapper.instance;
  }
  private resolveTypeProvider(provider: TypeProvider) {
    let deps: any[] = [];
    if (provider.dependencies) {
      deps.pushRange(
        provider.dependencies.map(dep => {
          let instance = this.get(dep.token);
          if (!dep.optional && !instance) {
            throw NoProviderFoundForTypeDependencyError(provider, dep.token);
          }
          return instance;
        })
      );
    }

    return this.instantiateType(provider.useType, deps);
  }
  private resolveValueProvider(provider: ValueProvider) {
    return provider.useValue;
  }
  private resolveFactoryProvider(provider: FactoryProvider) {
    let deps: any[] = [];
    if (provider.dependencies)
      deps.pushRange(
        provider.dependencies.map(dep => {
          let instance = this.get(dep.token);
          if (!dep.optional && !instance) {
            throw NoProviderFoundForTypeDependencyError(provider, dep.token);
          }
          return instance;
        })
      );

    return provider.useFactory.apply(this, deps);
  }
  private instantiateType(type: Type<any>, args: any[]) {
    let instance = Reflect.construct(type, args);
    return instance;
  }
}
