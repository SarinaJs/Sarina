export class ErrorHandler {
	private _console: Console = console;

	public handleError(error: any): void {
		this._console.error("ERROR", error);
	}
}
