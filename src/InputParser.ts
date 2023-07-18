import * as core from "@actions/core";
import validator from "validator";

export class InputParser {
	public static getMultilineString = (name: string): string[] => {
		return core.getMultilineInput(name);
	};

	public static getString = (name: string): string => {
		return core.getInput(name);
	};

	public static getJsonFormatted = (name: string): object => {
		const value = core.getInput(name);
		let parsed: object = {};

		if (value.length !== 0) {
			parsed = JSON.parse(value);
		}

		return parsed;
	};

	public static getStringArray = (name: string): string[] => {
		const value = core.getInput(name).replace(/\s/g, "");

		const envs = value.split(",");

		if (value.length !== 0 && envs.length === 0) {
			throw Error(`Invalid argument value for ${name}, pass comma separated string ex. something,something`);
		}

		return envs;
	};

	public static getBoolean = (name: string): boolean => {
		const value = core.getInput(name);

		if (value.length !== 0 && !validator.isBoolean(value, {loose: false})) {
			throw Error(`Invalid argument value for ${name}`);
		}

		return validator.toBoolean(value, true);
	};

	public static getNumber = (name: string): number => {
		const value = core.getInput(name);

		if (value.length !== 0 && !validator.isInt(value)) {
			throw Error(`Invalid argument value for ${name}`);
		}

		return validator.toInt(value);
	};
}
