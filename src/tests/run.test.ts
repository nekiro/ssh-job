import {afterEach, beforeEach, describe, expect, test, vi, type MockInstance} from "vitest";
import {createHash} from "crypto";
import * as core from "@actions/core";
import {run} from "../run.js";

const ssh = vi.hoisted(() => ({
	connect: vi.fn(),
	execCommand: vi.fn(),
	dispose: vi.fn(),
}));

vi.mock("@actions/core");
vi.mock("node-ssh", () => ({
	NodeSSH: class {
		public connect = ssh.connect;
		public execCommand = ssh.execCommand;
		public dispose = ssh.dispose;
	},
}));

const hostKey = Buffer.from("fake host key");
const hostFingerprint = `SHA256:${createHash("sha256").update(hostKey).digest("base64").replace(/=+$/, "")}`;
const success = {code: 0, stdout: "", stderr: "", signal: null};
const validInputs = {host: "example.com", port: "2222", user: "root", key: "private key"};

const mockInputs = (inputs: Record<string, string>, command = ["echo ok"]): void => {
	vi.mocked(core.getInput).mockImplementation((name: string) => inputs[name] ?? "");
	vi.mocked(core.getMultilineInput).mockReturnValue(command);
};

let stdoutWrite: MockInstance<typeof process.stdout.write>;
let stderrWrite: MockInstance<typeof process.stderr.write>;

beforeEach(() => {
	ssh.connect.mockResolvedValue(undefined);
	ssh.execCommand.mockResolvedValue(success);
	stdoutWrite = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
	stderrWrite = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
});

afterEach(() => {
	vi.useRealTimers();
	vi.restoreAllMocks();
	vi.resetAllMocks();
});

