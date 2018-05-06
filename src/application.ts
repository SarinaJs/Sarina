import { Injector } from "./di/injector";
import { BOOTABLE_PROVIDER_TOKEN, OnBoot } from "./bootable";

export class Application {
  public constructor(private injector: Injector) {}
  public async boot(): Promise<any> {
    return new Promise((resolve, reject) => {
      let bootstraps: OnBoot[] = this.injector.get<OnBoot[]>(
        BOOTABLE_PROVIDER_TOKEN
      );
      Promise.all(bootstraps.map(boot => boot.boot()))
        .then(resolve)
        .catch(reject);
    });
  }
}
