import "reflect-metadata";
import { expect } from "chai";
import "mocha";

import {
  makeTypeDecoratorFactory,
  makeParamDecoratorFactory,
  setMetadata,
  getMetadata,
  TypeDecorator
} from "./../index";

describe("Sarina/Core", () => {
  describe("#Decorator", () => {
    describe("#setMetadata", () => {
      it("Should set value", () => {
        class MyClass {}
        setMetadata("MyClass", MyClass, "123");
        expect(Reflect.getMetadata("MyClass", MyClass)).eq("123");
      });
    });
    describe("#getMetadata", () => {
      it("Should get value", () => {
        class MyClass {}
        setMetadata("MyClass", MyClass, "123");
        expect(getMetadata("MyClass", MyClass)).eq("123");
      });
      it("Should return default value if not exists", () => {
        class MyClass {}
        setMetadata("MyClass", MyClass, "123");
        expect(getMetadata("OtherClass", MyClass, "1234")).eq("1234");
      });
      it("Should return the value even we have default value", () => {
        class MyClass {}
        setMetadata("MyClass", MyClass, "123");
        expect(getMetadata("MyClass", MyClass, "1234")).eq("123");
      });
      it("Should map value", () => {
        class MyClass {}
        setMetadata("MyClass", MyClass, "123");
        expect(
          getMetadata("MyClass", MyClass, "1234", value => {
            return value + "5";
          })
        ).eq("1235");
      });
      it("Should map defaultvalue if value is not exists", () => {
        class MyClass {}
        setMetadata("MyClass", MyClass, "123");
        expect(
          getMetadata("OtherClass", MyClass, "1234", value => {
            return value + "5";
          })
        ).eq("1234");
      });
    });
    describe("#makeTypeDecoratorFactory", () => {
      it("Should decorate the class", () => {
        function myCustomDecorator() {
          return function(target) {
            Reflect.defineMetadata("MyCustomMetadata", "MyValue", target);
          };
        }
        let MyDecorator = makeTypeDecoratorFactory([myCustomDecorator]);

        @MyDecorator()
        class MyClass {}

        let myValue = Reflect.getMetadata("MyCustomMetadata", MyClass);

        expect(myValue).equal("MyValue");
      });
      it("Should decorate class with multiple decorator", () => {
        function myCustomDecorator1() {
          return function(target) {
            Reflect.defineMetadata("MyCustomMetadata1", "MyValue1", target);
          };
        }
        function myCustomDecorator2() {
          return function(target) {
            Reflect.defineMetadata("MyCustomMetadata2", "MyValue2", target);
          };
        }
        let MyDecorator = makeTypeDecoratorFactory([
          myCustomDecorator1,
          myCustomDecorator2
        ]);

        @MyDecorator()
        class MyClass {}

        let myValue1 = Reflect.getMetadata("MyCustomMetadata1", MyClass);
        let myValue2 = Reflect.getMetadata("MyCustomMetadata2", MyClass);

        expect(myValue1).equal("MyValue1", "First decorator value");
        expect(myValue2).equal("MyValue2", "Seccond decorator value");
      });
      it("Should decorate class with parameter", () => {
        function myCustomDecorator(value: string) {
          return function(target) {
            Reflect.defineMetadata("MyCustomMetadata", value, target);
          };
        }
        let MyDecorator: (
          value: string
        ) => TypeDecorator = makeTypeDecoratorFactory([myCustomDecorator]);

        @MyDecorator("MyValue")
        class MyClass {}

        let myValue = Reflect.getMetadata("MyCustomMetadata", MyClass);

        expect(myValue).equal("MyValue");
      });
    });
    describe("#makeParamDecoratorFactory", () => {
      it("Should decorate class parameter", () => {
        function myCustomParamDecorator() {
          return function(target, propertyKey, index) {
            let values = Reflect.getMetadata("MyCustomMetadata", target) || [];
            values.push(index);
            Reflect.defineMetadata(
              "MyCustomMetadata",
              values,
              target,
              propertyKey
            );
          };
        }
        let MyParamDecorator = makeParamDecoratorFactory([
          myCustomParamDecorator
        ]);

        class MyClass {
          constructor(
            @MyParamDecorator() value0: String,
            value1: string,
            @MyParamDecorator() value2: string
          ) {}
        }

        let myValue: any[] = Reflect.getMetadata("MyCustomMetadata", MyClass);
        myValue = myValue.sort();
        expect(myValue).to.have.length(2);
        expect(myValue[0]).to.eq(0); // The param number 1 : value0
        expect(myValue[1]).to.eq(2); // the param number 2 : value2
      });
      it("Should decorate class parameter with multiple decorator", () => {
        function myCustomParamDecorator1() {
          return function(target, propertyKey, index) {
            let values = Reflect.getMetadata("MyCustomMetadata1", target) || [];
            values.push(index);
            Reflect.defineMetadata(
              "MyCustomMetadata1",
              values,
              target,
              propertyKey
            );
          };
        }
        function myCustomParamDecorator2() {
          return function(target, propertyKey, index) {
            let values = Reflect.getMetadata("MyCustomMetadata2", target) || [];
            values.push(index);
            Reflect.defineMetadata(
              "MyCustomMetadata2",
              values,
              target,
              propertyKey
            );
          };
        }
        let MyParamDecorator = makeParamDecoratorFactory([
          myCustomParamDecorator1,
          myCustomParamDecorator2
        ]);

        class MyClass {
          constructor(
            @MyParamDecorator() value0: String,
            value1: string,
            @MyParamDecorator() value2: string
          ) {}
        }

        let myValue1: any[] = Reflect.getMetadata("MyCustomMetadata1", MyClass);
        myValue1 = myValue1.sort();
        expect(myValue1, "Length of first value").to.have.length(2);
        expect(myValue1[0], "First value and first item").to.eq(0); // The param number 1 : value0
        expect(myValue1[1], "First value and seccond item").to.eq(2); // the param number 2 : value2

        let myValue2: any[] = Reflect.getMetadata("MyCustomMetadata2", MyClass);
        myValue2 = myValue1.sort();
        expect(myValue2, "Length of seccond value").to.have.length(2);
        expect(myValue2[0], "Seccond value and first item").to.eq(0); // The param number 1 : value0
        expect(myValue2[1], "Seccond value and seccond item").to.eq(2); // the param number 2 : value2
      });
      it("Should decorate class parameter with parameter", () => {
        function myCustomParamDecorator(value: string) {
          return function(target, propKey, index) {
            Reflect.defineMetadata("MyCustomMetadata", value, target);
          };
        }
        let MyDecorator: (
          value: string
        ) => ParameterDecorator = makeParamDecoratorFactory([
          myCustomParamDecorator
        ]);

        class MyClass {
          constructor(@MyDecorator("MyValue") value: string) {}
        }

        let myValue = Reflect.getMetadata("MyCustomMetadata", MyClass);

        expect(myValue).equal("MyValue");
      });
      it("Should detect parameter type with reflection", () => {
        function myCustomParamDecorator() {
          return function(target, propertyKey, index) {
            const params = getMetadata("design:paramtypes", target, []);

            Reflect.defineMetadata(
              "MyCustomMetadata",
              params,
              target,
              propertyKey
            );
          };
        }
        let MyParamDecorator = makeParamDecoratorFactory([
          myCustomParamDecorator
        ]);

        class MySeccondClass {}
        class MyClass {
          constructor(@MyParamDecorator() value: MySeccondClass) {}
        }

        let myValue: any[] = Reflect.getMetadata("MyCustomMetadata", MyClass);
        expect(myValue, "Length of value").to.has.length(1);
        expect(myValue[0], "Value of first item").eq(MySeccondClass);
      });
    });
  });
});
