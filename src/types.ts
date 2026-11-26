import type {SSHExecCommandOptions} from "node-ssh";

export interface EnvVariable {
	key: string;
	value: string;
}

export interface ActionConfig {
	host: string;
	port: number;
	user: string;
	key: string;
	passphrase: string;
	password: string;
	fingerprint: string;
	/** Seconds to wait for the connection and authentication. */
	connectTimeout: number;
	/** Seconds to wait for the command, 0 disables the timeout. */
	timeout: number;
	tty: boolean;
	command: string[];
	/** Variables to export in the remote shell, already filtered. */
	envs: EnvVariable[];
}

/** Every input of the action, one property for each entry of action.yml. */
export interface ActionInputs extends Omit<ActionConfig, "envs"> {
	envs: Record<string, unknown>;
	ignoredEnvs: string[];
	exportActionOptions: boolean;
}

/** A command for the remote shell together with the options it is executed with. */
export interface RemoteCommand {
	command: string;
	options: SSHExecCommandOptions;
}
