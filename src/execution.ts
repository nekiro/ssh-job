import type {NodeSSH, SSHExecCommandResponse} from "node-ssh";
import {shellQuote} from "./script.js";
import type {RemoteCommand} from "./types.js";

const SHELL = "bash --noprofile --norc";

/**
 * A pseudo-terminal echoes its input, which would print the script (and the exported envs) to the log,
 * so the script is uploaded to a private temporary file first. Returns the path of that file.
 */
const uploadScript = async (ssh: NodeSSH, script: string): Promise<string> => {
	const upload = await ssh.execCommand(`umask 077 && f=$(mktemp) && cat > "$f" && printf %s "$f"`, {stdin: script});
	const scriptPath = upload.stdout.trim();

	if (upload.code !== 0 || !scriptPath) {
		const stderr = upload.stderr?.trim();
		throw new Error(stderr ? `Failed to upload script: ${stderr}` : "Failed to upload script");
	}

	return scriptPath;
};

/** Decides how the script reaches the remote shell: through stdin, or from an uploaded file when a tty is used. */
export const prepareCommand = async (ssh: NodeSSH, script: string, tty: boolean): Promise<RemoteCommand> => {
	if (!tty) {
		return {command: `${SHELL} -c 'source /dev/stdin'`, options: {stdin: script}};
	}

	const scriptPath = await uploadScript(ssh, script);

	return {
		// the file is removed before the script starts, the shell keeps reading it through the open descriptor
		command: `${SHELL} -c 'exec 9<"$1"; rm -f -- "$1"; shift; source /dev/fd/9' bash ${shellQuote(scriptPath)}`,
		options: {execOptions: {pty: true}},
	};
};

/** Runs the command and streams its output, timeoutSeconds 0 waits without a limit. */
export const execute = async (
	ssh: NodeSSH,
	{command, options}: RemoteCommand,
	timeoutSeconds: number
): Promise<SSHExecCommandResponse> => {
	const execution = ssh.execCommand(command, {
		...options,
		onStdout: chunk => process.stdout.write(chunk.toString("utf8")),
		onStderr: chunk => process.stderr.write(chunk.toString("utf8")),
	});

	if (timeoutSeconds === 0) {
		return execution;
	}

	let timer: NodeJS.Timeout | undefined;
	const timeout = new Promise<never>((_, reject) => {
		timer = setTimeout(() => {
			// closing the connection is the only way to stop waiting for the remote command
			ssh.dispose();
			reject(new Error(`Command timed out after ${timeoutSeconds} seconds`));
		}, timeoutSeconds * 1000);
	});

	return Promise.race([execution, timeout]).finally(() => clearTimeout(timer));
};
