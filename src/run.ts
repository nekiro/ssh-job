import * as core from "@actions/core";
import {NodeSSH} from "node-ssh";
import {loadConfig} from "./config.js";
import {connect} from "./connection.js";
import {execute, prepareCommand} from "./execution.js";
import {buildScript} from "./script.js";

export async function run(): Promise<void> {
	const ssh = new NodeSSH();

	try {
		const config = loadConfig();

		await connect(ssh, config);
		core.info("Connection established...");

		const remoteCommand = await prepareCommand(ssh, buildScript(config.envs, config.command), config.tty);

		core.info(`Executing commands...`);
		core.info("########## START ###########");

		const response = await execute(ssh, remoteCommand, config.timeout);

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
