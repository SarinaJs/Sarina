import { Type, isType } from "./../type";
import { SarinaError } from "./../error";
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

import { NoProviderFoundForTokenError } from "./../errors/no-provider-found-for-token.error";
import { NoProviderFoundForTypeDependencyError } from "./../errors/no-provider-found-for-type-dependency.error";
import { MultipleProviderFoundForTypeError } from "./../errors/multiple-provider-found-for-type.error";
import { ScopeNotFoundError } from "./../errors/scope-not-found.error";

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
      throw new MultipleProviderFoundForTypeError(token);
    }
    if (!isMulti && resultObjects.length === 0) {
      throw new NoProviderFoundForTokenError(token);
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
    let providers = this.container.locate(token);
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
    if (!injector) throw new ScopeNotFoundError(scope);

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
      throw new NoProviderFoundForTypeDependencyError(provider, dep.token);
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
