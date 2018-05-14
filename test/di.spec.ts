import "reflect-metadata";
import { expect } from "chai";
import "mocha";
import { generateId } from '../../@sarina/core/src/util';

import {
	Package,
	Provider,
	Singleton,
	Bootable,
	makeTypeDecoratorFactory,
	getPackage,
	getProvider,
	Token,
	BOOTABLE_PROVIDER_TOKEN,
	Scope,
	SINGLETON_INJECTOR_SCOPE,
	Container,
	Injector,
	ApplicationInjector,
	NoProviderFoundForTokenError,
	CyclicDependencyDetectedForProviderError,
	StaticToken,
	SingletonInjector,
	ScopeNotFoundError,
	INJECTOR_PROVIDER_TOKEN
} from "./../index";

describe("Sarina/Core/di", () => {
	describe("/Decorators", () => {
		describe("Decorator checks ( Decorator registration should not throw any Error )", () => {
			it("@Package", () => {
				@Package({})
				class BasicPackage { }
			});
			it("@Provider", () => {
				@Provider({})
				class BasicPackage { }
			});
			it("@Singleton", () => {
				@Provider({})
				@Singleton()
				class BasicPackage { }
			});
			it("@Bootable", () => {
				@Provider({})
				@Bootable()
				class BasicPackage { }
			});
			it("@Scope", () => {
				@Scope(Symbol("Singleton"))
				class BasicPackage { }
			});
		});
		describe("@Package", () => {
			it("#getPackage should returns undefined", () => {
				class MyPackage { }

				let pkg = getPackage(MyPackage);
				expect(pkg).to.be.null;
			});
			it("Register empty @Package", () => {
				@Package({})
				class MyPackage { }

				let pkg = getPackage(MyPackage);
				expect(pkg, "Package should not be null").to.not.null;
				expect(pkg.name, "Package name should be equal the class name").to.eq(
					"MyPackage"
				);
			});
			it("Register empty @Package with name", () => {
				@Package({
					name: "MyCustomName"
				})
				class MyPackage { }

				let pkg = getPackage(MyPackage);
				expect(pkg.name).to.eq("MyCustomName");
			});
			it("Register @Package with dependency", () => {
				class MyDependency { }

				@Package({
					imports: [MyDependency]
				})
				class MyPackage { }

				let pkg = getPackage(MyPackage);
				expect(pkg.imports[0]).to.eq(MyDependency);
			});
			it("Register @Package shoud register provider too", () => {
				@Package({})
				class MyPackage { }

				let prv = getProvider(MyPackage);
				expect(prv.useType).to.be.equal(MyPackage);
			});
			it("Register @Package with providers", () => {
				class MyProvider { }

				@Package({
					providers: [MyProvider]
				})
				class MyPackage { }

				let pkg = getPackage(MyPackage);
				expect(pkg.providers[0]).to.eq(MyProvider);
			});
		});
		describe("@Provider", () => {
			it("#getProvider should returns undefined", () => {
				class MyProvider { }

				let prv = getProvider(MyProvider);
				expect(prv).to.be.null;
			});
			it("Register empty @Provider", () => {
				@Provider()
				class MyProvider { }

				let prv = getProvider(MyProvider);
				expect(prv, "Provider not be null").to.not.null;
			});
			it("Register @Provider with token", () => {
				const token = Symbol("MyProvider");

				@Provider({
					tokens: [token]
				})
				class MyProvider { }

				let prv = getProvider(MyProvider);
				expect(prv.tokens.count(t => t === MyProvider)).to.have.eq(1);
				expect(prv.tokens.count(t => t === token)).to.have.eq(1);
			});
			it("Register @Provider with scope", () => {
				const token = Symbol("MyProvider");

				@Provider({
					scope: token
				})
				class MyProvider { }

				let prv = getProvider(MyProvider);
				expect(prv.scope).to.have.eq(token);
			});
		});
		describe("@Bootable", () => {
			it("#getProvider should not register class as provider", () => {
				@Bootable()
				class MyBootableProvider { }

				let prv = getProvider(MyBootableProvider);
				expect(prv).to.be.null;
			});
			it("#getProvider should return provider which has bootable token", () => {
				@Provider()
				@Bootable()
				class MyBootableProvider { }

				let prv = getProvider(MyBootableProvider);
				expect(
					prv.tokens.filter(t => t === BOOTABLE_PROVIDER_TOKEN)
				).to.have.length(1);
			});
		});
		describe("@Scope", () => {
			it("#getProvider should return null if only @Scope has defined and not @Provider", () => {
				let token = Symbol("MyToken");

				@Scope(token)
				class MySingletonProvider { }

				let prv = getProvider(MySingletonProvider);
				expect(prv).to.be.null;
			});
			it("The provider should have scope token", () => {
				let token = Symbol("MyToken");

				@Provider()
				@Scope(token)
				class MyCustomProvider { }

				let prv = getProvider(MyCustomProvider);
				expect(prv.scope).to.be.eq(token);
			});
			it("The provider defined scope should override the @Scope", () => {
				let scope_token = Symbol("MyScopeDecoratorToken");
				let provider_scope_token = Symbol("MyProviderScopeToken");

				@Scope(scope_token)
				@Provider({
					scope: provider_scope_token
				})
				@Scope(scope_token)
				class MyCustomProvider { }

				let prv = getProvider(MyCustomProvider);
				expect(prv.scope).to.be.eq(provider_scope_token);
			});
		});
		describe("@Singleton", () => {
			it("The provider should have singleton scope", () => {
				@Provider()
				@Singleton()
				class MySingletonProvider { }

				let prv = getProvider(MySingletonProvider);
				expect(prv.scope).to.be.eq(SINGLETON_INJECTOR_SCOPE);
			});
		});
	});
	describe("/Container", () => {
		it("Instantiate container", () => {
			expect(() => {
				let container = new Container([], []);
			}).to.not.throw();
		});
		it("Instantiate container with parent containers", () => {
			expect(() => {
				let parentContainer = new Container([], []);
				let container = new Container([parentContainer], []);
			}).to.not.throw();
		});
		it("Instantiate container with local providers", () => {
			expect(() => {
				let parentContainer = new Container([], []);
				let container = new Container(
					[],
					[
						{
							tokens: [Symbol("HI")],
							useValue: "HI"
						}
					]
				);
			}).to.not.throw();
		});
		it("Instantiate container with key", () => {
			let container = new Container([], [], "MyContainer");
			expect(container.key).to.be.equal("MyContainer");
		});
		describe("#exists", () => {
			it("Should return false if provider not exists in container", () => {
				let container = new Container([], []);
				expect(container.exists(Symbol("SomeProvider"))).to.be.false;
			});
			it("Should return true if provider exists in container", () => {
				let provider = {
					tokens: [Symbol("provider")],
					useValue: "theProvider"
				};
				let container = new Container([], [provider]);
				expect(container.exists(provider.tokens[0])).to.be.true;
			});
			it("Should return true if provider exists in parent container", () => {
				let provider = {
					tokens: [Symbol("provider")],
					useValue: "theProvider"
				};
				let parentContainer = new Container([], [provider]);
				let container = new Container([parentContainer], []);
				expect(container.exists(provider.tokens[0])).to.be.true;
			});
		});
		describe("#locate", () => {
			it("Should return empty array if provider not found in container", () => {
				let container = new Container([], []);
				expect(container.locate(Symbol("SomeProvider"))).to.have.length(0);
			});
			it("Should return array with only one item which is the requested provider", () => {
				let provider = {
					tokens: [Symbol("provider")],
					useValue: "theProvider"
				};
				let container = new Container([], [provider]);
				expect(container.locate(provider.tokens[0])[0]).to.be.eq(provider);
			});
			it("Shoudl return array of providers", () => {
				let token = Symbol("provider");
				let provider1 = {
					tokens: [token],
					useValue: "theProvider"
				};
				let provider2 = {
					tokens: [token],
					useValue: "theProvider"
				};
				let container = new Container([], [provider1, provider2]);
				expect(container.locate(token)).to.be.have.length(2);
			});
			it("Shoudl return array of providers even on parent", () => {
				let token = Symbol("provider");
				let provider1 = {
					tokens: [token],
					useValue: "theProvider"
				};
				let provider2 = {
					tokens: [token],
					useValue: "theProvider"
				};
				let parentContainer = new Container([], [provider1]);
				let container = new Container([parentContainer], [provider2]);
				expect(container.locate(token)).to.be.have.length(2);
			});
		});
	});
	describe("/Injector", () => {
		describe("#get", () => {
			it("Should resolve the provider instance", () => {
				let token = Symbol("token");
				let provider_def = {
					tokens: [token],
					useValue: "MyProvider"
				};

				let container = new Container([], [provider_def]);
				let injector = new ApplicationInjector(container);
				let provider = injector.get(token);
				expect(provider).to.be.eq("MyProvider");
			});
			it("#useValueProvider", () => {
				let token = Symbol("token");
				let provider_def = {
					tokens: [token],
					useValue: "MyProvider"
				};

				let container = new Container([], [provider_def]);
				let injector = new ApplicationInjector(container);
				let provider = injector.get(token);
				expect(provider).to.be.eq("MyProvider");
			})
			it("#useTypeProvider", () => {
				class MyProvider { }

				let provider_def = {
					tokens: [MyProvider],
					useType: MyProvider,
					dependencies: []
				};

				let container = new Container([], [provider_def]);
				let injector = new ApplicationInjector(container);
				let provider = injector.get(MyProvider);
				expect(provider).to.be.instanceof(MyProvider);
			})
			it("#useFactoryProvider", () => {

				let provider_def1 = {
					tokens: [Symbol("MyProvider1")],
					useValue: "Hello"
				}
				let provider_def = {
					tokens: [Symbol("MyProvider")],
					useFactory: (name: string) => {
						return name + " Mohammad";
					},
					dependencies: [{
						token: provider_def1.tokens[0],
					}]
				};

				let container = new Container([], [provider_def, provider_def1]);
				let injector = new ApplicationInjector(container);
				let result = injector.get(provider_def.tokens[0]);
				expect(result).to.be.equal("Hello Mohammad");
			})
			it("Should resolve the required provider instance dependencies", () => {
				class MyProvider {
					constructor(public dep: MyDependency) { }
				}
				class MyDependency {
					constructor(public anotherDep: MyAnOtherDependency) { };
				}
				class MyAnOtherDependency {
				}

				let my_provider_def = {
					tokens: [MyProvider],
					useType: MyProvider,
					dependencies: [{
						token: MyDependency,
						optional: false
					}]
				};
				let my_dependency_def = {
					tokens: [MyDependency],
					useType: MyDependency,
					dependencies: [{
						token: MyAnOtherDependency,
						optional: false
					}]
				};
				let my_another_dependency_def = {
					tokens: [MyAnOtherDependency],
					useType: MyAnOtherDependency,
					dependencies: []
				};

				let container = new Container([], [my_provider_def, my_dependency_def, my_another_dependency_def]);
				let injector = new ApplicationInjector(container);
				let provider = injector.get<MyProvider>(MyProvider);
				expect(provider.dep).to.be.instanceof(MyDependency);
				expect(provider.dep.anotherDep).to.be.instanceof(MyAnOtherDependency);
			})
			it("Should throw NoProviderFoundForTokenError if provider not found", () => {
				let token = Symbol("token");
				let container = new Container([], []);
				let injector = new ApplicationInjector(container);
				expect(() => {
					injector.get(token);
				}).to.throw(NoProviderFoundForTokenError);
			});
			it("Should resolve optional dependency", () => {
				class MyProvider {
					constructor(public dep: any) { }
				}

				let my_provider_def = {
					tokens: [MyProvider],
					useType: MyProvider,
					dependencies: [{
						token: Symbol("NotExistsDependency"),
						optional: true
					}]
				};


				let container = new Container([], [my_provider_def]);
				let injector = new ApplicationInjector(container);
				let provider = injector.get<MyProvider>(MyProvider);
				expect(provider.dep).to.be.null;
			});
			it("Should throw error if cycle dependency detected", () => {
				class ProviderA {
					constructor(providerB: ProviderB) { }
				}
				class ProviderB {
					constructor(providerA: ProviderA) { }
				}

				let provide_a_def = {
					tokens: [ProviderA],
					useType: ProviderA,
					dependencies: [{
						token: ProviderB,
					}]
				};
				let provide_b_def = {
					tokens: [ProviderB],
					useType: ProviderB,
					dependencies: [{
						token: ProviderA,
					}]
				};

				let container = new Container([], [provide_a_def, provide_b_def]);
				let injector = new ApplicationInjector(container);
				expect(() => {
					injector.get<ProviderA>(ProviderA);
				}).to.throw(CyclicDependencyDetectedForProviderError);

			})
			it("Should resolve multiple provider for token", () => {
				let token = new StaticToken({
					multiple: true
				})
				let provider_1 = {
					tokens: [token],
					useValue: "P1"
				};
				let provider_2 = {
					tokens: [token],
					useValue: "P2"
				};

				let container = new Container([], [provider_1, provider_2]);
				let injector = new ApplicationInjector(container);
				let values = injector.get<string[]>(token);
				expect(values).to.be.has.length(2);
				expect(values.count(s => s === "P1")).to.be.eq(1);
				expect(values.count(s => s === "P2")).to.be.eq(1);
			})
			it("Should inject multiple provider", () => {

				let token = new StaticToken({
					multiple: true
				})
				interface IProvider { }
				class Provider1 implements IProvider { }
				class Provider2 implements IProvider { }
				class Provider3 {
					constructor(public prvs: IProvider[]) { }
				}

				let provider1_def = {
					tokens: [token],
					useType: Provider1,
					dependencies: []
				}
				let provider2_def = {
					tokens: [token],
					useType: Provider2,
					dependencies: []
				}
				let provider3_def = {
					tokens: [Provider3],
					useType: Provider3,
					dependencies: [{
						token: token
					}]
				}

				let container = new Container([], [provider1_def, provider2_def, provider3_def]);
				let injector = new ApplicationInjector(container);
				let instance = injector.get<Provider3>(Provider3);
				expect(instance.prvs).to.be.has.length(2);
				expect(instance.prvs.count(s => s instanceof Provider1)).to.be.eq(1);
				expect(instance.prvs.count(s => s instanceof Provider2)).to.be.eq(1);
			})
			it("Should instantiate provider every time we resolve it ( no scoped provider )", () => {
				class Provider {
					public value: string;
					public constructor() {
						this.value = generateId(1);
					}
				}

				let provider_def = {
					tokens: [Provider],
					useType: Provider,
					dependencies: [],
				};

				let container = new Container([], [provider_def]);
				let injector = new ApplicationInjector(container);
				let instnace_1 = injector.get<Provider>(Provider);
				let instance_2 = injector.get<Provider>(Provider);
				expect(instnace_1.value).to.not.eq(instance_2.value);
			})
			it("Inject Injector instance into provider", () => {

				let value = generateId();
				class Provider1 {
					public value: string;
					constructor(injector: Injector) {
						this.value = injector.get<Provider2>(Provider2).value;
					}
				}
				class Provider2 {
					public value: string;
					constructor() {
						this.value = value;
					}
				}

				let provider1_def = {
					tokens: [Provider1],
					useType: Provider1,
					dependencies: [{ token: INJECTOR_PROVIDER_TOKEN }]
				}
				let provider2_def = {
					tokens: [Provider2],
					useType: Provider2,
					dependencies: []
				}

				let container = new Container([], [provider1_def, provider2_def]);
				let appliactionInjector = new ApplicationInjector(container);
				expect(appliactionInjector.get<Provider1>(Provider1).value).to.be.eq(value);

			})
			it("Manage scoped provider should instantiate once inside injector", () => {

				class Provider {
					public value: string;
					public constructor() {
						this.value = generateId(1);
					}
				}

				let provider_def = {
					tokens: [Provider],
					useType: Provider,
					scope: SINGLETON_INJECTOR_SCOPE,
					dependencies: [],
				};

				let container = new Container([], [provider_def]);
				let appliactionInjector = new ApplicationInjector(container);
				let singleTonInjector = new SingletonInjector(container, appliactionInjector);
				let instnace_1 = singleTonInjector.get<Provider>(Provider);
				let instance_2 = singleTonInjector.get<Provider>(Provider);
				expect(instnace_1.value).to.eq(instance_2.value);
			})
			it("Should throw ScopeNotFoundError error when provider scope not found", () => {
				class Provider {
					public value: string;
					public constructor() {
						this.value = generateId(1);
					}
				}

				let provider_def = {
					tokens: [Provider],
					useType: Provider,
					scope: Symbol("NoExistedScope"),
					dependencies: [],
				};

				let container = new Container([], [provider_def]);
				let injector = new ApplicationInjector(container);
				expect(() => injector.get<Provider>(Provider)).to.throw(ScopeNotFoundError);
			})
			it("Register custom scope for provider", () => {

				class CustomScopeInjector extends Injector {
					public getScope(): Token {
						return CustomScopeInjector;
					}
					constructor(container: Container, parent?: Injector) {
						super(container, parent);
					}
				}

				class Provider {
					public value: string;
					public constructor() {
						this.value = generateId(1);
					}
				}

				let provider_def = {
					tokens: [Provider],
					useType: Provider,
					scope: CustomScopeInjector,
					dependencies: [],
				};

				let container = new Container([], [provider_def]);
				let appliactionInjector = new ApplicationInjector(container);
				let customScopeInjector = new CustomScopeInjector(container, appliactionInjector);
				let instance1 = customScopeInjector.get<Provider>(Provider);
				let instance2 = customScopeInjector.get<Provider>(Provider);

				expect(instance1.value).to.be.eq(instance2.value);
			})
			it("Register scope inside provider", () => {


				class CustomScopeInjector extends Injector {
					public getScope(): Token {
						return CustomScopeInjector;
					}
					constructor(container: Container, parent?: Injector) {
						super(container, parent);
					}
				}

				class ParentProvider {
					public value1: string;
					public value2: string;
					constructor(injector: Injector) {
						{
							let childInjector = injector.createChildInjector(CustomScopeInjector);
							this.value1 = injector.get<Provider2>(Provider2).value;
						}
						{
							let childInjector = injector.createChildInjector(CustomScopeInjector);
							this.value2 = injector.get<Provider2>(Provider2).value;
						}
					}
				}
				class Provider2 {
					public value: string;
					constructor() {
						this.value = generateId();
					}
				}

				let provider1_def = {
					tokens: [ParentProvider],
					useType: ParentProvider,
					dependencies: [{ token: INJECTOR_PROVIDER_TOKEN }]
				}
				let provider2_def = {
					tokens: [Provider2],
					useType: Provider2,
					dependencies: []
				}

				let container = new Container([], [provider1_def, provider2_def]);
				let appliactionInjector = new ApplicationInjector(container);

				let parentProvider = appliactionInjector.get<ParentProvider>(ParentProvider);

				expect(parentProvider.value1).to.be.not.eq(parentProvider.value2);
			})

		});
	});
});
