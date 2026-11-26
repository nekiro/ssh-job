import {afterEach, describe, expect, test, vi} from "vitest";
import * as core from "@actions/core";
import {getBooleanInput, getJsonInput, getListInput, getNumberInput} from "../inputs.js";

vi.mock("@actions/core");

const mockInput = (value: string): void => {
	vi.mocked(core.getInput).mockReturnValueOnce(value);
};

afterEach(() => {
	vi.resetAllMocks();
});

describe("inputs", () => {
	describe("getJsonInput", () => {
		test.each([
			{input: JSON.stringify({one: "1", two: 2}), output: {one: "1", two: 2}},
			{input: JSON.stringify({foo: "foo", bar: true}), output: {foo: "foo", bar: true}},
			{input: "", output: {}},
		])("should return $output for $input", ({input, output}) => {
			//given
			mockInput(input);

			//when
			const result = getJsonInput("foo");

			//then
			expect(result).toStrictEqual(output);
			expect(core.getInput).toHaveBeenCalledWith("foo");
		});

		test.each(["not json", "[1,2]", '"text"', "null", "5"])("should throw exception for %j", input => {
			//given
			mockInput(input);

			//when
			//then
			expect(() => getJsonInput("foo")).toThrow(Error);
		});
	});

	describe("getListInput", () => {
		test.each([
			{input: "foo,bar,baz", output: ["foo", "bar", "baz"]},
			{input: "bar, foo, baz", output: ["bar", "foo", "baz"]},
			{input: "bar", output: ["bar"]},
			{input: "", output: []},
			{input: "foo,,bar,", output: ["foo", "bar"]},
		])("should return $output for $input", ({input, output}) => {
			//given
			mockInput(input);

			//when
			const result = getListInput("foo");

			//then
			expect(result).toStrictEqual(output);
		});
	});

	describe("getBooleanInput", () => {
		test.each([
			{input: "true", output: true},
			{input: "false", output: false},
			{input: "1", output: true},
			{input: "0", output: false},
		])("should return $output for $input", ({input, output}) => {
			//given
			mockInput(input);

			//when
			const result = getBooleanInput("foo");

			//then
			expect(result).toBe(output);
		});

		test.each([true, false])("should return default value %j for empty input", defaultValue => {
			//given
			mockInput("");

			//when
			const result = getBooleanInput("foo", defaultValue);

			//then
			expect(result).toBe(defaultValue);
		});

		test.each(["yes", "True", "2"])("should throw exception for %j", input => {
			//given
			mockInput(input);

			//when
			//then
			expect(() => getBooleanInput("foo")).toThrow("Invalid argument value for foo");
		});
	});

	describe("getNumberInput", () => {
		test.each([
			{input: "123", output: 123},
			{input: "5555", output: 5555},
			{input: "-1", output: -1},
		])("should return $output for $input", ({input, output}) => {
			//given
			mockInput(input);

			//when
			const result = getNumberInput("foo");

			//then
			expect(result).toBe(output);
		});

		test("should return default value for empty input", () => {
			//given
			mockInput("");
			mockInput("");

			//when
			//then
			expect(getNumberInput("foo", 20)).toBe(20);
			expect(getNumberInput("foo")).toBeNaN();
		});

		test.each(["abc", "22abc", "1.5"])("should throw exception for %j", input => {
			//given
			mockInput(input);

			//when
			//then
			expect(() => getNumberInput("foo")).toThrow("Invalid argument value for foo");
		});
	});
});
