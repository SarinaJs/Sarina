import "reflect-metadata";
import { Type, isType } from "./type";
import { Application } from "./application";
import { Package, getPackage } from "./package";
import { Provider, getProvider } from "./di/provider";
import { Injector } from "./di/injector";
import { RuntimeError, makeErrorFactory } from "./error/error";
import { appliaction as appInfo } from "./version";
import { initializeConsoleLogger } from "./extenssions/console.extenssions";

export const NoPackageAnnotationError: (
	type: Type<any>
) => RuntimeError = makeErrorFactory({
	namespace: "sarina",
	code: "sarina:package:no-package-annotation",
	template: "No 'Package' annotation found for '{0}'.",
	helpTemplate: "You should define '@Package' decorator for '{0}'."
});

export class ApplicationFactory {
	public static async create(
		type: Type<any>,
		options?: {
			debug: boolean;
		}
	): Promise<void>;
	public static async create(
		the_package: Package,
		options?: {
			debug: boolean;
		}
	): Promise<void>;
	public static async create(
		typeOrPackage: Type<any> | Package,
		options?: {
			debug: boolean;
		}
	): Promise<void> {
		return new Promise<void>(function(resolve, reject) {
			initializeConsoleLogger(
				options.debug ? ["all"] : ["INF", "ERR", "WRN"]
			);
			console.info(`Sarina Framework (${appInfo.version})`);
			console.info("-------------------------------------");
			console.info(`loading ...`);
			let appliaction = new AppliactionLoader().create(typeOrPackage);
			console.info(`starting ...`);
			appliaction
				.boot()
				.then(function() {
					console.info(`completed.`);
					resolve();
				})
				.catch(function(err) {
					console.error(`An error occured on starting appliaction.`, err);
				});
		});
	}
}

class AppliactionLoader {
	constructor() {}

	// create an instance of appliaction
	public create(typeOrPackage: Type<any> | Package): Application {
		// resolve the root package injector
		let rootInjector = isType(typeOrPackage)
			? this.resolvePackageType(typeOrPackage)
			: this.loadPackage(typeOrPackage, []);

		(rootInjector as any).print();

		// create appliaction instance and resolve the promise
		return new Application(rootInjector);
	}

	private resolvePackageType(packageType: Type<any>): Injector {
		// resolve package based on @Package annotation
		let the_package = getPackage(packageType);

		if (!the_package) throw NoPackageAnnotationError(packageType);

		// the package type providers
		let the_package_providers = getProvider(packageType);

		// Load package by passing the package object, and we should fetch all package providers
		// 	- a package class is a provider too and it can act as provider too
		return this.loadPackage(the_package, [the_package_providers]);
	}
	private loadPackage(
		the_package: Package,
		package_providers: Provider[]
	): Injector {
		// initiate imports and providers with default values
		the_package.imports = the_package.imports || [];
		the_package.providers = the_package.providers || [];

		// add package_providers
		the_package.providers.pushRange(package_providers);

		// fetch and resolve dependencies
		let dependencies: Injector[] = the_package.imports.map(type => {
			return isType(type)
				? this.resolvePackageType(type)
				: this.loadPackage(type, []);
		});

		// resolve and load package providers
		let providers: Provider[] = [];
		the_package.providers.forEach(p => {
			providers.pushRange([isType(p) ? getProvider(p) : p]);
		});

		// create and return package injector instance
		return new Injector(dependencies, providers);
	}
}
