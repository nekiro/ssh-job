import core from "@actions/core";
import validator from "validator";

export interface ConfigInterface {
	host: string;
	port: number;
	key: string;
	keyPath: string;
	username: string;
	password: string;
	envs: string[];
	debug: boolean;
	command: string[];
}

export const parse = (): ConfigInterface => {
	const config = {} as ConfigInterface;
	config.host = getString("host");
	config.port = getNumber("port");
	config.key = getString("key");
	config.keyPath = getString("key_path");
	config.username = getString("username");
	config.password = getString("password");
	// TODO: envs
	config.debug = getBoolean("debug");
	config.command = getMultilineString("command");

	return config;
};

export const validate = (config: ConfigInterface): void => {
	if (!config.host) {
		throw Error("Missing host");
	}

	if (!config.username && !config.password && !config.key && !config.keyPath) {
		throw Error("Missing credentials, please provide at least one way to authenticate");
	}

	if (!config.command) {
		throw Error("Provide command to execute when connected");
	}
};

const getMultilineString = (name: string): string[] => {
	return core.getMultilineInput(name);
};

const getString = (name: string): string => {
	return core.getInput(name);
};

const getBoolean = (name: string): boolean => {
	const value = core.getInput(name);

	if (value.length !== 0 && !validator.isBoolean(value, {loose: false})) {
		throw Error(`Invalid argument value for ${name}`);
	}

	return validator.toBoolean(value, true);
};

const getNumber = (name: string): number => {
	const value = core.getInput(name);

	if (value.length !== 0 && !validator.isInt(value)) {
		throw Error(`Invalid argument value for ${name}`);
	}

	return validator.toInt(value);
};
