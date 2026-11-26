import * as core from "@actions/core";
import validator from "validator";

const isJsonObject = (value: unknown): value is Record<string, unknown> => {
	return typeof value === "object" && value !== null && !Array.isArray(value);
};

/**
 * Reads an input that holds a json object, or a json array of objects that are merged into one.
 * In an array a later object wins when the same key is in more than one. An empty input gives an empty object.
 */
export const getJsonInput = (name: string): Record<string, unknown> => {
	const value = core.getInput(name);

	if (value.length === 0) {
		return {};
	}

	const parsed: unknown = JSON.parse(value);
	const objects = Array.isArray(parsed) ? parsed : [parsed];

	if (!objects.every(isJsonObject)) {
		throw Error(`Invalid argument value for ${name}, pass a json object or an array of json objects`);
	}

	return Object.fromEntries(objects.flatMap(object => Object.entries(object)));
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
