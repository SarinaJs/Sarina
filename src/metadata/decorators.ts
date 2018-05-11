import "reflect-metadata";
import { Type } from "./../type";

// Type decorator signiture definition
export type TypeDecorator =
	| ClassDecorator
	| (<TFunction extends Type<any>>(target: TFunction) => TFunction | void);

// The type decorator factory definition type
export type TypeDecoratorFactory = (...args: any[]) => TypeDecorator;
export type ParamDecoratorFactory = (...args: any[]) => ParameterDecorator;

// a helper function to create a type decorator factory
// 	- this method accepts type decorator factories as chain
//  - will assing decorators to the target type
export function makeTypeDecoratorFactory(
	decorators: TypeDecoratorFactory[]
): (...args: any[]) => TypeDecorator {
	// decorator wrapper
	return function (...args: any[]) {
		// the original decorator
		return function (target: Type<any>): void {
			let _class_decorators: TypeDecorator[] = [];
			decorators.forEach(decorator => {
				_class_decorators.push(decorator.apply(this, args));
			});

			// We call decorator manually instead of using
			//  'Reflect.decorate(_class_decorators, target);'
			//  TODO : check why we should do this
			_class_decorators.forEach(_decorator => {
				_decorator(target);
			});
		};
	};
}

// a helper function to create a parameter decorator factory
// 	- this method accepts method decorator factories as chain
//  - will assing decorators to the target type,property
export function makeParamDecoratorFactory(
	decorators: ParamDecoratorFactory[]
): (...args: any[]) => ParameterDecorator {
	return function (...inputs: any[]) {
		return function (
			target: Type<any>,
			propertyKey: string,
			propertyIndex: number
		): void {
			let _param_decorators: ParameterDecorator[] = [];
			decorators.forEach(decorator => {
				_param_decorators.push(decorator.apply(this, inputs));
			});

			// We call decorator manually instead of using
			//  'Reflect.decorate(_param_decorators, target, propertyKey, null);'
			//  TODO : check why we should do this
			_param_decorators.forEach(_decorator => {
				_decorator(target, propertyKey, propertyIndex);
			});
		};
	};
}

////////////////////////////////////////////////
export function getMetadata<T>(
	key: string,
	target: Type<any>,
	defaultValue?: T,
	mapperFunc?: (metadata: any) => T
): T {
	let meta = Reflect.getMetadata(key, target);
	if (meta && mapperFunc != null) return mapperFunc(meta);
	return meta || defaultValue;
}

export function setMetadata(key: string, target: Type<any>, value: any) {
	Reflect.defineMetadata(key, value, target);
}
