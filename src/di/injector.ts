import { Type, isType } from "./../type";
import { makeErrorFactory, RuntimeError } from "./../error/error";
import { generateId } from "./../util";
import { loggerFactory, Logger } from "./../core-logger";
import { Token, StaticToken } from "./token";
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
  public key: string = undefined;
  private providerWrappers: ProviderWrapper[] = [];
  private tokensWrappers: TokenWrapper[] = [];
  private logger: Logger = null;

  // create an injector class
  constructor(
    public dependencies: Injector[],
    providers: Provider[],
    name?: string
  ) {
    this.key = name || generateId(5);
    this.logger = loggerFactory("sarina:di", Injector, this.key);

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

  public static print(injector: Injector, level: number = 0) {
    let logger = loggerFactory("sarina::di", Injector);
    let me = this;
    function debug(...args: any[]) {
      let tabs = "";
      for (let i = 0; i < level; i++) tabs += "  ";
      args.unshift(tabs);
      logger.debug.apply(logger, args);
    }

    debug("|- [Injector][" + injector.key + "]");
    injector.tokensWrappers.forEach((tw, i) => {
      debug("  |- [TOKEN]", tw.token);
      tw.providerWrappers.forEach((pw, j) => {
        let _pw = pw.provider as any;

        if (_pw.useType) {
          debug("  | |- [TYPE-PROVIDER]", _pw.useType);
        }
        if (_pw.useValue) {
          debug("  | |- [VALUE-PROVIDE]", _pw.useType);
        }
        if (_pw.useFactory) {
          debug("  | |- [FACTORY-PROVI]", _pw.useType);
        }
        if (_pw.dependencies) {
          _pw.dependencies.forEach(d => {
            debug(
              "  | | |-  DEP {",
              d.token,
              "-",
              d.optional ? "options" : "required",
              "}"
            );
          });
        }
      });
    });
    injector.dependencies.forEach(dep => {
      Injector.print(dep, level + 1);
    });
  }

  public get<T>(token: Token): T {
    // check if token is multiple provider or not
    let isMulti = this.detectIsTokenMulti(token);

    // load the all instances of token with out any error
    let resultObjects = this.resolveToken(token, isMulti);

    if (!isMulti && resultObjects.length > 1) {
      throw MultipleProviderFoundForTypeError(token);
    }
    if (!isMulti && resultObjects.length === 0) {
      throw NoProviderFoundForTokenError(token);
    }

    this.logger.debug("Get<T> Result:", resultObjects.length);
    if (!isMulti) {
      return resultObjects[0] as any;
    }
    return resultObjects as any;
  }

  private detectIsTokenMulti(token: Token) {
    if (token instanceof StaticToken) {
      return (token as StaticToken).multiple || false;
    }
    return false;
  }

  private resolveToken(token: Token, isMulti: boolean) {
    let tokenWrappers = this.locateTokenWrappers(token, isMulti);
    let instances = [];
    tokenWrappers.forEach(tw =>
      instances.pushRange(this.activateTokenWrapper(tw))
    );
    return instances;
  }
  private locateTokenWrappers(token: Token, isMulti: boolean) {
    let tokenWrappers = this.tokensWrappers.filter(t => t.token === token);
    if (isMulti || tokenWrappers.length === 0) {
      this.dependencies.forEach(childInjector => {
        tokenWrappers.pushRange(
          childInjector.locateTokenWrappers(token, isMulti)
        );
      });
    }
    this.logger.debug(
      "locateTokenWrappers token:",
      token,
      "Result:" + tokenWrappers.length
    );
    return tokenWrappers;
  }
  private activateTokenWrapper(tokenWrapper: TokenWrapper) {
    return tokenWrapper.providerWrappers.map(pw =>
      this.activateProvderWrapper(pw)
    );
  }
  private activateProvderWrapper(providerWrapper: ProviderWrapper) {
    let provider = providerWrapper.provider;
    if (providerWrapper.instance) {
      return providerWrapper.instance;
    }

    if (providerWrapper.isPending) {
      throw circularDependencyDetectedError(providerWrapper.provider, null); // TODO : Throw valid error
    }

    providerWrapper.isPending = true;

    if ((provider as Object).hasOwnProperty("useType")) {
      providerWrapper.instance = this.activateTypeProvider(
        provider as TypeProvider
      );
    }
    if ((provider as Object).hasOwnProperty("useValue")) {
      providerWrapper.instance = this.activateValueProvider(
        provider as ValueProvider
      );
    }
    if ((provider as Object).hasOwnProperty("useFactory")) {
      providerWrapper.instance = this.activateFactoryProvider(
        provider as FactoryProvider
      );
    }

    providerWrapper.isPending = false;
    return providerWrapper.instance;
  }
  private activateTypeProvider(provider: TypeProvider) {
    let deps: any[] = [];
    if (provider.dependencies && provider.dependencies.length > 0) {
      deps = this.resolveDependencies(provider, provider.dependencies);
    }

    return this.instantiateType(provider.useType, deps);
  }
  private activateValueProvider(provider: ValueProvider) {
    return provider.useValue;
  }
  private activateFactoryProvider(provider: FactoryProvider) {
    let deps: any[] = [];
    if (provider.dependencies && provider.dependencies.length > 0) {
      deps = this.resolveDependencies(provider, provider.dependencies);
    }
    return provider.useFactory.apply(this, deps);
  }
  private resolveDependencies(provider: Provider, dependencies: Dependency[]) {
    return dependencies.map(dep => this.resolveDependency(dep, provider));
  }
  private resolveDependency(dep: Dependency, provider: Provider) {
    let isDepMulti = this.detectIsTokenMulti(dep.token);
    let resolvedObject = this.get<any>(dep.token);
    if (!isDepMulti && !dep.optional && !resolvedObject) {
      throw NoProviderFoundForTypeDependencyError(provider, dep.token);
    }
    return resolvedObject;
  }

  private instantiateType(type: Type<any>, args: any[]) {
    let instance = Reflect.construct(type, args);
    return instance;
  }
}
