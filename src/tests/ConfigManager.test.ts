import {ConfigInterface, ConfigManager} from "../ConfigManager";
import * as core from "@actions/core";

//TODO: write tests for parsing

describe("ConfigManager", () => {
	let configManager: ConfigManager;

	beforeAll(() => {
		configManager = new ConfigManager(false);
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
});
