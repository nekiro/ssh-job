import {afterEach, beforeEach, describe, expect, test, vi} from "vitest";
import * as core from "@actions/core";
import {InputParser} from "../InputParser.js";

vi.mock("@actions/core");

beforeEach(() => {
	vi.mocked(core.getInput).mockReturnValue("");
	vi.mocked(core.getMultilineInput).mockReturnValue([]);
});

afterEach(() => {
	vi.resetAllMocks();
});

describe("InputParser", () => {
	test("getMultilineString should call core.getMultilineInput with given name and return what core.getMultilineInput returns", () => {
		//given
		const mockResponse = [""];
		const mockName = "anything";
		const getMultilineInputMock = vi.mocked(core.getMultilineInput).mockReturnValueOnce(mockResponse);

		//when
		const result = InputParser.getMultilineString(mockName);

		//then
		expect(result).toStrictEqual(mockResponse);
		expect(getMultilineInputMock).toHaveBeenCalledWith(mockName);
	});

	test("getString should call core.getInput with given name and return what core.getInput returns", () => {
		//given
		const mockResponse = "";
		const mockName = "anything";
		const getInputMock = vi.mocked(core.getInput).mockReturnValueOnce(mockResponse);

		//when
		const result = InputParser.getString(mockName);

		//then
		expect(result).toStrictEqual(mockResponse);
		expect(getInputMock).toHaveBeenCalledWith(mockName);
	});

	test.each([
		{input: JSON.stringify({one: "1", two: 2}), output: {one: "1", two: 2}},
		{input: JSON.stringify({foo: "foo", bar: true}), output: {foo: "foo", bar: true}},
	])("getJsonFormatted should return proper output for given input", ({input, output}) => {
		//given
		vi.mocked(core.getInput).mockReturnValueOnce(input);

		//when
		const result = InputParser.getJsonFormatted("foo");

		//then
		expect(result).toStrictEqual(output);
	});

	test.each([
		{input: "foo,bar,baz", output: ["foo", "bar", "baz"]},
		{input: "bar, foo, baz", output: ["bar", "foo", "baz"]},
		{input: "bar", output: ["bar"]},
		{input: "", output: []},
		{input: "foo,,bar,", output: ["foo", "bar"]},
	])("getStringArray should return proper output for given input", ({input, output}) => {
		//given
		vi.mocked(core.getInput).mockReturnValueOnce(input);

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
		{input: "", defautValue: true},
	])("getBoolean should return proper output for given input", ({input, output, defautValue}) => {
		//given
		vi.mocked(core.getInput).mockReturnValueOnce(input);

		//when
		const result = InputParser.getBoolean("foo", defautValue);

		//then
		expect(result).toBe(output ?? defautValue);
	});

	test.each(["yes", "True", "2"])("getBoolean should throw exception for %j", input => {
		//given
		vi.mocked(core.getInput).mockReturnValueOnce(input);

		//when
		//then
		expect(() => InputParser.getBoolean("foo")).toThrow(Error);
	});

	test.each([
		{input: "123", output: 123},
		{input: "5555", output: 5555},
	])("getNumber should return proper output for given input", ({input, output}) => {
		//given
		vi.mocked(core.getInput).mockReturnValueOnce(input);

		//when
		const result = InputParser.getNumber("foo");

		//then
		expect(result).toBe(output);
	});

	test.each(["abc", "22abc", "1.5"])("getNumber should throw exception for %j", input => {
		//given
		vi.mocked(core.getInput).mockReturnValueOnce(input);

		//when
		//then
		expect(() => InputParser.getNumber("foo")).toThrow(Error);
	});
});
