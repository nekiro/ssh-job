import * as core from "@actions/core";
import {ConfigManager} from "./ConfigManager";
import {NodeSSH, Config} from "node-ssh";

async function run(): Promise<void> {
	try {
		const configManager = new ConfigManager();

		const sshConfig: Config = {
			host: configManager.config.host,
			port: configManager.config.port,
			username: configManager.config.user,
		};

		if (configManager.config.key) {
			sshConfig.privateKey = configManager.config.key;
		} else {
			sshConfig.password = sshConfig.password;
		}

		// initlaize ssh
		const ssh = new NodeSSH();
		await ssh.connect(sshConfig);

		core.info("Connection estabilished...");

		core.startGroup("CMD output");

		// ignore action inputs when needed
		const envs = configManager.config.exportActionOptions
			? configManager.config.envs
			: configManager.config.envs.filter(({key}) =>
					ConfigManager.exportIgnoredEnvs.filter(ignoredKey => key.toLowerCase().includes(ignoredKey.toLowerCase()))
			  );

		// export provided envs
		configManager.config.command.unshift(`export ${envs.map(({key, value}) => `${key}="${value}"`).join(" ")}`);

		let error: string | undefined;

		core.info(`Executing commands...`);

		await ssh.execCommand(configManager.config.command.join(";"), {
			onStdout: chunk => core.info(chunk.toString("utf8")),
			onStderr: chunk => {
				error = chunk.toString("utf8");
			},
		});

		if (error) {
			ssh.dispose();
			throw error;
		}

		core.endGroup();

		ssh.dispose();
	} catch (error) {
		core.setFailed(error instanceof Error ? error.message : String(error));
	}
}

run();
