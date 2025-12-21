import {ConfigInterface, ConfigManager} from "../ConfigManager";
import * as core from "@actions/core";

//TODO: write tests for parsing

describe("ConfigManager", () => {
	let configManager: ConfigManager;

	beforeAll(() => {
		configManager = new ConfigManager(false);
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	test("validate should throw exception if config.host or config.user is falsy or config.command is empty", () => {
		//given
		jest.spyOn(core, "getInput").mockReturnValueOnce("");
		Object.defineProperty(configManager, "config", {
			get: () =>
				({
					host: "",
					user: "",
					command: [""],
				}) as ConfigInterface,
		});

		//when
		//then
		expect(configManager.validate).toThrow(Error);
	});

	test("validate should throw exception if config.password and config.key is falsy", () => {
		//given
		jest.spyOn(core, "getInput").mockReturnValueOnce("d");
		Object.defineProperty(configManager, "config", {
			get: () =>
				({
					host: "domain",
					user: "foo",
					password: "",
					key: "",
				}) as ConfigInterface,
		});

		//when
		//then
		expect(configManager.validate).toThrow(Error);
	});

	test("constructor should set tty when input tty is true", () => {
		//given
		jest.spyOn(core, "getInput").mockImplementation((name: string) => {
			switch (name) {
				case "host":
					return "example.com";
				case "port":
					return "22";
				case "key":
					return "key";
				case "passphrase":
					return "";
				case "user":
					return "root";
				case "password":
					return "";
				case "envs":
					return "";
				case "ignoredEnvs":
					return "";
				case "exportActionOptions":
					return "false";
				case "tty":
					return "true";
				default:
					return "";
			}
		});
		jest.spyOn(core, "getMultilineInput").mockReturnValueOnce(["echo ok"]);

		//when
		const manager = new ConfigManager(false);

		//then
		expect(manager.config.tty).toBe(true);
	});
});
