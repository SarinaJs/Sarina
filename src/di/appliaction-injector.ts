import { Token, StaticToken } from "./token";
import {
  TypeDecorator,
  makeTypeDecoratorFactory
} from "./../metadata/decorators";
import { ScopeDecoratorFactory } from "./provider";
import { Container } from "./container";
import { Injector } from "./injector";

export const APPLICATION_INJECTOR_SCOPE: Token = new StaticToken({
  description: "APPLICATION_INJECTOR"
});

export class ApplicationInjector extends Injector {
  public constructor(container: Container, parent?: Injector) {
    super(container, parent);
  }

  public getScope(): Token {
    return APPLICATION_INJECTOR_SCOPE;
  }
}
