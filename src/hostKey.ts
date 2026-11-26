import {createHash} from "crypto";

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
