import {describe, expect, test} from "vitest";
import {buildScript, shellQuote} from "../script.js";

describe("script", () => {
	test.each([
		{input: "plain", output: "'plain'"},
		{input: "with space", output: "'with space'"},
		{input: "it's", output: "'it'\\''s'"},
		{input: "$(reboot) `id` $HOME", output: "'$(reboot) `id` $HOME'"},
		{input: "", output: "''"},
	])("shellQuote should quote $input", ({input, output}) => {
		expect(shellQuote(input)).toBe(output);
	});

	test("buildScript should put strict mode first, then exports, then commands", () => {
		//when
		const result = buildScript([{key: "FOO", value: "a'b"}], ["echo one", "echo two"]);

		//then
		expect(result).toBe("set -euo pipefail\nexport FOO='a'\\''b'\necho one\necho two\n");
	});

	test("buildScript should work without envs", () => {
		expect(buildScript([], ["ls"])).toBe("set -euo pipefail\nls\n");
	});
});
