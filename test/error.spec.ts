import { expect } from "chai";
import "mocha";
import { RuntimeError } from "./../index";

describe("Sarina/Core", () => {
	describe("/Error", () => {
		describe("/RuntimeError", () => {
			it("Should throw an error", () => {
				class MyError extends RuntimeError { }
				expect(() => { throw new MyError() }).to.throw(Error);
			})
			it("Should throw an custom error", () => {
				class MyError extends RuntimeError { }
				expect(() => { throw new MyError() }).to.throw(MyError);
			})
			it("Should Throw an error with valid message", () => {
				class MyError extends RuntimeError {
					public type = "MyError";
					public namespace = "MyParentNamespace";
					public code = "MyCode";
					public message = "MyMessage";
					public note = "MyNote";
					public url = "MyUrl";
				}
				let myError = new MyError();
				expect(myError.code).to.be.eq("MyCode");
				expect(myError.namespace).to.be.eq("MyParentNamespace");
				expect(myError.type).to.be.eq("MyError");
				expect(myError.message).to.be.eq("MyMessage");
				expect(myError.note).to.be.eq("MyNote");
				expect(myError.url).to.be.eq("MyUrl");
			})
			it("Should set the type of error based of class name", () => {
				class MyError extends RuntimeError {
				}
				let myError = new MyError();
				expect(myError.type).to.be.eq("MyError");
			})
			it("Should Inherits ErrorMessage form parrent", () => {
				class MyParent extends RuntimeError {
					public type = "MyParentError";
					public namespace = "MyParentNamespace";
					public code = "MyParentCode";
					public message = "MyParentMessage";
					public note = "MyParentNote";
					public url = "MyParentUrl";
				}
				class MyError extends MyParent {
					public namespace = "MyCode";
				}
				let myError = new MyError();
				expect(myError.namespace).to.be.eq("MyParentNamespace:MyCode");
			})
			it("Should toString the error", () => {
				class MyError extends RuntimeError {
					public type = "MyError";
					public namespace = "MyParentNamespace";
					public code = "MyCode";
					public message = "MyMessage";
					public note = "MyNote";
					public url = "MyUrl";
				}

				let myError = new MyError();

				let message = `[${myError.type}] ${myError.message}`;
				if (myError.namespace) message += `\n\tNamespace: ${myError.namespace}`;
				if (myError.code) message += `\n\tCode: ${myError.code}`;
				if (myError.note) message += `\n\tNote: ${myError.note}`;
				if (myError.url) message += `\n\tUrl: ${myError.url}`;

				expect(myError.toString()).to.be.eq(message);
			})
			it("Should be comparable to Error and parrent error types", () => {
				class MyParent extends RuntimeError {
					public type = "MyParentError";
					public namespace = "MyParentNamespace";
					public code = "MyParentCode";
					public message = "MyParentMessage";
					public note = "MyParentNote";
					public url = "MyParentUrl";
				}
				class MyError extends MyParent {
					public namespace = "MyCode";
				}
				let error = new MyError();

				expect(error).instanceof(MyError);
				expect(error).instanceof(MyParent);
				expect(error).instanceof(RuntimeError);
				expect(error).instanceof(Error);
			})
			it("Should format the values", () => {
				class MyError extends RuntimeError {
					public namespace = "Namespace {0}, {1}";
					public code = "Code {0}, {1}";
					public message = "Message {0}, {1}";
					public note = "Note {0}, {1}";
					public url = "Url {0}, {1}";
				}
				let error = new MyError("Test1", "Test2");

				expect(error.type).to.be.eq("MyError");
				expect(error.namespace).to.be.eq("Namespace Test1, Test2");
				expect(error.code).to.be.eq("Code Test1, Test2");
				expect(error.message).to.be.eq("Message Test1, Test2");
				expect(error.note).to.be.eq("Note Test1, Test2");
				expect(error.url).to.be.eq("Url Test1, Test2");
			})
		})
	})
})
