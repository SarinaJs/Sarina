import { AppliactionBuilder } from "./application-builder";
import { Package } from "./package";
import { Type } from "./type";
import { Version } from "./version";
import { loggerFactory } from "./core-logger";

export namespace Sarina {
	export async function run(
		type: Type<any>,
		options?: {
			debug: boolean;
		}
	): Promise<void>;
	export async function run(
		the_package: Package,
		options?: {
			debug: boolean;
		}
	): Promise<void>;
	export async function run(
		typeOrPackage: Type<any> | Package,
		options?: {
			debug: boolean;
		}
	): Promise<void> {
		return new Promise<void>(function (resolve, reject) {
			let logger = loggerFactory("sarina", "boot");

			logger.info(`Sarina Framework (${Version.version})`);
			logger.info("-------------------------------------");
			logger.info(`loading ...`);
			let appliaction = new AppliactionBuilder().create(typeOrPackage);
			logger.info(`starting ...`);
			appliaction
				.boot()
				.then(function () {
					logger.info(`Appliaction succesfully shutdowned.`);
					resolve();
				})
				.catch(function (err) {
					logger.error(`An error occured on starting appliaction.`, err);
				});
		});
	}
}
