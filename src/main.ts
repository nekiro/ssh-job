import * as core from "@actions/core";
import {ConfigManager} from "./ConfigManager.js";
import {NodeSSH, Config, SSHExecCommandOptions} from "node-ssh";
import {buildScript, getFingerprint, matchesFingerprint, shellQuote} from "./utils.js";

const SHELL = "bash --noprofile --norc";

async function run(): Promise<void> {
	const ssh = new NodeSSH();

	try {
		const configManager = new ConfigManager();
		const {config} = configManager;

		const sshConfig: Config = {
			host: config.host,
			port: config.port,
			username: config.user,
			keepaliveInterval: 15000,
			readyTimeout: config.connectTimeout * 1000,
		};

		if (config.key) {
			sshConfig.privateKey = config.key;
			if (config.passphrase) {
				sshConfig.passphrase = config.passphrase;
			}
		} else {
			sshConfig.password = config.password;
		}

		let rejectedFingerprint = "";
		if (config.fingerprint) {
			sshConfig.hostVerifier = (hostKey: Buffer): boolean => {
				if (matchesFingerprint(hostKey, config.fingerprint)) {
					return true;
				}
				rejectedFingerprint = getFingerprint(hostKey);
				return false;
			};
		} else {
			core.warning(
				"Host key is not verified, set the fingerprint input to protect the connection from man-in-the-middle attacks"
			);
		}

		// initialize ssh
		try {
			await ssh.connect(sshConfig);
		} catch (error) {
			if (rejectedFingerprint) {
				throw new Error(`Host key verification failed, server presented ${rejectedFingerprint}`);
			}
			throw error;
		}

		core.info("Connection established...");

		// ignore action inputs when needed
		const ignoredEnvKeys = new Set(ConfigManager.exportIgnoredEnvs.map(key => key.toLowerCase()));
		const envs = config.exportActionOptions
			? config.envs
			: config.envs.filter(({key}) => !ignoredEnvKeys.has(key.toLowerCase()));

		const script = buildScript(envs, config.command);

		let sawStdout = false;
		let sawStderr = false;
		const execCommandOptions: SSHExecCommandOptions = {
			onStdout: chunk => {
				sawStdout = true;
				process.stdout.write(chunk.toString("utf8"));
			},
			onStderr: chunk => {
				sawStderr = true;
				process.stderr.write(chunk.toString("utf8"));
			},
		};

		let command = `${SHELL} -c 'source /dev/stdin'`;

		if (config.tty) {
			// A pseudo-terminal echoes its input, which would print the script (and the exported envs) to the log,
			// so the script is uploaded to a private temporary file first and removed before it starts running.
			const upload = await ssh.execCommand(`umask 077 && f=$(mktemp) && cat > "$f" && printf %s "$f"`, {
				stdin: script,
			});
			const scriptPath = upload.stdout.trim();

			if (upload.code !== 0 || !scriptPath) {
				const stderr = upload.stderr?.trim();
				throw new Error(stderr ? `Failed to upload script: ${stderr}` : "Failed to upload script");
			}

			command = `${SHELL} -c 'exec 9<"$1"; rm -f -- "$1"; shift; source /dev/fd/9' bash ${shellQuote(scriptPath)}`;
			execCommandOptions.execOptions = {pty: true};
		} else {
			execCommandOptions.stdin = script;
		}

		core.info(`Executing commands...`);
		core.info("########## START ###########");

		let timer: NodeJS.Timeout | undefined;
		const execution = ssh.execCommand(command, execCommandOptions);
		const response = await (config.timeout === 0
			? execution
			: Promise.race([
					execution,
					new Promise<never>((_, reject) => {
						timer = setTimeout(() => {
							// closing the connection is the only way to stop waiting for the remote command
							ssh.dispose();
							reject(new Error(`Command timed out after ${config.timeout} seconds`));
						}, config.timeout * 1000);
					}),
				]).finally(() => clearTimeout(timer)));

		if (!sawStdout && response.stdout) {
			core.info(response.stdout);
		}
		if (!sawStderr && response.stderr) {
			core.error(response.stderr);
		}

		if (response.code !== 0) {
			const stderr = response.stderr?.trim();
			throw new Error(stderr ? `Command failed: ${stderr}` : "Command failed");
		}

		core.info("########### END ##########");
		core.info("Executed all commands successfully! 🚀");
	} catch (error) {
		core.setFailed(error instanceof Error ? error.message : String(error));
	} finally {
		ssh.dispose();
	}
}

run();
