import { Injector } from "./di/injector";
import { SingletonInjector } from "./di/singleton-injector";
import { BOOTABLE_PROVIDER_TOKEN, OnBoot } from "./bootable";

export class Application {
	public constructor(private injector: Injector) { }
	public async boot(): Promise<any> {

		return new Promise((resolve, reject) => {
			let singletonInjector = this.injector.createChildInjector(
				SingletonInjector
			);



			let bootstraps: OnBoot[] = singletonInjector.get<OnBoot[]>(
				BOOTABLE_PROVIDER_TOKEN
			);

			if (bootstraps.length === 0) {
				resolve();
				return;
			}
			Promise.all(bootstraps.map(boot => {
				if (boot.boot)
					boot.boot();
			}))
				.then(resolve)
				.catch(reject);
		});
	}
}
