import {
  Sarina,
  Package,
  Provider,
  Bootable,
  OnBoot,
  SINGLETON_INJECTOR_SCOPE,
  Scope,
  Singleton,
  Injector,
  StaticToken
} from "./../../index";

//////////////////////////////////////////////////////////////////////////////
class SessionScope extends Injector {
  public static scope = new StaticToken({ description: "Session scope" });

  public getScope() {
    return SessionScope.scope;
  }
}
//////////////////////////////////////////////////////////////////////////////
@Provider()
@Singleton()
export class SingletonConfigService {
  private name: string = "SingletonConfigService";
  private map: any = {};
  public put(key: string, value: any) {
    this.map[key] = value;
  }
  public get(key: string) {
    return this.map[key];
  }
}
@Provider()
export class PrototypeConfigService {
  private name: string = "PrototypeConfigService";

  private map: any = {};
  public put(key: string, value: any) {
    console.log("---> key:", key, ",value:", value);
    this.map[key] = value;
  }
  public get(key: string) {
    return this.map[key];
  }
}
@Provider()
export class PrototypeTestProvider {
  constructor(
    private singletonConfigService: SingletonConfigService,
    private prototypeConfigService: PrototypeConfigService
  ) {}

  private name: string = "PrototypeTestProvider";

  public test() {
    console.log("\t Test Check:");
    console.log("\t\t singleton:", this.singletonConfigService.get("Req"));
    console.log("\t\t prototype:", this.prototypeConfigService.get("Req"));
  }
}
//////////////////////////////////////////////////////////////////////////////
// PROTOTYPE
@Provider()
export class RequestHandlerProvider {
  private name: string = "RequestHandlerProvider";
  constructor(
    private singletonConfigService: SingletonConfigService,
    private prototypeConfigService: PrototypeConfigService,
    private prototypeTestProvider: PrototypeTestProvider
  ) {}

  public process(req: string) {
    console.log("--------------------------------------------------------");
    console.log("Processing request:", req);
    console.log("\t check before execute:");
    console.log("\t\t singleton:", this.singletonConfigService.get("Req"));
    console.log("\t\t prototype:", this.prototypeConfigService.get("Req"));
    console.log("Register keys:");
    this.singletonConfigService.put("Req", req);
    this.prototypeConfigService.put("Req", req);
    console.log("\t check after execute:");
    console.log("\t\t singleton:", this.singletonConfigService.get("Req"));
    console.log("\t\t prototype:", this.prototypeConfigService.get("Req"));
    this.prototypeTestProvider.test();
    console.log("--------------------------------------------------------");
  }
}
//////////////////////////////////////////////////////////////////////////////
// SINGLETON
@Provider()
@Scope(SessionScope.scope)
export class SessionHandlerProvider {
  private name: string = "SessionHandlerProvider";
  public constructor(private request: RequestHandlerProvider) {}

  public handle(req: string) {
    return this.request.process(req);
  }
}
//////////////////////////////////////////////////////////////////////////////
// SINGLETON
@Provider({})
@Singleton()
export class WebServerProvider {
  private name: string = "WebServerProvider";
  public constructor(private injector: Injector) {}

  public async start(): Promise<any> {
    let me = this;
    return new Promise(function(resolve, reject) {
      function handleRequest(req: string) {
        let sessionInjector = me.injector.createChildInjector(SessionScope);
        let sessionHandler = sessionInjector.get<SessionHandlerProvider>(
          SessionHandlerProvider
        );
        sessionHandler.handle(req);
      }

      handleRequest("req-1");
      handleRequest("req-2");
      handleRequest("req-3");
    });
  }
}
//////////////////////////////////////////////////////////////////////////////
// The Package
@Package({
  providers: [
    WebServerProvider,
    SessionHandlerProvider,
    RequestHandlerProvider,
    SingletonConfigService,
    PrototypeConfigService,
    PrototypeTestProvider
  ]
})
@Bootable()
class HelloWorldPackage implements OnBoot {
  private name: string = "HelloWorldPackage";
  public constructor(private webServerProvider: WebServerProvider) {}

  public boot(): Promise<any> {
    let me = this;
    return new Promise(function(resolve, reject) {
      me.webServerProvider
        .start()
        .then(resolve)
        .catch(reject);
    });
  }
}
//////////////////////////////////////////////////////////////////////////////
@Package({
  imports: [HelloWorldPackage]
})
class MainPackage {}

Sarina.run(MainPackage);
