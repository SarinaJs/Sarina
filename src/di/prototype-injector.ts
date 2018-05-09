import { Token, StaticToken } from "./token";
import {
  TypeDecorator,
  makeTypeDecoratorFactory
} from "./../metadata/decorators";
import { ScopeDecoratorFactory } from "./provider";
import { Container } from "./container";
import { Injector } from "./injector";

export const PROTOTYPE_INJECTOR_SCOPE: Token = new StaticToken({
  description: "PROTOTYPE_INJECTOR"
});

export class PrototypeInjector extends Injector {
  public constructor(container: Container, parent: Injector) {
    super(container, parent);
  }

  public getScope(): Token {
    return PROTOTYPE_INJECTOR_SCOPE;
  }
}

export const Prototype: () => TypeDecorator = makeTypeDecoratorFactory([
  (...args: any[]) => ScopeDecoratorFactory(PROTOTYPE_INJECTOR_SCOPE)
]);
