import * as core from "@actions/core";
import type {Config, NodeSSH} from "node-ssh";
import type {ActionConfig} from "./types.js";
import {getFingerprint, matchesFingerprint} from "./hostKey.js";

const KEEPALIVE_INTERVAL_MS = 15_000;

/** Connects to the server, the host key is verified when the fingerprint is configured. */
export const connect = async (ssh: NodeSSH, config: ActionConfig): Promise<void> => {
	const sshConfig: Config = {
		host: config.host,
		port: config.port,
		username: config.user,
		keepaliveInterval: KEEPALIVE_INTERVAL_MS,
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

	try {
		await ssh.connect(sshConfig);
	} catch (error) {
		if (rejectedFingerprint) {
			throw new Error(`Host key verification failed, server presented ${rejectedFingerprint}`);
		}
		throw error;
	}
};
