import * as core from "@actions/core";
import validator from "validator";
import {getBooleanInput, getJsonInput, getListInput, getNumberInput} from "./inputs.js";
import type {ActionConfig, ActionInputs, EnvVariable} from "./types.js";

const ENV_NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

const readEnvsInput = (): Record<string, unknown> => {
	try {
		return getJsonInput("envs");
	} catch {
		throw new Error("Envs variable must be a json formatted string, make sure you pass correct values");
	}
};

const readInputs = (): ActionInputs => ({
	host: core.getInput("host"),
	port: getNumberInput("port"),
	user: core.getInput("user"),
	key: core.getInput("key"),
	passphrase: core.getInput("passphrase"),
	password: core.getInput("password"),
	fingerprint: core.getInput("fingerprint"),
	connectTimeout: getNumberInput("connectTimeout", 20),
	timeout: getNumberInput("timeout", 0),
	tty: getBooleanInput("tty", false),
	command: core.getMultilineInput("command"),
	ignoredEnvs: getListInput("ignoredEnvs"),
	exportActionOptions: getBooleanInput("exportActionOptions", false),
	envs: readEnvsInput(),
});

/**
 * Picks the variables that are exported in the remote shell.
 * reservedNames holds lowercase names that are skipped whatever their case.
 */
const selectEnvs = (
	rawEnvs: Record<string, unknown>,
	ignoredEnvs: string[],
	reservedNames: Set<string>
): EnvVariable[] => {
	const envs: EnvVariable[] = [];

	for (const [key, rawValue] of Object.entries(rawEnvs)) {
		if (ignoredEnvs.includes(key)) {
			continue;
		}

		// the key is written into the remote shell script, so it must be a plain variable name
		if (!ENV_NAME_PATTERN.test(key)) {
			throw new Error(`Invalid env name "${key}", only letters, digits and underscores are allowed`);
		}

		if (reservedNames.has(key.toLowerCase())) {
			continue;
		}

		core.debug(`Registering ${key} ...`);
		envs.push({key, value: typeof rawValue === "string" ? rawValue : JSON.stringify(rawValue)});
	}

	return envs;
};

const validate = (config: ActionConfig): void => {
	if (!config.host) {
		throw new Error("Missing host");
	}

	if (!validator.isInt(String(config.port), {min: 1, max: 65535})) {
		throw new Error("Invalid port, it must be a number between 1 and 65535");
	}

	if (!config.user) {
		throw new Error("Missing user");
	}

	if (!config.password && !config.key) {
		throw new Error("Missing credentials, please provide at least one way to authenticate");
	}

	if (!validator.isInt(String(config.connectTimeout), {min: 1})) {
		throw new Error("Invalid connectTimeout, it must be a number of seconds greater than 0");
	}

	if (!validator.isInt(String(config.timeout), {min: 0})) {
		throw new Error("Invalid timeout, it must be a number of seconds, 0 disables it");
	}

	if (config.command.length === 0) {
		throw new Error("Provide command to execute when connected");
	}
};

/** Reads and validates the inputs of the action. */
export const loadConfig = (): ActionConfig => {
	const inputs = readInputs();
	const {envs, ignoredEnvs, exportActionOptions, ...options} = inputs;

	// Variables named like an input of the action (HOST, KEY, ...) are not exported by default,
	// so `envs: ${{ toJson(secrets) }}` does not send the credentials of the action to the server.
	const inputNames = Object.keys(inputs).map(name => name.toLowerCase());
	const reservedNames = new Set(exportActionOptions ? [] : inputNames);

	const config: ActionConfig = {...options, envs: selectEnvs(envs, ignoredEnvs, reservedNames)};
	validate(config);

	return config;
};
