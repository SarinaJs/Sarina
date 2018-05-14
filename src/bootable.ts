import { Type } from "./type";
import { TypeDecorator, makeTypeDecoratorFactory } from "./metadata/decorators";
import { Provider, TokenDecoratorFactory } from "./di/provider";
import { StaticToken } from "./di/token";

export const BOOTABLE_PROVIDER_TOKEN = new StaticToken({
	description: "Bootable provider token",
	multiple: true
});

export interface OnBoot {
	boot(): Promise<any>;
}

// The bootable decorator factory instance
export const BootableDecoratorFactory = () => {
	return TokenDecoratorFactory([BOOTABLE_PROVIDER_TOKEN]);
};

// The bootable decorator factory
export const Bootable: () => TypeDecorator = makeTypeDecoratorFactory([
	BootableDecoratorFactory
]);
