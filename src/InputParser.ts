import * as core from "@actions/core";
import validator from "validator";

export class InputParser {
	public static getMultilineString = (name: string): string[] => {
		return core.getMultilineInput(name);
	};

	public static getString = (name: string): string => {
		return core.getInput(name);
	};

	public static getJsonFormatted = (name: string): Record<string, unknown> => {
		const value = core.getInput(name);

		if (value.length === 0) {
			return {};
		}

		const parsed: unknown = JSON.parse(value);

		if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
			throw Error(`Invalid argument value for ${name}, pass a json object`);
		}

		return parsed as Record<string, unknown>;
	};

	public static getStringArray = (name: string): string[] => {
		return core
			.getInput(name)
			.split(",")
			.map(entry => entry.trim())
			.filter(entry => entry.length !== 0);
	};

	public static getBoolean = (name: string, defaultValue = false): boolean => {
		const value = core.getInput(name);

		if (value.length === 0) {
			return defaultValue;
		}

		if (!validator.isBoolean(value, {loose: false})) {
			throw Error(`Invalid argument value for ${name}`);
		}

		return validator.toBoolean(value, true);
	};

	public static getNumber = (name: string): number => {
		const value = core.getInput(name);

		if (value.length === 0) {
			return Number.NaN;
		}

		if (!validator.isInt(value)) {
			throw Error(`Invalid argument value for ${name}`);
		}

		return validator.toInt(value);
	};
}
