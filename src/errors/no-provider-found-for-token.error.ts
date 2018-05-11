import { DependencyInjectionError } from "./di-base.error";

export class NoProviderFoundForTokenError extends DependencyInjectionError {
  public code = "no-provider-found-for-token";
  public template = "No provider for {0} !";
  public helpTemplate = "Maybe you have missed to add the '{0}' to the package providers.";
}
