import type {EnvVariable} from "./types.js";

export const shellQuote = (value: string): string => `'${value.replace(/'/g, `'\\''`)}'`;

/** Builds the bash script that runs on the server: strict mode, exported envs, then the commands. */
export const buildScript = (envs: EnvVariable[], command: string[]): string => {
	const exportLines = envs.map(({key, value}) => `export ${key}=${shellQuote(value)}`);
	return `${["set -euo pipefail", ...exportLines, ...command].join("\n")}\n`;
};
