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
  Dependency,
  ScopeSupportProvider
} from "./provider";
import { Container } from "./container";

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
export const CircularDependencyDetectedError: (
  source: any,
  destination: any
) => RuntimeError = makeErrorFactory({
  namespace: "sarina",
  code: "di:circular-dependency-detected",
  template: "Circular dependency detected for {0} to {1}",
  helpTemplate:
    "We dont support circular dependency. Remove dependency of {1} from {0}."
});
export const ScopeNotFoundError: (
  scope: Token
) => RuntimeError = makeErrorFactory({
  namespace: "sarina",
  code: "di:scope-not-found",
  template: "The injector defined with scope of {0} not found.",
  helpTemplate:
    "This cause with registration of scopes in logic of application. be sure that you have registred the {0} scope in the process."
});

export const INJECTOR_PROVIDER_TOKEN = new StaticToken({
  description: "INJECTOR_PROVIDER_TOKEN",
  multiple: false
});

interface ActiveProvider {
  provider: Provider;
  instance: any;
}

export abstract class Injector {
  public abstract getScope(): Token;
  protected logger: Logger = null;
  private activeProviders: ActiveProvider[] = [];

  constructor(private container: Container, private parent?: Injector) {
    this.logger = loggerFactory("sarina:di", "Injector");
  }

  // public methods
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

    this.logger.debug("Get<", token, "> Result:", resultObjects.length);
    if (!isMulti) {
      return resultObjects[0] as any;
    }
    return resultObjects as any;
  }
  public async destory(): Promise<any> {
    return this.destoryAllActiveProviders();
  }
  public createChildInjector(injector: Type<Injector>): Injector {
    return this.instantiateType(injector, [this.container, this]);
  }

  // Token detection process
  private detectIsTokenMulti(token: Token) {
    if (token instanceof StaticToken) {
      return (token as StaticToken).multiple || false;
    }
    return false;
  }

  // activation process
  private resolveToken(token: Token, isMulti: boolean) {
    // TODO : review this line
    if (token === Injector) {
      return [this];
    }
    let providers = this.container.locateProviders(token);
    return providers.map(provider => this.resolveProvider(provider));
  }
  private resolveProvider(provider: Provider) {
    let scope: Token = null;

    // its scope support provider
    if ((provider as Object).hasOwnProperty("scope")) {
      scope = (provider as ScopeSupportProvider).scope;
    }

    if (!scope) this.activateProvder(provider);

    // locate the injector
    let injector = this.locateInjector(scope);
    if (!injector) throw ScopeNotFoundError(scope);

    return (
      injector.locateProviderFromActivatedProviders(provider) ||
      injector.activateProvder(provider)
    );
  }

  private locateProviderFromActivatedProviders(provider: Provider) {
    let activeProvider = this.activeProviders.find(
      ap => ap.provider === provider
    );
    if (activeProvider) {
      return activeProvider.instance;
    }
    return null;
  }
  private activateProvder(provider: Provider) {
    let instance = undefined;

    if ((provider as Object).hasOwnProperty("useType")) {
      instance = this.activateTypeProvider(provider as TypeProvider);
    }
    if ((provider as Object).hasOwnProperty("useValue")) {
      instance = this.activateValueProvider(provider as ValueProvider);
    }
    if ((provider as Object).hasOwnProperty("useFactory")) {
      instance = this.activateFactoryProvider(provider as FactoryProvider);
    }

    // register instance as active provider
    this.activeProviders.push({
      provider: provider,
      instance: instance
    });

    return instance;
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

  // scope management process
  private locateInjector(scope: Token): Injector {
    if (scope == null) return this;
    if (this.getScope() === scope) return this;
    if (!this.parent) {
      return null;
    }
    return this.parent.locateInjector(scope);
  }

  // destorition process
  private async destoryAllActiveProviders(): Promise<any> {
    let me = this;
    return new Promise(function(resolve, reject) {
      me.activeProviders.forEach(ap => {
        delete ap.instance;
      });
      resolve();
    });
  }
}
