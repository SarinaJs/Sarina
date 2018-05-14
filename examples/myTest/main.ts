import { RuntimeError } from "./../../src/error";

class MyParent extends RuntimeError {
	public namespace = "MyNamespace";
}
class MyError extends MyParent {
	public code = "MyError";
}

throw new MyError();
