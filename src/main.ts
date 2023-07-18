import core from "@actions/core";
import {parse, validate} from "./config";
import {NodeSSH, Config} from "node-ssh";

async function run(): Promise<void> {
	try {
		const config = parse();

		// validate if enough credentials is provided
		validate(config);

		const sshConfig: Config = {host: config.host, port: config.port};

		if (config.key) {
			sshConfig.privateKey = config.key;
		} else if (config.keyPath) {
			sshConfig.privateKeyPath = config.keyPath;
		} else {
			sshConfig.username = config.username;
			sshConfig.password = sshConfig.password;
		}

		// initlaize ssh
		const ssh = await new NodeSSH().connect(sshConfig);

		await ssh.exec(config.command.join("\n"), [], {
			onStdout(chunk) {
				console.log("stdoutChunk", chunk.toString("utf8"));
			},
			onStderr(chunk) {
				console.log("stderrChunk", chunk.toString("utf8"));
			},
		});
	} catch (error) {
		if (error instanceof Error) {
			core.setFailed(error.message);
		}
	}
}

run();
