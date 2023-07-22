import * as core from "@actions/core";
import {InputParser} from "./InputParser";

export interface ConfigInterface {
	host: string;
	port: number;
	key: string;
	user: string;
	password: string;
	envs: {key: string; value: string}[];
	ignoredEnvs: string[];
	command: string[];
	exportActionOptions: boolean;
}

export class ConfigManager {
	public static readonly exportIgnoredEnvs = [
		"host",
		"key",
		"user",
		"password",
		"command",
		"ignoredEnvs",
		"envs",
		"exportActionOptions",
	];

	public readonly config: ConfigInterface;

	public constructor(validate = true) {
		const config: ConfigInterface = {
			host: InputParser.getString("host"),
			port: InputParser.getNumber("port"),
			key: InputParser.getString("key"),
			user: InputParser.getString("user"),
			password: InputParser.getString("password"),
			envs: [],
			command: InputParser.getMultilineString("command"),
			ignoredEnvs: InputParser.getStringArray("ignoredEnvs"),
			exportActionOptions: InputParser.getBoolean("exportActionOptions", false),
		};

		try {
			const rawEnvs = Object.entries(InputParser.getJsonFormatted("envs"));

			rawEnvs.forEach(env => {
				const [key, value] = env;
				if (!config.ignoredEnvs.includes(key)) {
					core.debug(`Registering ${key} ${value} ...`);
					core.exportVariable(key, value);
					config.envs.push({key, value});
				}
			});
		} catch (err) {
			throw new Error("Envs variable must be a json formatted string, make sure you pass correct values");
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
