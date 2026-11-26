import tseslint from "typescript-eslint";
import prettierRecommended from "eslint-plugin-prettier/recommended";

export default tseslint.config(
	{
		ignores: ["dist/", "lib/", "coverage/", "node_modules/", "eslint.config.mjs"],
	},
	...tseslint.configs.recommended,
	prettierRecommended,
	{
		languageOptions: {
			parserOptions: {
				project: "./tsconfig.json",
				tsconfigRootDir: import.meta.dirname,
			},
		},
		rules: {
			"no-unused-vars": "off",
			"@typescript-eslint/no-unused-vars": "error",
			"@typescript-eslint/no-require-imports": "error",
			"@typescript-eslint/array-type": "error",
			"@typescript-eslint/await-thenable": "error",
			"@typescript-eslint/ban-ts-comment": "error",
			camelcase: "off",
			"@typescript-eslint/consistent-type-assertions": "error",
			"@typescript-eslint/explicit-function-return-type": ["error", {allowExpressions: true}],
			"@typescript-eslint/no-array-constructor": "error",
			"@typescript-eslint/no-empty-object-type": "error",
			"@typescript-eslint/no-explicit-any": "warn",
			"@typescript-eslint/no-for-in-array": "error",
			"@typescript-eslint/no-inferrable-types": "error",
			"@typescript-eslint/no-misused-new": "error",
			"@typescript-eslint/no-namespace": "error",
			"@typescript-eslint/no-non-null-assertion": "warn",
			"@typescript-eslint/no-unnecessary-qualifier": "error",
			"@typescript-eslint/no-unnecessary-type-assertion": "error",
			"@typescript-eslint/no-useless-constructor": "error",
			"@typescript-eslint/prefer-for-of": "warn",
			"@typescript-eslint/prefer-function-type": "warn",
			"@typescript-eslint/prefer-includes": "error",
			"@typescript-eslint/prefer-string-starts-ends-with": "error",
			"@typescript-eslint/promise-function-async": "error",
			"@typescript-eslint/require-array-sort-compare": "error",
			"@typescript-eslint/restrict-plus-operands": "error",
			"@typescript-eslint/unbound-method": "error",
		},
	}
);
