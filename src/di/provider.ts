import {
	TypeDecorator,
	TypeDecoratorFactory,
	getMetadata,
	makeParamDecoratorFactory,
	makeTypeDecoratorFactory,
	setMetadata
} from "./../metadata/decorators";

import { Token, StaticToken } from "./token";
import { Type } from "./../type";
import { loggerFactory } from "./../core-logger";
import { SINGLETON_INJECTOR_SCOPE } from "./singleton-injector";
import { InvalidUsageOfInjectAnnotation } from "./../errors/invalid-usage-of-inject-annotation.error"

////////////////////////////////////////////////////////////////////////////////////////
/*
	Providers:
		- Provider should have at least one Token
		- Provider can have more than one Token
		- Tokens:
			- Overwrite supported for token
			- Multi provider supported ?? TODO : we should implement this feature in 'future'
		- Types:
			- TypeProvider
				- Support dependecy injection ( Only into constructor )
			- ValueProvider
			- FactoryProvider
				- Support dependecy injection ( as function parameters )

*/
export interface Dependency {
	token: Token;
	optional?: boolean;
}
export interface Interceptor {
	beforeInstantiate?: () => void;
}

export interface ScopeSupportProvider {
	scope?: Token;
}
export interface ProviderBase {
	tokens: Token[];
}
export interface TypeProvider extends ProviderBase, ScopeSupportProvider {
	useType: Type<any>;
	dependencies: Dependency[];
}
export interface FactoryProvider extends ProviderBase, ScopeSupportProvider {
	useFactory: (...args: any[]) => any;
	dependencies: Dependency[];
}
export interface ValueProvider extends ProviderBase {
	useValue: any;
}
export type Provider = TypeProvider | ValueProvider | FactoryProvider;

interface InjectMetadata {
	index: number;
	dependency: Dependency;
}
////////////////////////////////////////////////////////////////////////////////////////
// ERRORS

////////////////////////////////////////////////////////////////////////////////////////
// THE PROVIDER META_KEY
const __PROVIDER_INJECT_METADATA__ = "sarina::provider::dependency";
const __PROVIDER_TOKEN_METADATA__ = "sarina::provider::token";
const __PROVIDER_SCOPE_METADATA__ = "sarina::provider::scope";
const __PROVIDER_METADATA__ = "sarina::provider";
////////////////////////////////////////////////////////////////////////////////////////
export const InjectDecoratorFactory = (token: StaticToken) => {
	return function (
		target: Type<any>,
		propertyKey: string | symbol,
		parameterIndex: number
	) {
		// only constructor parameter is allowed
		if (propertyKey) {
			throw new InvalidUsageOfInjectAnnotation(target, propertyKey);
		}

		// get the dependencies
		let deps = getMetadata<InjectMetadata[]>(
			__PROVIDER_INJECT_METADATA__,
			target,
			[]
		);

		// find the property dependency
		let propertyDep: InjectMetadata = deps.find(
			dep => dep.index === parameterIndex
		);

		// create a property dependency if not exists
		if (!propertyDep) {
			propertyDep = {
				index: parameterIndex,
				dependency: {
					token: null,
					optional: false
				}
			};
			deps.push(propertyDep);
		}

		// update the dependency token value
		propertyDep.dependency.token = token;

		// set the metadata
		setMetadata(__PROVIDER_INJECT_METADATA__, target, deps);
	};
};
export const TokenDecoratorFactory = (tokens: Token[] | Token) => {
	return function (target: Type<any>) {
		// ignore null or empty tokens
		if (!tokens && Array.isArray(tokens) && tokens.length === 0) return;

		// fetch curren tokens
		let _tokens =
			getMetadata<Token[]>(__PROVIDER_TOKEN_METADATA__, target) || [];

		// update the tokens list
		if (Array.isArray(tokens)) _tokens.pushRange(tokens);
		else _tokens.push(tokens);

		// set the metadata
		setMetadata(__PROVIDER_TOKEN_METADATA__, target, _tokens);
	};
};
export const ScopeDecoratorFactory = (scopeToken: Token) => {
	return function (target: Type<any>) {
		// we always over-write the scope of target
		setMetadata(__PROVIDER_SCOPE_METADATA__, target, scopeToken);
	};
};
export const ProviderDecoratorFactory = (provider?: {
	tokens?: Token[];
	scope?: Token;
}) => {
	return function (target: Type<any>) {
		// fetch all current providers metdata
		let the_provider = getMetadata<TypeProvider>(
			__PROVIDER_METADATA__,
			target,
			{
				useType: target,
				tokens: [target],
				dependencies: [],
				scope: null
			}
		);

		// We should add current class as token into list
		if (the_provider.tokens.count(t => target === t) === 0) {
			the_provider.tokens.push(target);
		}

		// set the tokens
		if (provider && provider.tokens) {
			the_provider.tokens.pushRange(provider.tokens);
		}

		// set the scope
		if (provider && provider.scope) {
			the_provider.scope = provider.scope;
		}

		// Fetch the class dependencies ( constructor arguments )
		const constructor_dependecnies = getMetadata(
			"design:paramtypes",
			target,
			[]
		);
		the_provider.dependencies = constructor_dependecnies.map((cdep, index) => {
			let dependency: Dependency = {
				token: cdep,
				optional: false
			};
			return dependency;
		});
		setMetadata(__PROVIDER_METADATA__, target, the_provider);
	};
};

// DECORATORS
///////////////////////////////////////////////////////////
export const Inject: (
	token?: StaticToken
) => ParameterDecorator = makeParamDecoratorFactory([InjectDecoratorFactory]);
export const Scope: (
	scopeToken: Token
) => TypeDecorator = makeTypeDecoratorFactory([ScopeDecoratorFactory]);
export const Provider: (
	provider?: { tokens?: Token[]; scope?: Token }
) => TypeDecorator = makeTypeDecoratorFactory([ProviderDecoratorFactory]);

// FETCH UTIL
///////////////////////////////////////////////////////////
export const getProvider = (type: Type<any>) =>
	getMetadata<TypeProvider>(
		__PROVIDER_METADATA__,
		type,
		null,
		(provider: TypeProvider) => {
			// Fetch the inject metadata
			let injects = getMetadata<InjectMetadata[]>(
				__PROVIDER_INJECT_METADATA__,
				type
			);
			// Set the provider scope
			provider.scope =
				provider.scope || getMetadata<Token>(__PROVIDER_SCOPE_METADATA__, type);

			// Fetch the inject metadata
			let tokens = getMetadata<Token[]>(__PROVIDER_TOKEN_METADATA__, type);
			provider.tokens = provider.tokens || [];
			if (tokens) provider.tokens.pushRange(tokens);

			if (injects) {
				provider.dependencies.forEach((dep, index) => {
					let inject = injects.find(inject => inject.index === index);
					if (inject) {
						dep.optional = inject.dependency.optional;
						dep.token = inject.dependency.token;
					}
				});
			}

			return provider;
		}
	);
