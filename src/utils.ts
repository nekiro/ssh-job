import {createHash} from "crypto";

export const shellQuote = (value: string): string => `'${value.replace(/'/g, `'\\''`)}'`;

export const buildScript = (envs: {key: string; value: string}[], command: string[]): string => {
	const exportLines = envs.map(({key, value}) => `export ${key}=${shellQuote(value)}`);
	return `${["set -euo pipefail", ...exportLines, ...command].join("\n")}\n`;
};

/** Returns the host key fingerprint in the format printed by `ssh-keygen -lf`, ex. SHA256:abc... */
export const getFingerprint = (hostKey: Buffer): string => {
	return `SHA256:${createHash("sha256").update(hostKey).digest("base64").replace(/=+$/, "")}`;
};

const normalizeFingerprint = (fingerprint: string): string => {
	return fingerprint
		.trim()
		.replace(/^SHA256:/i, "")
		.replace(/=+$/, "");
};

export const matchesFingerprint = (hostKey: Buffer, expected: string): boolean => {
	return normalizeFingerprint(getFingerprint(hostKey)) === normalizeFingerprint(expected);
};
