import { AppliactionBuilder } from "./application-builder";
import { Package } from "./package";
import { Type } from "./type";
import { Version } from "./version";
import { loggerFactory, makeLoggingSilent, enableDebugModeForLogging } from "./core-logger";

export namespace Sarina {
	export async function run(
		type: Type<any>,
		options?: {
			silent: boolean,
			debug: boolean;
		}
	): Promise<void>;
	export async function run(
		the_package: Package,
		options?: {
			silent: boolean,
			debug: boolean;
		}
	): Promise<void>;
	export async function run(
		typeOrPackage: Type<any> | Package,
		options?: {
			silent: boolean,
			debug: boolean;
		}
	): Promise<void> {
		return new Promise<void>(function (resolve, reject) {
			if (options && options.silent) {
				makeLoggingSilent();
			}
			if (options && options.debug) {
				enableDebugModeForLogging();
			}
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
