import { Token, StaticToken } from "./token";
import { Provider } from "./provider";
import { generateId } from "./../util";

interface TokenWrapper {
  token: Token;
  providers: Provider[];
}

export class Container {
  public key: string = undefined;
  private tokensWrappers: TokenWrapper[] = [];

  public constructor(
    public childContainers: Container[],
    providers: Provider[],
    name?: string
  ) {
    this.key = name || generateId(5);

    providers.forEach(provider => {
      provider.tokens.forEach(pt => {
        let tokenWrapper = this.tokensWrappers.find(t => t.token === pt);
        if (!tokenWrapper) {
          if (pt instanceof StaticToken) {
            tokenWrapper = {
              token: pt,
              providers: []
            };
          } else {
            tokenWrapper = {
              token: pt,
              providers: []
            };
          }
          this.tokensWrappers.push(tokenWrapper);
        }
        tokenWrapper.providers.push(provider);
      });
    });
  }

  public exists(token: Token) {
    return this.locateProviderByToken(token).length > 0;
  }
  public locateProviders(token: Token) {
    let providers: Provider[] = [];
    this.locateProviderByToken(token).forEach(tw => {
      providers.pushRange(tw.providers);
    });
    return providers;
  }

  private locateProviderByToken(token: Token): TokenWrapper[] {
    let tokenWrappers: TokenWrapper[] = [];
    tokenWrappers.pushRange(this.locateProviderInCurrentContainer(token));
    tokenWrappers.pushRange(this.locateProviderInChildContainer(token));
    return tokenWrappers;
  }
  private locateProviderInCurrentContainer(token: Token) {
    return this.tokensWrappers.filter(tw => tw.token === token);
  }
  private locateProviderInChildContainer(token: Token) {
    let tokenProviders: TokenWrapper[] = [];
    this.childContainers.forEach(childContainer => {
      tokenProviders.pushRange(childContainer.locateProviderByToken(token));
    });
    return tokenProviders;
  }
}
