import { Token, StaticToken } from "./token";
import {
  TypeDecorator,
  makeTypeDecoratorFactory
} from "./../metadata/decorators";
import { ScopeDecoratorFactory } from "./provider";
import { Container } from "./container";
import { Injector } from "./injector";

export const SINGLETON_INJECTOR_SCOPE: Token = new StaticToken({
  description: "SINGLETON_INJECTOR"
});

export class SingletonInjector extends Injector {
  public constructor(container: Container, parent?: Injector) {
    super(container, parent);
  }

  public getScope(): Token {
    return SINGLETON_INJECTOR_SCOPE;
  }
}

export const Singleton: () => TypeDecorator = makeTypeDecoratorFactory([
  (...args: any[]) => ScopeDecoratorFactory(SINGLETON_INJECTOR_SCOPE)
]);
