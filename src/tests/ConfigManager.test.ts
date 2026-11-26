import {ConfigInterface, ConfigManager} from "../ConfigManager";
import * as core from "@actions/core";

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
					port: 22,
					user: "foo",
					password: "",
					key: "",
				}) as ConfigInterface,
		});

		//when
		//then
		expect(configManager.validate).toThrow("Missing credentials");
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

	const mockInputs = (inputs: Record<string, string>): void => {
		jest.spyOn(core, "getInput").mockImplementation((name: string) => inputs[name] ?? "");
		jest.spyOn(core, "getMultilineInput").mockReturnValue(["echo ok"]);
	};

	const validInputs = {host: "example.com", port: "22", user: "root", key: "key"};

	test.each(["0", "65536", "-1", ""])("validate should throw exception if port is %j", port => {
		//given
		mockInputs({...validInputs, port});

		//when
		//then
		expect(() => new ConfigManager()).toThrow("Invalid port");
	});

	test("constructor should convert env values to strings and skip ignored envs", () => {
		//given
		mockInputs({
			...validInputs,
			envs: JSON.stringify({FOO: "foo", PORT: 8080, DEBUG: true, SKIPPED: "x"}),
			ignoredEnvs: "SKIPPED, OTHER",
		});

		//when
		const manager = new ConfigManager();

		//then
		expect(manager.config.envs).toStrictEqual([
			{key: "FOO", value: "foo"},
			{key: "PORT", value: "8080"},
			{key: "DEBUG", value: "true"},
		]);
	});

	test("constructor should not export envs to the runner or log their values", () => {
		//given
		mockInputs({...validInputs, envs: JSON.stringify({TOKEN: "super-secret"})});
		const exportVariableMock = jest.spyOn(core, "exportVariable");
		const debugMock = jest.spyOn(core, "debug").mockImplementation(() => undefined);

		//when
		new ConfigManager();

		//then
		expect(exportVariableMock).not.toHaveBeenCalled();
		expect(debugMock.mock.calls.flat().join(" ")).not.toContain("super-secret");
	});

	test.each(["FOO;reboot", "FOO BAR", "1FOO", "FOO=x", "$(id)", ""])(
		"constructor should throw exception if env name is %j",
		key => {
			//given
			mockInputs({...validInputs, envs: JSON.stringify({[key]: "value"})});

			//when
			//then
			expect(() => new ConfigManager()).toThrow("Invalid env name");
		}
	);

	test.each(["not json", "[1,2]", '"text"', "null"])("constructor should throw exception if envs is %j", envs => {
		//given
		mockInputs({...validInputs, envs});

		//when
		//then
		expect(() => new ConfigManager()).toThrow("Envs variable must be a json formatted string");
	});

	test.each(["passphrase", "port", "fingerprint"])("exportIgnoredEnvs should contain %s", name => {
		expect(ConfigManager.exportIgnoredEnvs).toContain(name);
	});
});
