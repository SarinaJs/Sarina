import { Package } from "./package";
import { ServiceScope } from "./di/service-scope";
import { SingletonScope } from "./di/singleton-scope";

@Package({
  providers: [ServiceScope, SingletonScope]
})
export class SarinaCorePackage {}
