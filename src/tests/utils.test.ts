import {createHash} from "crypto";
import {buildScript, getFingerprint, matchesFingerprint, shellQuote} from "../utils";

describe("utils", () => {
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

	describe("fingerprint", () => {
		const hostKey = Buffer.from("fake host key");
		const digest = createHash("sha256").update(hostKey).digest("base64");
		const unpadded = digest.replace(/=+$/, "");

		test("getFingerprint should return ssh-keygen formatted fingerprint", () => {
			expect(getFingerprint(hostKey)).toBe(`SHA256:${unpadded}`);
		});

		test.each([`SHA256:${unpadded}`, unpadded, digest, `  sha256:${unpadded}\n`])(
			"matchesFingerprint should accept %j",
			expected => {
				expect(matchesFingerprint(hostKey, expected)).toBe(true);
			}
		);

		test.each(["SHA256:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", unpadded.toLowerCase(), "x"])(
			"matchesFingerprint should reject %j",
			expected => {
				expect(matchesFingerprint(hostKey, expected)).toBe(false);
			}
		);
	});
});
