import * as core from "@actions/core";
import validator from "validator";
import {InputParser} from "./InputParser";

export interface ConfigInterface {
	host: string;
	port: number;
	key: string;
	passphrase: string;
	user: string;
	password: string;
	fingerprint: string;
	envs: {key: string; value: string}[];
	ignoredEnvs: string[];
	command: string[];
	exportActionOptions: boolean;
	tty: boolean;
}

export class ConfigManager {
	public static readonly exportIgnoredEnvs = [
		"host",
		"port",
		"key",
		"passphrase",
		"user",
		"password",
		"fingerprint",
		"command",
		"ignoredEnvs",
		"envs",
		"exportActionOptions",
		"tty",
	];

	private static readonly envKeyPattern = /^[A-Za-z_][A-Za-z0-9_]*$/;

	public readonly config: ConfigInterface;

	public constructor(validate = true) {
		const config: ConfigInterface = {
			host: InputParser.getString("host"),
			port: InputParser.getNumber("port"),
			key: InputParser.getString("key"),
			passphrase: InputParser.getString("passphrase"),
			user: InputParser.getString("user"),
			password: InputParser.getString("password"),
			fingerprint: InputParser.getString("fingerprint"),
			envs: [],
			command: InputParser.getMultilineString("command"),
			ignoredEnvs: InputParser.getStringArray("ignoredEnvs"),
			exportActionOptions: InputParser.getBoolean("exportActionOptions", false),
			tty: InputParser.getBoolean("tty", false),
		};

		let rawEnvs: Record<string, unknown>;
		try {
			rawEnvs = InputParser.getJsonFormatted("envs");
		} catch {
			throw new Error("Envs variable must be a json formatted string, make sure you pass correct values");
		}

		for (const [key, rawValue] of Object.entries(rawEnvs)) {
			if (config.ignoredEnvs.includes(key)) {
				continue;
			}

			// the key is written into the remote shell script, so it must be a plain variable name
			if (!ConfigManager.envKeyPattern.test(key)) {
				throw new Error(`Invalid env name "${key}", only letters, digits and underscores are allowed`);
			}

			const value = typeof rawValue === "string" ? rawValue : JSON.stringify(rawValue);
			core.debug(`Registering ${key} ...`);
			config.envs.push({key, value});
		}

		this.config = config;

		if (validate) {
			this.validate();
		}
	}

	public validate = (): void => {
		if (!this.config.host) {
			throw new Error("Missing host");
		}

		if (!validator.isInt(String(this.config.port), {min: 1, max: 65535})) {
			throw new Error("Invalid port, it must be a number between 1 and 65535");
		}

		if (!this.config.user) {
			throw new Error("Missing user");
		}

		if (!this.config.password && !this.config.key) {
			throw new Error("Missing credentials, please provide at least one way to authenticate");
		}

		if (this.config.command.length === 0) {
			throw new Error("Provide command to execute when connected");
		}
	};
}
