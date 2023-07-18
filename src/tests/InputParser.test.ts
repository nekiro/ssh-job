import * as core from "@actions/core";
import {InputParser} from "../InputParser";

describe("InputParser", () => {
	test("getMultilineString should call core.getMultilineInput with given name and return what core.getMultilineInput returns", () => {
		//given
		const mockResponse = [""];
		const mockName = "anything";
		const getMultilineInputMock = jest.spyOn(core, "getMultilineInput").mockReturnValueOnce(mockResponse);

		//when
		const result = InputParser.getMultilineString(mockName);

		//then
		expect(result).toStrictEqual(mockResponse);
		expect(getMultilineInputMock).toBeCalledWith(mockName);
	});

	test("getString should call core.getInput with given name and return what core.getInput returns", () => {
		//given
		const mockResponse = "";
		const mockName = "anything";
		const getInputMock = jest.spyOn(core, "getInput").mockReturnValueOnce(mockResponse);

		//when
		const result = InputParser.getString(mockName);

		//then
		expect(result).toStrictEqual(mockResponse);
		expect(getInputMock).toBeCalledWith(mockName);
	});

	test.each([
		{input: JSON.stringify({one: "1", two: 2}), output: {one: "1", two: 2}},
		{input: JSON.stringify({foo: "foo", bar: true}), output: {foo: "foo", bar: true}},
	])("getJsonFormatted should return proper output for given input", ({input, output}) => {
		//given
		jest.spyOn(core, "getInput").mockReturnValueOnce(input);

		//when
		const result = InputParser.getJsonFormatted("foo");

		//then
		expect(result).toStrictEqual(output);
	});

	test.each([
		{input: "foo,bar,baz", output: ["foo", "bar", "baz"]},
		{input: "bar, foo, baz", output: ["bar", "foo", "baz"]},
		{input: "bar", output: ["bar"]},
	])("getStringArray should return proper output for given input", ({input, output}) => {
		//given
		jest.spyOn(core, "getInput").mockReturnValueOnce(input);

		//when
		const result = InputParser.getStringArray("foo");

		//then
		expect(result).toStrictEqual(output);
	});

	test.each([
		{input: "true", output: true},
		{input: "false", output: false},
		{input: "1", output: true},
		{input: "0", output: false},
	])("getBoolean should return proper output for given input", ({input, output}) => {
		//given
		jest.spyOn(core, "getInput").mockReturnValueOnce(input);

		//when
		const result = InputParser.getBoolean("foo");

		//then
		expect(result).toBe(output);
	});

	test.each([
		{input: "123", output: 123},
		{input: "5555", output: 5555},
	])("getNumber should return proper output for given input", ({input, output}) => {
		//given
		jest.spyOn(core, "getInput").mockReturnValueOnce(input);

		//when
		const result = InputParser.getNumber("foo");

		//then
		expect(result).toBe(output);
	});
});