describe("run", () => {
	describe("connection", () => {
		test("should connect with private key and passphrase", async () => {
			//given
			mockInputs({...validInputs, passphrase: "secret", password: "ignored", connectTimeout: "7"});

			//when
			await run();

			//then
			const config = ssh.connect.mock.calls[0][0];
			expect(config).toMatchObject({
				host: "example.com",
				port: 2222,
				username: "root",
				privateKey: "private key",
				passphrase: "secret",
				readyTimeout: 7000,
			});
			expect(config.password).toBeUndefined();
			expect(core.setFailed).not.toHaveBeenCalled();
		});

		test("should connect with password when key is not set", async () => {
			//given
			mockInputs({...validInputs, key: "", password: "hunter2"});

			//when
			await run();

			//then
			const config = ssh.connect.mock.calls[0][0];
			expect(config.password).toBe("hunter2");
			expect(config.privateKey).toBeUndefined();
		});

		test("should warn and skip host key verification when fingerprint is not set", async () => {
			//given
			mockInputs(validInputs);

			//when
			await run();

			//then
			expect(ssh.connect.mock.calls[0][0].hostVerifier).toBeUndefined();
			expect(core.warning).toHaveBeenCalledWith(expect.stringContaining("Host key is not verified"));
		});

		test("should accept only the host key that matches fingerprint", async () => {
			//given
			mockInputs({...validInputs, fingerprint: hostFingerprint});

			//when
			await run();

			//then
			const {hostVerifier} = ssh.connect.mock.calls[0][0];
			expect(hostVerifier(hostKey)).toBe(true);
			expect(hostVerifier(Buffer.from("other host key"))).toBe(false);
			expect(core.warning).not.toHaveBeenCalled();
		});

		test("should fail with the presented fingerprint when host key does not match", async () => {
			//given
			mockInputs({...validInputs, fingerprint: "SHA256:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"});
			ssh.connect.mockImplementation(async (config: {hostVerifier: (key: Buffer) => boolean}) => {
				config.hostVerifier(hostKey);
				throw new Error("Handshake failed");
			});

			//when
			await run();

			//then
			expect(core.setFailed).toHaveBeenCalledWith(`Host key verification failed, server presented ${hostFingerprint}`);
			expect(ssh.execCommand).not.toHaveBeenCalled();
			expect(ssh.dispose).toHaveBeenCalled();
		});

		test("should fail with the connection error", async () => {
			//given
			mockInputs(validInputs);
			ssh.connect.mockRejectedValue(new Error("connect ECONNREFUSED"));

			//when
			await run();

			//then
			expect(core.setFailed).toHaveBeenCalledWith("connect ECONNREFUSED");
			expect(ssh.dispose).toHaveBeenCalled();
		});

		test("should fail before connecting when config is invalid", async () => {
			//given
			mockInputs({...validInputs, user: ""});

			//when
			await run();

			//then
			expect(core.setFailed).toHaveBeenCalledWith("Missing user");
			expect(ssh.connect).not.toHaveBeenCalled();
		});
	});

	describe("execution", () => {
		test("should send the script through stdin without a pty", async () => {
			//given
			mockInputs({...validInputs, envs: JSON.stringify({FOO: "a'b"})}, ["echo one", "echo two"]);

			//when
			await run();

			//then
			expect(ssh.execCommand).toHaveBeenCalledTimes(1);
			const [command, options] = ssh.execCommand.mock.calls[0];
			expect(command).toBe("bash --noprofile --norc -c 'source /dev/stdin'");
			expect(options.stdin).toBe("set -euo pipefail\nexport FOO='a'\\''b'\necho one\necho two\n");
			expect(options.execOptions).toBeUndefined();
			expect(core.setFailed).not.toHaveBeenCalled();
			expect(ssh.dispose).toHaveBeenCalled();
		});

		test("should not export envs named like action options by default", async () => {
			//given
			mockInputs({...validInputs, envs: JSON.stringify({HOST: "h", Passphrase: "p", timeout: "1", FOO: "foo"})});

			//when
			await run();

			//then
			expect(ssh.execCommand.mock.calls[0][1].stdin).toBe("set -euo pipefail\nexport FOO='foo'\necho ok\n");
		});

		test("should export envs named like action options when exportActionOptions is true", async () => {
			//given
			mockInputs({...validInputs, envs: JSON.stringify({HOST: "h", FOO: "foo"}), exportActionOptions: "true"});

			//when
			await run();

			//then
			expect(ssh.execCommand.mock.calls[0][1].stdin).toBe(
				"set -euo pipefail\nexport HOST='h'\nexport FOO='foo'\necho ok\n"
			);
		});

		test("should upload the script to a temporary file and run it in a pty when tty is true", async () => {
			//given
			mockInputs({...validInputs, tty: "true", envs: JSON.stringify({FOO: "foo"})});
			ssh.execCommand.mockResolvedValueOnce({...success, stdout: "/tmp/tmp.it's\n"});

			//when
			await run();

			//then
			expect(ssh.execCommand).toHaveBeenCalledTimes(2);

			const [uploadCommand, uploadOptions] = ssh.execCommand.mock.calls[0];
			expect(uploadCommand).toContain("umask 077");
			expect(uploadCommand).toContain("mktemp");
			expect(uploadOptions).toStrictEqual({stdin: "set -euo pipefail\nexport FOO='foo'\necho ok\n"});

			const [command, options] = ssh.execCommand.mock.calls[1];
			expect(command).toBe(
				`bash --noprofile --norc -c 'exec 9<"$1"; rm -f -- "$1"; shift; source /dev/fd/9' bash '/tmp/tmp.it'\\''s'`
			);
			expect(options.execOptions).toStrictEqual({pty: true});
			expect(options.stdin).toBeUndefined();
			expect(core.setFailed).not.toHaveBeenCalled();
		});

		test.each([
			{name: "upload command fails", response: {...success, code: 1, stderr: "mktemp: failed\n"}},
			{name: "upload command prints no path", response: success},
		])("should fail and not run the script when $name", async ({response}) => {
			//given
			mockInputs({...validInputs, tty: "true"});
			ssh.execCommand.mockResolvedValueOnce(response);

			//when
			await run();

			//then
			expect(ssh.execCommand).toHaveBeenCalledTimes(1);
			expect(core.setFailed).toHaveBeenCalledWith(expect.stringContaining("Failed to upload script"));
		});

		test("should stream output of the command", async () => {
			//given
			mockInputs(validInputs);
			ssh.execCommand.mockImplementation(async (_command: string, options: Record<string, CallableFunction>) => {
				options.onStdout(Buffer.from("out"));
				options.onStderr(Buffer.from("err"));
				return {...success, stdout: "out", stderr: "err"};
			});

			//when
			await run();

			//then
			expect(stdoutWrite).toHaveBeenCalledWith("out");
			expect(stderrWrite).toHaveBeenCalledWith("err");
			expect(core.error).not.toHaveBeenCalled();
		});

		test.each([
			{response: {...success, code: 2, stderr: "boom\n"}, message: "Command failed: boom"},
			{response: {...success, code: 1}, message: "Command failed"},
			{response: {...success, code: null, signal: "KILL"}, message: "Command failed"},
		])("should fail with $message when command exits with code $response.code", async ({response, message}) => {
			//given
			mockInputs(validInputs);
			ssh.execCommand.mockResolvedValue(response);

			//when
			await run();

			//then
			expect(core.setFailed).toHaveBeenCalledWith(message);
			expect(ssh.dispose).toHaveBeenCalled();
		});
	});

	describe("timeout", () => {
		test("should close the connection and fail when command runs longer than timeout", async () => {
			//given
			vi.useFakeTimers();
			mockInputs({...validInputs, timeout: "5"});
			ssh.execCommand.mockReturnValue(new Promise(() => undefined));

			//when
			const running = run();
			await vi.advanceTimersByTimeAsync(4999);
			expect(core.setFailed).not.toHaveBeenCalled();
			await vi.advanceTimersByTimeAsync(1);
			await running;

			//then
			expect(core.setFailed).toHaveBeenCalledWith("Command timed out after 5 seconds");
			expect(ssh.dispose).toHaveBeenCalled();
		});

		test("should not fail when command finishes before timeout", async () => {
			//given
			vi.useFakeTimers();
			mockInputs({...validInputs, timeout: "5"});

			//when
			await run();
			await vi.advanceTimersByTimeAsync(10000);

			//then
			expect(core.setFailed).not.toHaveBeenCalled();
			expect(vi.getTimerCount()).toBe(0);
		});
	});
});
