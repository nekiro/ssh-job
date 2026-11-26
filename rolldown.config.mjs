import {defineConfig} from "rolldown";
import license from "rollup-plugin-license";

const unusedModules = /node_modules[\\/](undici|tunnel|@actions[\\/]http-client)[\\/]/;

export default defineConfig({
	input: "src/main.ts",
	platform: "node",
	// optional native addons of ssh2, they are not installed and ssh2 falls back to JavaScript
	external: [/\.node$/],
	treeshake: {
		// @actions/core imports an HTTP client for features this action does not use
		moduleSideEffects: id => !unusedModules.test(id),
	},
	plugins: [
		license({
			thirdParty: {
				output: "dist/licenses.txt",
			},
		}),
	],
	output: {
		file: "dist/index.js",
		format: "esm",
		codeSplitting: false,
	},
});
