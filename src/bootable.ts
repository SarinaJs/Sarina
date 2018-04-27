import { Type } from "./type";
import { TypeDecorator, makeTypeDecoratorFactory } from "./metadata/decorators";
import { Provider, ProviderDecoratorFactory } from "./di/provider";
import { ProviderToken } from "./di/token";

export const BOOTABLE_PROVIDER_TOKEN = new ProviderToken({
	description: "Bootable provider token",
	multiple: true
});

export interface OnBoot {
	boot(): Promise<any>;
}

// The bootable decorator factory instance
export const BootableDecoratorFactory = () => {
	return ProviderDecoratorFactory({
		tokens: [BOOTABLE_PROVIDER_TOKEN]
	});
};

// The bootable decorator factory
export const Bootable: () => TypeDecorator = makeTypeDecoratorFactory([
	BootableDecoratorFactory
]);
