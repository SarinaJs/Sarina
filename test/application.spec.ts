import { expect } from "chai";
import "mocha";
import { Application, Sarina, Injector, ApplicationInjector, Container, OnBoot, BOOTABLE_PROVIDER_TOKEN, Package, Bootable, NoPackageAnnotationError } from "./../index";

describe("Sarina/Core", () => {
	describe("/Appliaction", () => {
		it("Should execute all bootable proviers", () => {

			let final_value: string;
			class BootabpeProvider implements OnBoot {
				public boot(): Promise<any> {
					return new Promise(function (resolve, reject) {
						final_value = "Bootable_provider";
						resolve();
					})
				}
			}

			let provider_def = {
				tokens: [BootabpeProvider, BOOTABLE_PROVIDER_TOKEN],
				useType: BootabpeProvider,
				dependencies: []
			};

			let container = new Container([], [provider_def]);
			let injector = new ApplicationInjector(container)
			let application = new Application(injector);
			let localExpect = expect;
			return application.boot()
				.then(function () {
					localExpect(final_value).to.be.eq("Bootable_provider");
				})
				.catch(function (err) {
					throw err;
				})
		})
		it("Shoudl ignore bootable providers which has not implemented OnBoot interface", () => {
			let final_value: string = "default";
			class BootabpeProvider {
			}

			let provider_def = {
				tokens: [BootabpeProvider, BOOTABLE_PROVIDER_TOKEN],
				useType: BootabpeProvider,
				dependencies: []
			};

			let container = new Container([], [provider_def]);
			let injector = new ApplicationInjector(container)
			let application = new Application(injector);
			let localExpect = expect;
			return application.boot()
				.then(function () {
					localExpect(final_value).to.be.eq("default");
				})
				.catch(function (err) {
					throw err;
				})
		})
	})
	describe("/AppliactionBuilder", () => {
		it("Should create application based on inline package", () => {

			let final_value: string;
			class BootabpeProvider implements OnBoot {
				public boot(): Promise<any> {
					return new Promise(function (resolve, reject) {
						final_value = "Bootable_provider";
						resolve();
					})
				}
			}

			let provider_def = {
				tokens: [BootabpeProvider, BOOTABLE_PROVIDER_TOKEN],
				useType: BootabpeProvider,
				dependencies: []
			};

			let localExpect = expect;
			return Sarina.run({
				providers: [provider_def]
			}, {
					silent: true,
					debug: false,
				}).then(function () {
					localExpect(final_value).to.be.eq("Bootable_provider");
				})
		})
		it("Should create application based on package class", () => {
			let final_value: string;

			@Package({})
			@Bootable()
			class BootabpeProvider implements OnBoot {
				public boot(): Promise<any> {
					return new Promise(function (resolve, reject) {
						final_value = "Bootable_provider";
						resolve();
					})
				}
			}
			let localExpect = expect;
			return Sarina.run(BootabpeProvider, {
				silent: true,
				debug: false,
			}).then(function () {
				localExpect(final_value).to.be.eq("Bootable_provider");
			})
		})
		it("Should throw 'NoPackageAnnotationError' if package class has no @package annotation", () => {
			let final_value: string;

			@Bootable()
			class BootabpeProvider implements OnBoot {
				public boot(): Promise<any> {
					return new Promise(function (resolve, reject) {
						final_value = "Bootable_provider";
						resolve();
					})
				}
			}
			let localExpect = expect;
			return Sarina.run(BootabpeProvider, {
				silent: true,
				debug: false,
			})
				.then(() => {
					expect(true).not.be.true;
				})
				.catch(err => {
					expect(err).to.be.instanceof(NoPackageAnnotationError);
				});
		})
	})
})
