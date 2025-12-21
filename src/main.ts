import * as core from "@actions/core";
import {ConfigManager} from "./ConfigManager";
import {NodeSSH, Config, SSHExecCommandOptions} from "node-ssh";

async function run(): Promise<void> {
	const ssh = new NodeSSH();

	try {
		const configManager = new ConfigManager();

		const sshConfig: Config = {
			host: configManager.config.host,
			port: configManager.config.port,
			username: configManager.config.user,
		};

		if (configManager.config.key) {
			sshConfig.privateKey = configManager.config.key;
			if (configManager.config.passphrase) {
				sshConfig.passphrase = configManager.config.passphrase;
			}
		} else {
			sshConfig.password = configManager.config.password;
		}

		// initlaize ssh
		await ssh.connect(sshConfig);

		core.info("Connection estabilished...");

		// ignore action inputs when needed
		const ignoredEnvKeys = new Set(ConfigManager.exportIgnoredEnvs.map(key => key.toLowerCase()));
		const envs = configManager.config.exportActionOptions
			? configManager.config.envs
			: configManager.config.envs.filter(({key}) => !ignoredEnvKeys.has(key.toLowerCase()));

		const shellQuote = (value: string): string => `'${value.replace(/'/g, `'\\''`)}'`;
		const exportLines = envs.map(({key, value}) => `export ${key}=${shellQuote(value)}`);
		const scriptLines = ["set -euo pipefail", ...exportLines, ...configManager.config.command];
		const script = `${scriptLines.join("\n")}\n`;

		core.info(`Executing commands...`);
		core.info("########## START ###########");

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

		if (configManager.config.tty) {
			execCommandOptions.execOptions = {pty: true};
		}

		const response = await ssh.execCommand("bash --noprofile --norc -c 'source /dev/stdin'", {
			...execCommandOptions,
			stdin: script,
		});

		if (!sawStdout && response.stdout) {
			core.info(response.stdout);
		}
		if (!sawStderr && response.stderr) {
			core.error(response.stderr);
		}

		if (response.code != 0) {
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
