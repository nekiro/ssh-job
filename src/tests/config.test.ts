import {afterEach, describe, expect, test, vi} from "vitest";
import * as core from "@actions/core";
import {loadConfig} from "../config.js";

vi.mock("@actions/core");

const validInputs = {host: "example.com", port: "22", user: "root", key: "key"};

const mockInputs = (inputs: Record<string, string>, command = ["echo ok"]): void => {
	vi.mocked(core.getInput).mockImplementation((name: string) => inputs[name] ?? "");
	vi.mocked(core.getMultilineInput).mockReturnValue(command);
};

afterEach(() => {
	vi.resetAllMocks();
});

describe("loadConfig", () => {
	test("should read every option", () => {
		//given
		mockInputs(
			{
				host: "example.com",
				port: "2222",
				user: "root",
				key: "key",
				passphrase: "passphrase",
				password: "password",
				fingerprint: "SHA256:abc",
				connectTimeout: "5",
				timeout: "60",
				tty: "true",
			},
			["echo one", "echo two"]
		);

		//when
		const config = loadConfig();

		//then
		expect(config).toStrictEqual({
			host: "example.com",
			port: 2222,
			user: "root",
			key: "key",
			passphrase: "passphrase",
			password: "password",
			fingerprint: "SHA256:abc",
			connectTimeout: 5,
			timeout: 60,
			tty: true,
			command: ["echo one", "echo two"],
			envs: [],
		});
	});

	test("should use defaults when optional inputs are empty", () => {
		//given
		mockInputs(validInputs);

		//when
		const config = loadConfig();

		//then
		expect(config.connectTimeout).toBe(20);
		expect(config.timeout).toBe(0);
		expect(config.tty).toBe(false);
		expect(config.envs).toStrictEqual([]);
	});

	describe("validation", () => {
		test.each<{name: string; inputs: Record<string, string>; message: string}>([
			{name: "host is empty", inputs: {host: ""}, message: "Missing host"},
			{name: "user is empty", inputs: {user: ""}, message: "Missing user"},
			{name: "key and password are empty", inputs: {key: "", password: ""}, message: "Missing credentials"},
			{name: "connectTimeout is 0", inputs: {connectTimeout: "0"}, message: "Invalid connectTimeout"},
			{name: "connectTimeout is not a number", inputs: {connectTimeout: "abc"}, message: "Invalid argument value"},
			{name: "timeout is negative", inputs: {timeout: "-5"}, message: "Invalid timeout"},
			{name: "tty is not a boolean", inputs: {tty: "yes"}, message: "Invalid argument value"},
		])("should throw exception if $name", ({inputs, message}) => {
			//given
			mockInputs({...validInputs, ...inputs});

			//when
			//then
			expect(() => loadConfig()).toThrow(message);
		});

		test.each(["0", "65536", "-1", ""])("should throw exception if port is %j", port => {
			//given
			mockInputs({...validInputs, port});

			//when
			//then
			expect(() => loadConfig()).toThrow("Invalid port");
		});

		test("should throw exception if command is empty", () => {
			//given
			mockInputs(validInputs, []);

			//when
			//then
			expect(() => loadConfig()).toThrow("Provide command to execute");
		});

		test("should accept password without key", () => {
			//given
			mockInputs({...validInputs, key: "", password: "password"});

			//when
			//then
			expect(() => loadConfig()).not.toThrow();
		});
	});

	describe("envs", () => {
		test("should convert values to strings and skip ignored envs", () => {
			//given
			mockInputs({
				...validInputs,
				envs: JSON.stringify({FOO: "foo", NUM: 8080, DEBUG: true, SKIPPED: "x"}),
				ignoredEnvs: "SKIPPED, OTHER",
			});

			//when
			const config = loadConfig();

			//then
			expect(config.envs).toStrictEqual([
				{key: "FOO", value: "foo"},
				{key: "NUM", value: "8080"},
				{key: "DEBUG", value: "true"},
			]);
		});

		test.each([
			"host",
			"port",
			"user",
			"key",
			"passphrase",
			"password",
			"fingerprint",
			"connectTimeout",
			"timeout",
			"tty",
			"command",
			"envs",
			"ignoredEnvs",
			"exportActionOptions",
		])("should not export env named like the %s option", name => {
			//given
			mockInputs({...validInputs, envs: JSON.stringify({[name.toUpperCase()]: "x", [name]: "y", FOO: "foo"})});

			//when
			const config = loadConfig();

			//then
			expect(config.envs).toStrictEqual([{key: "FOO", value: "foo"}]);
		});

		test("should export envs named like options when exportActionOptions is true", () => {
			//given
			mockInputs({...validInputs, envs: JSON.stringify({HOST: "h", FOO: "foo"}), exportActionOptions: "true"});

			//when
			const config = loadConfig();

			//then
			expect(config.envs).toStrictEqual([
				{key: "HOST", value: "h"},
				{key: "FOO", value: "foo"},
			]);
		});

		test("should not export envs to the runner or log their values", () => {
			//given
			mockInputs({...validInputs, envs: JSON.stringify({TOKEN: "super-secret"})});

			//when
			loadConfig();

			//then
			expect(core.exportVariable).not.toHaveBeenCalled();
			expect(vi.mocked(core.debug).mock.calls.flat().join(" ")).not.toContain("super-secret");
		});

		test.each(["FOO;reboot", "FOO BAR", "1FOO", "FOO=x", "$(id)", ""])(
			"should throw exception if env name is %j",
			key => {
				//given
				mockInputs({...validInputs, envs: JSON.stringify({[key]: "value"})});

				//when
				//then
				expect(() => loadConfig()).toThrow("Invalid env name");
			}
		);

		test("should not validate the name of an ignored env", () => {
			//given
			mockInputs({...validInputs, envs: JSON.stringify({"not valid": "x"}), ignoredEnvs: "not valid"});

			//when
			//then
			expect(loadConfig().envs).toStrictEqual([]);
		});

		test.each(["not json", "[1,2]", '"text"', "null"])("should throw exception if envs is %j", envs => {
			//given
			mockInputs({...validInputs, envs});

			//when
			//then
			expect(() => loadConfig()).toThrow("Envs variable must be a json formatted string");
		});
	});
});
