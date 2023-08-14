import * as core from "@actions/core";
import {ConfigManager} from "./ConfigManager";
import {NodeSSH, Config} from "node-ssh";

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
		} else {
			sshConfig.password = configManager.config.password;
		}

		// initlaize ssh
		await ssh.connect(sshConfig);

		core.info("Connection estabilished...");

		// ignore action inputs when needed
		const envs = configManager.config.exportActionOptions
			? configManager.config.envs
			: configManager.config.envs.filter(({key}) =>
					ConfigManager.exportIgnoredEnvs.filter(ignoredKey => key.toLowerCase().includes(ignoredKey.toLowerCase()))
			  );

		// export provided envs
		configManager.config.command.unshift(`export ${envs.map(({key, value}) => `${key}="${value}"`).join(" ")}`);

		core.info(`Executing commands...`);
		core.info("########## START ###########");

		await ssh.execCommand(configManager.config.command.join(";"), {
			onStdout: chunk => process.stdout.write(chunk.toString("utf8")),
			onStderr: chunk => process.stdout.write(chunk.toString("utf8")),
		});

		core.info("########### END ##########");
		core.info("Executed all commands successfully! 🚀");
	} catch (error) {
		core.setFailed(error instanceof Error ? error.message : String(error));
	} finally {
		ssh.dispose();
	}
}

run();
