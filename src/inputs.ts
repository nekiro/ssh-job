import * as core from "@actions/core";
import validator from "validator";

/** Reads an input that holds a json object, an empty input gives an empty object. */
export const getJsonInput = (name: string): Record<string, unknown> => {
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

/** Reads an input that holds a comma separated list. */
export const getListInput = (name: string): string[] => {
	return core
		.getInput(name)
		.split(",")
		.map(entry => entry.trim())
		.filter(entry => entry.length !== 0);
};

export const getBooleanInput = (name: string, defaultValue = false): boolean => {
	const value = core.getInput(name);

	if (value.length === 0) {
		return defaultValue;
	}

	if (!validator.isBoolean(value, {loose: false})) {
		throw Error(`Invalid argument value for ${name}`);
	}

	return validator.toBoolean(value, true);
};

export const getNumberInput = (name: string, defaultValue = Number.NaN): number => {
	const value = core.getInput(name);

	if (value.length === 0) {
		return defaultValue;
	}

	if (!validator.isInt(value)) {
		throw Error(`Invalid argument value for ${name}`);
	}

	return validator.toInt(value);
};
