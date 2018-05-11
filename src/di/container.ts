import { Token, StaticToken } from "./token";
import { Provider } from "./provider";
import { generateId } from "./../util";
import { loggerFactory, Logger } from "./../core-logger";

interface TokenWrapper {
  token: Token;
  providers: Provider[];
}

export class Container {
  public key: string = undefined;
  private tokensWrappers: TokenWrapper[] = [];
  private logger: Logger;

  public constructor(
    public parentContainers: Container[],
    providers: Provider[],
    key?: string
  ) {
    this.key = key || generateId(5);

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

  public static print(container: Container, level: number = 0) {
    let logger = loggerFactory("sarina::di", Container, container.key);
    let me = this;
    function debug(...args: any[]) {
      let tabs = "";
      for (let i = 0; i < level; i++) tabs += "  ";
      args.unshift(tabs);
      logger.debug.apply(logger, args);
    }

    debug("|- [Container][" + container.key + "]");
    container.tokensWrappers.forEach((tw, i) => {
      debug("  |- [TOKEN]", tw.token);
      tw.providers.forEach((p, j) => {
        let _p = p as any;

        if (_p.useType) {
          debug("  | |- [TYPE-PROVIDER]", _p.useType);
        }
        if (_p.useValue) {
          debug("  | |- [VALUE-PROVIDE]", _p.useType);
        }
        if (_p.useFactory) {
          debug("  | |- [FACTORY-PROVI]", _p.useType);
        }
        if (_p.dependencies) {
          _p.dependencies.forEach(d => {
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
    container.parentContainers.forEach(dep => {
      Container.print(dep, level + 1);
    });
  }

  public exists(token: Token) {
    return this.locateProviderByToken(token).length > 0;
  }
  public locate(token: Token) {
    let providers: Provider[] = [];
    this.locateProviderByToken(token).forEach(tw => {
      providers.pushRange(tw.providers);
    });
    return providers;
  }

  private locateProviderByToken(token: Token): TokenWrapper[] {
    let tokenWrappers: TokenWrapper[] = [];
    tokenWrappers.pushRange(this.locateProviderInCurrentContainer(token));
    tokenWrappers.pushRange(this.locateProviderInParentContainers(token));
    return tokenWrappers;
  }
  private locateProviderInCurrentContainer(token: Token) {
    return this.tokensWrappers.filter(tw => tw.token === token);
  }
  private locateProviderInParentContainers(token: Token) {
    let tokenProviders: TokenWrapper[] = [];
    this.parentContainers.forEach(parentInjector => {
      tokenProviders.pushRange(parentInjector.locateProviderByToken(token));
    });
    return tokenProviders;
  }
}
