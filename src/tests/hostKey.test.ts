import {describe, expect, test} from "vitest";
import {createHash} from "crypto";
import {getFingerprint, matchesFingerprint} from "../hostKey.js";

describe("hostKey", () => {
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
