import { createRequire } from "node:module";
import * as os from "os";
import os$1, { EOL } from "os";
import { createHash, randomBytes } from "crypto";
import * as fs from "fs";
import fs$1, { constants, promises } from "fs";
import fsPath from "path";
import { StringDecoder } from "string_decoder";
import * as events from "events";
import "child_process";
import invariant, { AssertionError } from "assert";
import "timers";
// \0rolldown/runtime.js
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJSMin = (cb, mod) => () => (mod || (cb((mod = { exports: {} }).exports, mod, mod.exports), cb = null), mod.exports);
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
		key = keys[i];
		if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
			get: ((k) => from[k]).bind(null, key),
			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
		});
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule || !__hasOwnProp.call(mod, "default") ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));
var __require = /* #__PURE__ */ (() => createRequire(import.meta.url))();
// node_modules/@actions/core/lib/utils.js
/**
* Sanitizes an input into a string so it can be passed into issueCommand safely
* @param input input to sanitize into a string
*/
function toCommandValue(input) {
	if (input === null || input === void 0) return "";
	else if (typeof input === "string" || input instanceof String) return input;
	return JSON.stringify(input);
}
/**
*
* @param annotationProperties
* @returns The command properties to send with the actual annotation command
* See IssueCommandProperties: https://github.com/actions/runner/blob/main/src/Runner.Worker/ActionCommandManager.cs#L646
*/
function toCommandProperties(annotationProperties) {
	if (!Object.keys(annotationProperties).length) return {};
	return {
		title: annotationProperties.title,
		file: annotationProperties.file,
		line: annotationProperties.startLine,
		endLine: annotationProperties.endLine,
		col: annotationProperties.startColumn,
		endColumn: annotationProperties.endColumn
	};
}
// node_modules/@actions/core/lib/command.js
/**
* Issues a command to the GitHub Actions runner
*
* @param command - The command name to issue
* @param properties - Additional properties for the command (key-value pairs)
* @param message - The message to include with the command
* @remarks
* This function outputs a specially formatted string to stdout that the Actions
* runner interprets as a command. These commands can control workflow behavior,
* set outputs, create annotations, mask values, and more.
*
* Command Format:
*   ::name key=value,key=value::message
*
* @example
* ```typescript
* // Issue a warning annotation
* issueCommand('warning', {}, 'This is a warning message');
* // Output: ::warning::This is a warning message
*
* // Set an environment variable
* issueCommand('set-env', { name: 'MY_VAR' }, 'some value');
* // Output: ::set-env name=MY_VAR::some value
*
* // Add a secret mask
* issueCommand('add-mask', {}, 'secretValue123');
* // Output: ::add-mask::secretValue123
* ```
*
* @internal
* This is an internal utility function that powers the public API functions
* such as setSecret, warning, error, and exportVariable.
*/
function issueCommand(command, properties, message) {
	const cmd = new Command(command, properties, message);
	process.stdout.write(cmd.toString() + os.EOL);
}
const CMD_STRING = "::";
var Command = class {
	constructor(command, properties, message) {
		if (!command) command = "missing.command";
		this.command = command;
		this.properties = properties;
		this.message = message;
	}
	toString() {
		let cmdStr = CMD_STRING + this.command;
		if (this.properties && Object.keys(this.properties).length > 0) {
			cmdStr += " ";
			let first = true;
			for (const key in this.properties) if (this.properties.hasOwnProperty(key)) {
				const val = this.properties[key];
				if (val) {
					if (first) first = false;
					else cmdStr += ",";
					cmdStr += `${key}=${escapeProperty(val)}`;
				}
			}
		}
		cmdStr += `${CMD_STRING}${escapeData(this.message)}`;
		return cmdStr;
	}
};
function escapeData(s) {
	return toCommandValue(s).replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
}
function escapeProperty(s) {
	return toCommandValue(s).replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A").replace(/:/g, "%3A").replace(/,/g, "%2C");
}
// node_modules/@actions/core/lib/summary.js
var __awaiter$6 = function(thisArg, _arguments, P, generator) {
	function adopt(value) {
		return value instanceof P ? value : new P(function(resolve) {
			resolve(value);
		});
	}
	return new (P || (P = Promise))(function(resolve, reject) {
		function fulfilled(value) {
			try {
				step(generator.next(value));
			} catch (e) {
				reject(e);
			}
		}
		function rejected(value) {
			try {
				step(generator["throw"](value));
			} catch (e) {
				reject(e);
			}
		}
		function step(result) {
			result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
		}
		step((generator = generator.apply(thisArg, _arguments || [])).next());
	});
};
const { access, appendFile, writeFile } = promises;
const SUMMARY_ENV_VAR = "GITHUB_STEP_SUMMARY";
var Summary = class {
	constructor() {
		this._buffer = "";
	}
	/**
	* Finds the summary file path from the environment, rejects if env var is not found or file does not exist
	* Also checks r/w permissions.
	*
	* @returns step summary file path
	*/
	filePath() {
		return __awaiter$6(this, void 0, void 0, function* () {
			if (this._filePath) return this._filePath;
			const pathFromEnv = process.env[SUMMARY_ENV_VAR];
			if (!pathFromEnv) throw new Error(`Unable to find environment variable for $${SUMMARY_ENV_VAR}. Check if your runtime environment supports job summaries.`);
			try {
				yield access(pathFromEnv, constants.R_OK | constants.W_OK);
			} catch (_a) {
				throw new Error(`Unable to access summary file: '${pathFromEnv}'. Check if the file has correct read/write permissions.`);
			}
			this._filePath = pathFromEnv;
			return this._filePath;
		});
	}
	/**
	* Wraps content in an HTML tag, adding any HTML attributes
	*
	* @param {string} tag HTML tag to wrap
	* @param {string | null} content content within the tag
	* @param {[attribute: string]: string} attrs key-value list of HTML attributes to add
	*
	* @returns {string} content wrapped in HTML element
	*/
	wrap(tag, content, attrs = {}) {
		const htmlAttrs = Object.entries(attrs).map(([key, value]) => ` ${key}="${value}"`).join("");
		if (!content) return `<${tag}${htmlAttrs}>`;
		return `<${tag}${htmlAttrs}>${content}</${tag}>`;
	}
	/**
	* Writes text in the buffer to the summary buffer file and empties buffer. Will append by default.
	*
	* @param {SummaryWriteOptions} [options] (optional) options for write operation
	*
	* @returns {Promise<Summary>} summary instance
	*/
	write(options) {
		return __awaiter$6(this, void 0, void 0, function* () {
			const overwrite = !!(options === null || options === void 0 ? void 0 : options.overwrite);
			const filePath = yield this.filePath();
			yield (overwrite ? writeFile : appendFile)(filePath, this._buffer, { encoding: "utf8" });
			return this.emptyBuffer();
		});
	}
	/**
	* Clears the summary buffer and wipes the summary file
	*
	* @returns {Summary} summary instance
	*/
	clear() {
		return __awaiter$6(this, void 0, void 0, function* () {
			return this.emptyBuffer().write({ overwrite: true });
		});
	}
	/**
	* Returns the current summary buffer as a string
	*
	* @returns {string} string of summary buffer
	*/
	stringify() {
		return this._buffer;
	}
	/**
	* If the summary buffer is empty
	*
	* @returns {boolen} true if the buffer is empty
	*/
	isEmptyBuffer() {
		return this._buffer.length === 0;
	}
	/**
	* Resets the summary buffer without writing to summary file
	*
	* @returns {Summary} summary instance
	*/
	emptyBuffer() {
		this._buffer = "";
		return this;
	}
	/**
	* Adds raw text to the summary buffer
	*
	* @param {string} text content to add
	* @param {boolean} [addEOL=false] (optional) append an EOL to the raw text (default: false)
	*
	* @returns {Summary} summary instance
	*/
	addRaw(text, addEOL = false) {
		this._buffer += text;
		return addEOL ? this.addEOL() : this;
	}
	/**
	* Adds the operating system-specific end-of-line marker to the buffer
	*
	* @returns {Summary} summary instance
	*/
	addEOL() {
		return this.addRaw(EOL);
	}
	/**
	* Adds an HTML codeblock to the summary buffer
	*
	* @param {string} code content to render within fenced code block
	* @param {string} lang (optional) language to syntax highlight code
	*
	* @returns {Summary} summary instance
	*/
	addCodeBlock(code, lang) {
		const attrs = Object.assign({}, lang && { lang });
		const element = this.wrap("pre", this.wrap("code", code), attrs);
		return this.addRaw(element).addEOL();
	}
	/**
	* Adds an HTML list to the summary buffer
	*
	* @param {string[]} items list of items to render
	* @param {boolean} [ordered=false] (optional) if the rendered list should be ordered or not (default: false)
	*
	* @returns {Summary} summary instance
	*/
	addList(items, ordered = false) {
		const tag = ordered ? "ol" : "ul";
		const listItems = items.map((item) => this.wrap("li", item)).join("");
		const element = this.wrap(tag, listItems);
		return this.addRaw(element).addEOL();
	}
	/**
	* Adds an HTML table to the summary buffer
	*
	* @param {SummaryTableCell[]} rows table rows
	*
	* @returns {Summary} summary instance
	*/
	addTable(rows) {
		const tableBody = rows.map((row) => {
			const cells = row.map((cell) => {
				if (typeof cell === "string") return this.wrap("td", cell);
				const { header, data, colspan, rowspan } = cell;
				const tag = header ? "th" : "td";
				const attrs = Object.assign(Object.assign({}, colspan && { colspan }), rowspan && { rowspan });
				return this.wrap(tag, data, attrs);
			}).join("");
			return this.wrap("tr", cells);
		}).join("");
		const element = this.wrap("table", tableBody);
		return this.addRaw(element).addEOL();
	}
	/**
	* Adds a collapsable HTML details element to the summary buffer
	*
	* @param {string} label text for the closed state
	* @param {string} content collapsable content
	*
	* @returns {Summary} summary instance
	*/
	addDetails(label, content) {
		const element = this.wrap("details", this.wrap("summary", label) + content);
		return this.addRaw(element).addEOL();
	}
	/**
	* Adds an HTML image tag to the summary buffer
	*
	* @param {string} src path to the image you to embed
	* @param {string} alt text description of the image
	* @param {SummaryImageOptions} options (optional) addition image attributes
	*
	* @returns {Summary} summary instance
	*/
	addImage(src, alt, options) {
		const { width, height } = options || {};
		const attrs = Object.assign(Object.assign({}, width && { width }), height && { height });
		const element = this.wrap("img", null, Object.assign({
			src,
			alt
		}, attrs));
		return this.addRaw(element).addEOL();
	}
	/**
	* Adds an HTML section heading element
	*
	* @param {string} text heading text
	* @param {number | string} [level=1] (optional) the heading level, default: 1
	*
	* @returns {Summary} summary instance
	*/
	addHeading(text, level) {
		const tag = `h${level}`;
		const allowedTag = [
			"h1",
			"h2",
			"h3",
			"h4",
			"h5",
			"h6"
		].includes(tag) ? tag : "h1";
		const element = this.wrap(allowedTag, text);
		return this.addRaw(element).addEOL();
	}
	/**
	* Adds an HTML thematic break (<hr>) to the summary buffer
	*
	* @returns {Summary} summary instance
	*/
	addSeparator() {
		const element = this.wrap("hr", null);
		return this.addRaw(element).addEOL();
	}
	/**
	* Adds an HTML line break (<br>) to the summary buffer
	*
	* @returns {Summary} summary instance
	*/
	addBreak() {
		const element = this.wrap("br", null);
		return this.addRaw(element).addEOL();
	}
	/**
	* Adds an HTML blockquote to the summary buffer
	*
	* @param {string} text quote text
	* @param {string} cite (optional) citation url
	*
	* @returns {Summary} summary instance
	*/
	addQuote(text, cite) {
		const attrs = Object.assign({}, cite && { cite });
		const element = this.wrap("blockquote", text, attrs);
		return this.addRaw(element).addEOL();
	}
	/**
	* Adds an HTML anchor tag to the summary buffer
	*
	* @param {string} text link text/content
	* @param {string} href hyperlink
	*
	* @returns {Summary} summary instance
	*/
	addLink(text, href) {
		const element = this.wrap("a", text, { href });
		return this.addRaw(element).addEOL();
	}
};
new Summary();
const { chmod, copyFile, lstat, mkdir, open, readdir, rename, rm, rmdir, stat, symlink, unlink } = fs.promises;
process.platform;
fs.constants.O_RDONLY;
process.platform;
events.EventEmitter;
events.EventEmitter;
os$1.platform();
os$1.arch();
/**
* The code to exit an action
*/
var ExitCode;
(function(ExitCode) {
	/**
	* A code indicating that the action was successful
	*/
	ExitCode[ExitCode["Success"] = 0] = "Success";
	/**
	* A code indicating that the action was a failure
	*/
	ExitCode[ExitCode["Failure"] = 1] = "Failure";
})(ExitCode || (ExitCode = {}));
/**
* Gets the value of an input.
* Unless trimWhitespace is set to false in InputOptions, the value is also trimmed.
* Returns an empty string if the value is not defined.
*
* @param     name     name of the input to get
* @param     options  optional. See InputOptions.
* @returns   string
*/
function getInput(name, options) {
	const val = process.env[`INPUT_${name.replace(/ /g, "_").toUpperCase()}`] || "";
	if (options && options.required && !val) throw new Error(`Input required and not supplied: ${name}`);
	if (options && options.trimWhitespace === false) return val;
	return val.trim();
}
/**
* Gets the values of an multiline input.  Each value is also trimmed.
*
* @param     name     name of the input to get
* @param     options  optional. See InputOptions.
* @returns   string[]
*
*/
function getMultilineInput(name, options) {
	const inputs = getInput(name, options).split("\n").filter((x) => x !== "");
	if (options && options.trimWhitespace === false) return inputs;
	return inputs.map((input) => input.trim());
}
/**
* Sets the action status to failed.
* When the action exits it will be with an exit code of 1
* @param message add error issue message
*/
function setFailed(message) {
	process.exitCode = ExitCode.Failure;
	error(message);
}
/**
* Writes debug message to user log
* @param message debug message
*/
function debug(message) {
	issueCommand("debug", {}, message);
}
/**
* Adds an error issue
* @param message error issue message. Errors will be converted to string via toString()
* @param properties optional properties to add to the annotation.
*/
function error(message, properties = {}) {
	issueCommand("error", toCommandProperties(properties), message instanceof Error ? message.toString() : message);
}
/**
* Adds a warning issue
* @param message warning issue message. Errors will be converted to string via toString()
* @param properties optional properties to add to the annotation.
*/
function warning(message, properties = {}) {
	issueCommand("warning", toCommandProperties(properties), message instanceof Error ? message.toString() : message);
}
/**
* Writes info to log with console.log.
* @param message info message
*/
function info(message) {
	process.stdout.write(message + os.EOL);
}
// node_modules/validator/lib/util/assertString.js
var require_assertString = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = assertString;
	function assertString(input) {
		if (input === void 0 || input === null) throw new TypeError("Expected a string but received a ".concat(input));
		if (input.constructor.name !== "String") throw new TypeError("Expected a string but received a ".concat(input.constructor.name));
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/toDate.js
var require_toDate = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = toDate;
	var _assertString = _interopRequireDefault(require_assertString());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	function toDate(date) {
		(0, _assertString.default)(date);
		date = Date.parse(date);
		return !isNaN(date) ? new Date(date) : null;
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/util/nullUndefinedCheck.js
var require_nullUndefinedCheck = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = isNullOrUndefined;
	function isNullOrUndefined(value) {
		return value === null || value === void 0;
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/alpha.js
var require_alpha = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.farsiLocales = exports.englishLocales = exports.dotDecimal = exports.decimal = exports.commaDecimal = exports.bengaliLocales = exports.arabicLocales = exports.alphanumeric = exports.alpha = void 0;
	var alpha = exports.alpha = {
		"en-US": /^[A-Z]+$/i,
		"az-AZ": /^[A-VXYZÇƏĞİıÖŞÜ]+$/i,
		"bg-BG": /^[А-Я]+$/i,
		"cs-CZ": /^[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]+$/i,
		"da-DK": /^[A-ZÆØÅ]+$/i,
		"de-DE": /^[A-ZÄÖÜß]+$/i,
		"el-GR": /^[Α-ώ]+$/i,
		"es-ES": /^[A-ZÁÉÍÑÓÚÜ]+$/i,
		"fa-IR": /^[ابپتثجچحخدذرزژسشصضطظعغفقکگلمنوهی]+$/i,
		"fi-FI": /^[A-ZÅÄÖ]+$/i,
		"fr-FR": /^[A-ZÀÂÆÇÉÈÊËÏÎÔŒÙÛÜŸ]+$/i,
		"it-IT": /^[A-ZÀÉÈÌÎÓÒÙ]+$/i,
		"ja-JP": /^[ぁ-んァ-ヶｦ-ﾟ一-龠ー・。、]+$/i,
		"nb-NO": /^[A-ZÆØÅ]+$/i,
		"nl-NL": /^[A-ZÁÉËÏÓÖÜÚ]+$/i,
		"nn-NO": /^[A-ZÆØÅ]+$/i,
		"hu-HU": /^[A-ZÁÉÍÓÖŐÚÜŰ]+$/i,
		"pl-PL": /^[A-ZĄĆĘŚŁŃÓŻŹ]+$/i,
		"pt-PT": /^[A-ZÃÁÀÂÄÇÉÊËÍÏÕÓÔÖÚÜ]+$/i,
		"ru-RU": /^[А-ЯЁ]+$/i,
		"kk-KZ": /^[А-ЯЁ\u04D8\u04B0\u0406\u04A2\u0492\u04AE\u049A\u04E8\u04BA]+$/i,
		"sl-SI": /^[A-ZČĆĐŠŽ]+$/i,
		"sk-SK": /^[A-ZÁČĎÉÍŇÓŠŤÚÝŽĹŔĽÄÔ]+$/i,
		"sr-RS@latin": /^[A-ZČĆŽŠĐ]+$/i,
		"sr-RS": /^[А-ЯЂЈЉЊЋЏ]+$/i,
		"sv-SE": /^[A-ZÅÄÖ]+$/i,
		"th-TH": /^[ก-๐\s]+$/i,
		"tr-TR": /^[A-ZÇĞİıÖŞÜ]+$/i,
		"uk-UA": /^[А-ЩЬЮЯЄIЇҐі]+$/i,
		"vi-VN": /^[A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴĐÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸ]+$/i,
		"ko-KR": /^[ㄱ-ㅎㅏ-ㅣ가-힣]*$/,
		"ku-IQ": /^[ئابپتجچحخدرڕزژسشعغفڤقکگلڵمنوۆھەیێيطؤثآإأكضصةظذ]+$/i,
		ar: /^[ءآأؤإئابةتثجحخدذرزسشصضطظعغفقكلمنهوىيًٌٍَُِّْٰ]+$/,
		he: /^[א-ת]+$/,
		fa: /^['آاءأؤئبپتثجچحخدذرزژسشصضطظعغفقکگلمنوهةی']+$/i,
		bn: /^['ঀঁংঃঅআইঈউঊঋঌএঐওঔকখগঘঙচছজঝঞটঠডঢণতথদধনপফবভমযরলশষসহ়ঽািীুূৃৄেৈোৌ্ৎৗড়ঢ়য়ৠৡৢৣৰৱ৲৳৴৵৶৷৸৹৺৻']+$/,
		eo: /^[ABCĈD-GĜHĤIJĴK-PRSŜTUŬVZ]+$/i,
		"hi-IN": /^[\u0900-\u0961]+[\u0972-\u097F]*$/i,
		"si-LK": /^[\u0D80-\u0DFF]+$/,
		"ta-IN": /^[\u0B80-\u0BFF]+$/i,
		"te-IN": /^[\u0C00-\u0C7F]+$/i,
		"kn-IN": /^[\u0C80-\u0CFF]+$/i,
		"ml-IN": /^[\u0D00-\u0D7F]+$/i,
		"gu-IN": /^[\u0A80-\u0AFF]+$/i,
		"pa-IN": /^[\u0A00-\u0A7F]+$/i,
		"or-IN": /^[\u0B00-\u0B7F]+$/i
	};
	var alphanumeric = exports.alphanumeric = {
		"en-US": /^[0-9A-Z]+$/i,
		"az-AZ": /^[0-9A-VXYZÇƏĞİıÖŞÜ]+$/i,
		"bg-BG": /^[0-9А-Я]+$/i,
		"cs-CZ": /^[0-9A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]+$/i,
		"da-DK": /^[0-9A-ZÆØÅ]+$/i,
		"de-DE": /^[0-9A-ZÄÖÜß]+$/i,
		"el-GR": /^[0-9Α-ω]+$/i,
		"es-ES": /^[0-9A-ZÁÉÍÑÓÚÜ]+$/i,
		"fi-FI": /^[0-9A-ZÅÄÖ]+$/i,
		"fr-FR": /^[0-9A-ZÀÂÆÇÉÈÊËÏÎÔŒÙÛÜŸ]+$/i,
		"it-IT": /^[0-9A-ZÀÉÈÌÎÓÒÙ]+$/i,
		"ja-JP": /^[0-9０-９ぁ-んァ-ヶｦ-ﾟ一-龠ー・。、]+$/i,
		"hu-HU": /^[0-9A-ZÁÉÍÓÖŐÚÜŰ]+$/i,
		"nb-NO": /^[0-9A-ZÆØÅ]+$/i,
		"nl-NL": /^[0-9A-ZÁÉËÏÓÖÜÚ]+$/i,
		"nn-NO": /^[0-9A-ZÆØÅ]+$/i,
		"pl-PL": /^[0-9A-ZĄĆĘŚŁŃÓŻŹ]+$/i,
		"pt-PT": /^[0-9A-ZÃÁÀÂÄÇÉÊËÍÏÕÓÔÖÚÜ]+$/i,
		"ru-RU": /^[0-9А-ЯЁ]+$/i,
		"kk-KZ": /^[0-9А-ЯЁ\u04D8\u04B0\u0406\u04A2\u0492\u04AE\u049A\u04E8\u04BA]+$/i,
		"sl-SI": /^[0-9A-ZČĆĐŠŽ]+$/i,
		"sk-SK": /^[0-9A-ZÁČĎÉÍŇÓŠŤÚÝŽĹŔĽÄÔ]+$/i,
		"sr-RS@latin": /^[0-9A-ZČĆŽŠĐ]+$/i,
		"sr-RS": /^[0-9А-ЯЂЈЉЊЋЏ]+$/i,
		"sv-SE": /^[0-9A-ZÅÄÖ]+$/i,
		"th-TH": /^[ก-๙\s]+$/i,
		"tr-TR": /^[0-9A-ZÇĞİıÖŞÜ]+$/i,
		"uk-UA": /^[0-9А-ЩЬЮЯЄIЇҐі]+$/i,
		"ko-KR": /^[0-9ㄱ-ㅎㅏ-ㅣ가-힣]*$/,
		"ku-IQ": /^[٠١٢٣٤٥٦٧٨٩0-9ئابپتجچحخدرڕزژسشعغفڤقکگلڵمنوۆھەیێيطؤثآإأكضصةظذ]+$/i,
		"vi-VN": /^[0-9A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴĐÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸ]+$/i,
		ar: /^[٠١٢٣٤٥٦٧٨٩0-9ءآأؤإئابةتثجحخدذرزسشصضطظعغفقكلمنهوىيًٌٍَُِّْٰ]+$/,
		he: /^[0-9א-ת]+$/,
		fa: /^['0-9آاءأؤئبپتثجچحخدذرزژسشصضطظعغفقکگلمنوهةی۱۲۳۴۵۶۷۸۹۰']+$/i,
		bn: /^['ঀঁংঃঅআইঈউঊঋঌএঐওঔকখগঘঙচছজঝঞটঠডঢণতথদধনপফবভমযরলশষসহ়ঽািীুূৃৄেৈোৌ্ৎৗড়ঢ়য়ৠৡৢৣ০১২৩৪৫৬৭৮৯ৰৱ৲৳৴৵৶৷৸৹৺৻']+$/,
		eo: /^[0-9ABCĈD-GĜHĤIJĴK-PRSŜTUŬVZ]+$/i,
		"hi-IN": /^[\u0900-\u0963]+[\u0966-\u097F]*$/i,
		"si-LK": /^[0-9\u0D80-\u0DFF]+$/,
		"ta-IN": /^[0-9\u0B80-\u0BFF.]+$/i,
		"te-IN": /^[0-9\u0C00-\u0C7F.]+$/i,
		"kn-IN": /^[0-9\u0C80-\u0CFF.]+$/i,
		"ml-IN": /^[0-9\u0D00-\u0D7F.]+$/i,
		"gu-IN": /^[0-9\u0A80-\u0AFF.]+$/i,
		"pa-IN": /^[0-9\u0A00-\u0A7F.]+$/i,
		"or-IN": /^[0-9\u0B00-\u0B7F.]+$/i
	};
	var decimal = exports.decimal = {
		"en-US": ".",
		ar: "٫"
	};
	var englishLocales = exports.englishLocales = [
		"AU",
		"GB",
		"HK",
		"IN",
		"NZ",
		"ZA",
		"ZM"
	];
	for (var locale, i = 0; i < englishLocales.length; i++) {
		locale = "en-".concat(englishLocales[i]);
		alpha[locale] = alpha["en-US"];
		alphanumeric[locale] = alphanumeric["en-US"];
		decimal[locale] = decimal["en-US"];
	}
	var arabicLocales = exports.arabicLocales = [
		"AE",
		"BH",
		"DZ",
		"EG",
		"IQ",
		"JO",
		"KW",
		"LB",
		"LY",
		"MA",
		"QM",
		"QA",
		"SA",
		"SD",
		"SY",
		"TN",
		"YE"
	];
	for (var _locale, _i = 0; _i < arabicLocales.length; _i++) {
		_locale = "ar-".concat(arabicLocales[_i]);
		alpha[_locale] = alpha.ar;
		alphanumeric[_locale] = alphanumeric.ar;
		decimal[_locale] = decimal.ar;
	}
	var farsiLocales = exports.farsiLocales = ["IR", "AF"];
	for (var _locale2, _i2 = 0; _i2 < farsiLocales.length; _i2++) {
		_locale2 = "fa-".concat(farsiLocales[_i2]);
		alphanumeric[_locale2] = alphanumeric.fa;
		decimal[_locale2] = decimal.ar;
	}
	var bengaliLocales = exports.bengaliLocales = ["BD", "IN"];
	for (var _locale3, _i3 = 0; _i3 < bengaliLocales.length; _i3++) {
		_locale3 = "bn-".concat(bengaliLocales[_i3]);
		alpha[_locale3] = alpha.bn;
		alphanumeric[_locale3] = alphanumeric.bn;
		decimal[_locale3] = decimal["en-US"];
	}
	var dotDecimal = exports.dotDecimal = [
		"ar-EG",
		"ar-LB",
		"ar-LY"
	];
	var commaDecimal = exports.commaDecimal = [
		"bg-BG",
		"cs-CZ",
		"da-DK",
		"de-DE",
		"el-GR",
		"en-ZM",
		"eo",
		"es-ES",
		"fr-CA",
		"fr-FR",
		"gu-IN",
		"hi-IN",
		"hu-HU",
		"id-ID",
		"it-IT",
		"kk-KZ",
		"kn-IN",
		"ku-IQ",
		"ml-IN",
		"nb-NO",
		"nl-NL",
		"nn-NO",
		"or-IN",
		"pa-IN",
		"pl-PL",
		"pt-PT",
		"ru-RU",
		"si-LK",
		"sl-SI",
		"sr-RS",
		"sr-RS@latin",
		"sv-SE",
		"ta-IN",
		"te-IN",
		"tr-TR",
		"uk-UA",
		"vi-VN"
	];
	for (var _i4 = 0; _i4 < dotDecimal.length; _i4++) decimal[dotDecimal[_i4]] = decimal["en-US"];
	for (var _i5 = 0; _i5 < commaDecimal.length; _i5++) decimal[commaDecimal[_i5]] = ",";
	alpha["fr-CA"] = alpha["fr-FR"];
	alphanumeric["fr-CA"] = alphanumeric["fr-FR"];
	alpha["pt-BR"] = alpha["pt-PT"];
	alphanumeric["pt-BR"] = alphanumeric["pt-PT"];
	decimal["pt-BR"] = decimal["pt-PT"];
	alpha["pl-Pl"] = alpha["pl-PL"];
	alphanumeric["pl-Pl"] = alphanumeric["pl-PL"];
	decimal["pl-Pl"] = decimal["pl-PL"];
	alpha["fa-AF"] = alpha.fa;
}));
// node_modules/validator/lib/isFloat.js
var require_isFloat = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = isFloat;
	exports.locales = void 0;
	var _assertString = _interopRequireDefault(require_assertString());
	var _nullUndefinedCheck = _interopRequireDefault(require_nullUndefinedCheck());
	var _alpha = require_alpha();
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	function isFloat(str, options) {
		(0, _assertString.default)(str);
		options = options || {};
		var float = new RegExp("^(?:[-+])?(?:[0-9]+)?(?:\\".concat(options.locale ? _alpha.decimal[options.locale] : ".", "[0-9]*)?(?:[eE][\\+\\-]?(?:[0-9]+))?$"));
		if (str === "" || str === "." || str === "," || str === "-" || str === "+") return false;
		var value = parseFloat(str.replace(",", "."));
		return float.test(str) && (!options.hasOwnProperty("min") || (0, _nullUndefinedCheck.default)(options.min) || value >= options.min) && (!options.hasOwnProperty("max") || (0, _nullUndefinedCheck.default)(options.max) || value <= options.max) && (!options.hasOwnProperty("lt") || (0, _nullUndefinedCheck.default)(options.lt) || value < options.lt) && (!options.hasOwnProperty("gt") || (0, _nullUndefinedCheck.default)(options.gt) || value > options.gt);
	}
	exports.locales = Object.keys(_alpha.decimal);
}));
// node_modules/validator/lib/toFloat.js
var require_toFloat = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = toFloat;
	var _isFloat = _interopRequireDefault(require_isFloat());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	function toFloat(str) {
		if (!(0, _isFloat.default)(str)) return NaN;
		return parseFloat(str);
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/toInt.js
var require_toInt = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = toInt;
	var _assertString = _interopRequireDefault(require_assertString());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	function toInt(str, radix) {
		(0, _assertString.default)(str);
		return parseInt(str, radix || 10);
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/toBoolean.js
var require_toBoolean = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = toBoolean;
	var _assertString = _interopRequireDefault(require_assertString());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	function toBoolean(str, strict) {
		(0, _assertString.default)(str);
		if (strict) return str === "1" || /^true$/i.test(str);
		return str !== "0" && !/^false$/i.test(str) && str !== "";
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/equals.js
var require_equals = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = equals;
	var _assertString = _interopRequireDefault(require_assertString());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	function equals(str, comparison) {
		(0, _assertString.default)(str);
		return str === comparison;
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/util/toString.js
var require_toString = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = toString;
	function _typeof(o) {
		"@babel/helpers - typeof";
		return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o) {
			return typeof o;
		} : function(o) {
			return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
		}, _typeof(o);
	}
	function toString(input) {
		if (_typeof(input) === "object" && input !== null) {
			if (typeof input.toString === "function") input = input.toString();
			else input = "[object Object]";
		} else if (input === null || typeof input === "undefined" || isNaN(input) && !input.length) input = "";
		return String(input);
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/util/merge.js
var require_merge = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = merge;
	function _typeof(o) {
		"@babel/helpers - typeof";
		return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o) {
			return typeof o;
		} : function(o) {
			return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
		}, _typeof(o);
	}
	function merge() {
		var obj = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
		var defaults = arguments.length > 1 ? arguments[1] : void 0;
		if (_typeof(obj) !== "object" || obj === null) obj = {};
		for (var key in defaults) if (typeof obj[key] === "undefined") obj[key] = defaults[key];
		return obj;
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/contains.js
var require_contains = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = contains;
	var _assertString = _interopRequireDefault(require_assertString());
	var _toString = _interopRequireDefault(require_toString());
	var _merge = _interopRequireDefault(require_merge());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	var defaultContainsOptions = {
		ignoreCase: false,
		minOccurrences: 1
	};
	function contains(str, elem, options) {
		(0, _assertString.default)(str);
		options = (0, _merge.default)(options, defaultContainsOptions);
		if (options.ignoreCase) return str.toLowerCase().split((0, _toString.default)(elem).toLowerCase()).length > options.minOccurrences;
		return str.split((0, _toString.default)(elem)).length > options.minOccurrences;
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/matches.js
var require_matches = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = matches;
	var _assertString = _interopRequireDefault(require_assertString());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	function matches(str, pattern, modifiers) {
		(0, _assertString.default)(str);
		if (Object.prototype.toString.call(pattern) !== "[object RegExp]") pattern = new RegExp(pattern, modifiers);
		return !!str.match(pattern);
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/util/checkHost.js
var require_checkHost = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = checkHost;
	function isRegExp(obj) {
		return Object.prototype.toString.call(obj) === "[object RegExp]";
	}
	function checkHost(host, matches) {
		for (var i = 0; i < matches.length; i++) {
			var match = matches[i];
			if (host === match || isRegExp(match) && match.test(host)) return true;
		}
		return false;
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/isByteLength.js
var require_isByteLength = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = isByteLength;
	var _assertString = _interopRequireDefault(require_assertString());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	function _typeof(o) {
		"@babel/helpers - typeof";
		return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o) {
			return typeof o;
		} : function(o) {
			return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
		}, _typeof(o);
	}
	function isByteLength(str, options) {
		(0, _assertString.default)(str);
		var min;
		var max;
		if (_typeof(options) === "object") {
			min = options.min || 0;
			max = options.max;
		} else {
			min = arguments[1];
			max = arguments[2];
		}
		var len = encodeURI(str).split(/%..|./).length - 1;
		return len >= min && (typeof max === "undefined" || len <= max);
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/isFQDN.js
var require_isFQDN = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = isFQDN;
	var _assertString = _interopRequireDefault(require_assertString());
	var _merge = _interopRequireDefault(require_merge());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	var default_fqdn_options = {
		require_tld: true,
		allow_underscores: false,
		allow_trailing_dot: false,
		allow_numeric_tld: false,
		allow_wildcard: false,
		ignore_max_length: false
	};
	function isFQDN(str, options) {
		(0, _assertString.default)(str);
		options = (0, _merge.default)(options, default_fqdn_options);
		if (options.allow_trailing_dot && str[str.length - 1] === ".") str = str.substring(0, str.length - 1);
		if (options.allow_wildcard === true && str.indexOf("*.") === 0) str = str.substring(2);
		var parts = str.split(".");
		var tld = parts[parts.length - 1];
		if (options.require_tld) {
			if (parts.length < 2) return false;
			if (!options.allow_numeric_tld && !/^([a-z\u00A1-\u00A8\u00AA-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]{2,}|xn[a-z0-9-]{2,})$/i.test(tld)) return false;
			if (/\s/.test(tld)) return false;
		}
		if (!options.allow_numeric_tld && /^\d+$/.test(tld)) return false;
		return parts.every(function(part) {
			if (part.length > 63 && !options.ignore_max_length) return false;
			if (!/^[a-z_\u00a1-\uffff0-9-]+$/i.test(part)) return false;
			if (/[\uff01-\uff5e]/.test(part)) return false;
			if (/^-|-$/.test(part)) return false;
			if (!options.allow_underscores && /_/.test(part)) return false;
			return true;
		});
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/isIP.js
var require_isIP = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = isIP;
	var _assertString = _interopRequireDefault(require_assertString());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	function _typeof(o) {
		"@babel/helpers - typeof";
		return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o) {
			return typeof o;
		} : function(o) {
			return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
		}, _typeof(o);
	}
	/**
	11.3.  Examples
	
	The following addresses
	
	fe80::1234 (on the 1st link of the node)
	ff02::5678 (on the 5th link of the node)
	ff08::9abc (on the 10th organization of the node)
	
	would be represented as follows:
	
	fe80::1234%1
	ff02::5678%5
	ff08::9abc%10
	
	(Here we assume a natural translation from a zone index to the
	<zone_id> part, where the Nth zone of any scope is translated into
	"N".)
	
	If we use interface names as <zone_id>, those addresses could also be
	represented as follows:
	
	fe80::1234%ne0
	ff02::5678%pvc1.3
	ff08::9abc%interface10
	
	where the interface "ne0" belongs to the 1st link, "pvc1.3" belongs
	to the 5th link, and "interface10" belongs to the 10th organization.
	* * */
	var IPv4SegmentFormat = "(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])";
	var IPv4AddressFormat = "(".concat(IPv4SegmentFormat, "[.]){3}").concat(IPv4SegmentFormat);
	var IPv4AddressRegExp = new RegExp("^".concat(IPv4AddressFormat, "$"));
	var IPv6SegmentFormat = "(?:[0-9a-fA-F]{1,4})";
	var IPv6AddressRegExp = new RegExp("^(" + "(?:".concat(IPv6SegmentFormat, ":){7}(?:").concat(IPv6SegmentFormat, "|:)|") + "(?:".concat(IPv6SegmentFormat, ":){6}(?:").concat(IPv4AddressFormat, "|:").concat(IPv6SegmentFormat, "|:)|") + "(?:".concat(IPv6SegmentFormat, ":){5}(?::").concat(IPv4AddressFormat, "|(:").concat(IPv6SegmentFormat, "){1,2}|:)|") + "(?:".concat(IPv6SegmentFormat, ":){4}(?:(:").concat(IPv6SegmentFormat, "){0,1}:").concat(IPv4AddressFormat, "|(:").concat(IPv6SegmentFormat, "){1,3}|:)|") + "(?:".concat(IPv6SegmentFormat, ":){3}(?:(:").concat(IPv6SegmentFormat, "){0,2}:").concat(IPv4AddressFormat, "|(:").concat(IPv6SegmentFormat, "){1,4}|:)|") + "(?:".concat(IPv6SegmentFormat, ":){2}(?:(:").concat(IPv6SegmentFormat, "){0,3}:").concat(IPv4AddressFormat, "|(:").concat(IPv6SegmentFormat, "){1,5}|:)|") + "(?:".concat(IPv6SegmentFormat, ":){1}(?:(:").concat(IPv6SegmentFormat, "){0,4}:").concat(IPv4AddressFormat, "|(:").concat(IPv6SegmentFormat, "){1,6}|:)|") + "(?::((?::".concat(IPv6SegmentFormat, "){0,5}:").concat(IPv4AddressFormat, "|(?::").concat(IPv6SegmentFormat, "){1,7}|:))") + ")(%[0-9a-zA-Z.]{1,})?$");
	function isIP(ipAddress) {
		var options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
		(0, _assertString.default)(ipAddress);
		var version = (_typeof(options) === "object" ? options.version : arguments[1]) || "";
		if (!version) return isIP(ipAddress, { version: 4 }) || isIP(ipAddress, { version: 6 });
		if (version.toString() === "4") return IPv4AddressRegExp.test(ipAddress);
		if (version.toString() === "6") return IPv6AddressRegExp.test(ipAddress);
		return false;
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/isEmail.js
var require_isEmail = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = isEmail;
	var _assertString = _interopRequireDefault(require_assertString());
	var _checkHost = _interopRequireDefault(require_checkHost());
	var _isByteLength = _interopRequireDefault(require_isByteLength());
	var _isFQDN = _interopRequireDefault(require_isFQDN());
	var _isIP = _interopRequireDefault(require_isIP());
	var _merge = _interopRequireDefault(require_merge());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	var default_email_options = {
		allow_display_name: false,
		allow_underscores: false,
		require_display_name: false,
		allow_utf8_local_part: true,
		require_tld: true,
		blacklisted_chars: "",
		ignore_max_length: false,
		host_blacklist: [],
		host_whitelist: []
	};
	var splitNameAddress = /^([^\x00-\x1F\x7F-\x9F\cX]+)</i;
	var emailUserPart = /^[a-z\d!#\$%&'\*\+\-\/=\?\^_`{\|}~]+$/i;
	var gmailUserPart = /^[a-z\d]+$/;
	var quotedEmailUser = /^([\s\x01-\x08\x0b\x0c\x0e-\x1f\x7f\x21\x23-\x5b\x5d-\x7e]|(\\[\x01-\x09\x0b\x0c\x0d-\x7f]))*$/i;
	var emailUserUtf8Part = /^[a-z\d!#\$%&'\*\+\-\/=\?\^_`{\|}~\u00A1-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+$/i;
	var quotedEmailUserUtf8 = /^([\s\x01-\x08\x0b\x0c\x0e-\x1f\x7f\x21\x23-\x5b\x5d-\x7e\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|(\\[\x01-\x09\x0b\x0c\x0d-\x7f\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))*$/i;
	var defaultMaxEmailLength = 254;
	/**
	* Validate display name according to the RFC2822: https://tools.ietf.org/html/rfc2822#appendix-A.1.2
	* @param {String} display_name
	*/
	function validateDisplayName(display_name) {
		var display_name_without_quotes = display_name.replace(/^"(.+)"$/, "$1");
		if (!display_name_without_quotes.trim()) return false;
		if (/[\.";<>]/.test(display_name_without_quotes)) {
			if (display_name_without_quotes === display_name) return false;
			if (!(display_name_without_quotes.split("\"").length === display_name_without_quotes.split("\\\"").length)) return false;
		}
		return true;
	}
	function isEmail(str, options) {
		(0, _assertString.default)(str);
		options = (0, _merge.default)(options, default_email_options);
		if (options.require_display_name || options.allow_display_name) {
			var display_email = str.match(splitNameAddress);
			if (display_email) {
				var display_name = display_email[1];
				str = str.replace(display_name, "").replace(/(^<|>$)/g, "");
				if (display_name.endsWith(" ")) display_name = display_name.slice(0, -1);
				if (!validateDisplayName(display_name)) return false;
			} else if (options.require_display_name) return false;
		}
		if (!options.ignore_max_length && str.length > defaultMaxEmailLength) return false;
		var parts = str.split("@");
		var domain = parts.pop();
		var lower_domain = domain.toLowerCase();
		if (options.host_blacklist.length > 0 && (0, _checkHost.default)(lower_domain, options.host_blacklist)) return false;
		if (options.host_whitelist.length > 0 && !(0, _checkHost.default)(lower_domain, options.host_whitelist)) return false;
		var user = parts.join("@");
		if (options.domain_specific_validation && (lower_domain === "gmail.com" || lower_domain === "googlemail.com")) {
			user = user.toLowerCase();
			var username = user.split("+")[0];
			if (!(0, _isByteLength.default)(username.replace(/\./g, ""), {
				min: 6,
				max: 30
			})) return false;
			var _user_parts = username.split(".");
			for (var i = 0; i < _user_parts.length; i++) if (!gmailUserPart.test(_user_parts[i])) return false;
		}
		if (options.ignore_max_length === false && (!(0, _isByteLength.default)(user, { max: 64 }) || !(0, _isByteLength.default)(domain, { max: 254 }))) return false;
		if (!(0, _isFQDN.default)(domain, {
			require_tld: options.require_tld,
			ignore_max_length: options.ignore_max_length,
			allow_underscores: options.allow_underscores
		})) {
			if (!options.allow_ip_domain) return false;
			if (!(0, _isIP.default)(domain)) {
				if (!domain.startsWith("[") || !domain.endsWith("]")) return false;
				var noBracketdomain = domain.slice(1, -1);
				if (noBracketdomain.length === 0 || !(0, _isIP.default)(noBracketdomain)) return false;
			}
		}
		if (options.blacklisted_chars) {
			if (user.search(new RegExp("[".concat(options.blacklisted_chars, "]+"), "g")) !== -1) return false;
		}
		if (user[0] === "\"" && user[user.length - 1] === "\"") {
			user = user.slice(1, user.length - 1);
			return options.allow_utf8_local_part ? quotedEmailUserUtf8.test(user) : quotedEmailUser.test(user);
		}
		var pattern = options.allow_utf8_local_part ? emailUserUtf8Part : emailUserPart;
		var user_parts = user.split(".");
		for (var _i = 0; _i < user_parts.length; _i++) if (!pattern.test(user_parts[_i])) return false;
		return true;
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/util/includesString.js
var require_includesString = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = void 0;
	exports.default = function includes(str, val) {
		return str.indexOf(val) !== -1;
	};
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/isURL.js
var require_isURL = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = isURL;
	var _assertString = _interopRequireDefault(require_assertString());
	var _checkHost = _interopRequireDefault(require_checkHost());
	var _includesString = _interopRequireDefault(require_includesString());
	var _isFQDN = _interopRequireDefault(require_isFQDN());
	var _isIP = _interopRequireDefault(require_isIP());
	var _merge = _interopRequireDefault(require_merge());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	function _slicedToArray(r, e) {
		return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest();
	}
	function _nonIterableRest() {
		throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
	}
	function _unsupportedIterableToArray(r, a) {
		if (r) {
			if ("string" == typeof r) return _arrayLikeToArray(r, a);
			var t = {}.toString.call(r).slice(8, -1);
			return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0;
		}
	}
	function _arrayLikeToArray(r, a) {
		(null == a || a > r.length) && (a = r.length);
		for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
		return n;
	}
	function _iterableToArrayLimit(r, l) {
		var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
		if (null != t) {
			var e, n, i, u, a = [], f = !0, o = !1;
			try {
				if (i = (t = t.call(r)).next, 0 === l) {
					if (Object(t) !== t) return;
					f = !1;
				} else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0);
			} catch (r) {
				o = !0, n = r;
			} finally {
				try {
					if (!f && null != t.return && (u = t.return(), Object(u) !== u)) return;
				} finally {
					if (o) throw n;
				}
			}
			return a;
		}
	}
	function _arrayWithHoles(r) {
		if (Array.isArray(r)) return r;
	}
	var default_url_options = {
		protocols: [
			"http",
			"https",
			"ftp"
		],
		require_tld: true,
		require_protocol: false,
		require_host: true,
		require_port: false,
		require_valid_protocol: true,
		allow_underscores: false,
		allow_trailing_dot: false,
		allow_protocol_relative_urls: false,
		allow_fragments: true,
		allow_query_components: true,
		validate_length: true,
		max_allowed_length: 2084
	};
	var wrapped_ipv6 = /^\[([^\]]+)\](?::([0-9]+))?$/;
	function isURL(url, options) {
		(0, _assertString.default)(url);
		if (!url || /[\s<>]/.test(url)) return false;
		if (url.indexOf("mailto:") === 0) return false;
		options = (0, _merge.default)(options, default_url_options);
		if (options.validate_length && url.length > options.max_allowed_length) return false;
		if (!options.allow_fragments && (0, _includesString.default)(url, "#")) return false;
		if (!options.allow_query_components && ((0, _includesString.default)(url, "?") || (0, _includesString.default)(url, "&"))) return false;
		var protocol, auth, host, hostname, port, port_str, split = url.split("#"), ipv6;
		url = split.shift();
		split = url.split("?");
		url = split.shift();
		var protocol_match = url.match(/^([a-z][a-z0-9+\-.]*):/i);
		var had_explicit_protocol = false;
		var cleanUpProtocol = function cleanUpProtocol(potential_protocol) {
			had_explicit_protocol = true;
			protocol = potential_protocol.toLowerCase();
			if (options.require_valid_protocol && options.protocols.indexOf(protocol) === -1) return false;
			return url.substring(protocol_match[0].length);
		};
		if (protocol_match) {
			var potential_protocol = protocol_match[1];
			var after_colon = url.substring(protocol_match[0].length);
			if (!(after_colon.slice(0, 2) === "//")) {
				var first_slash_position = after_colon.indexOf("/");
				var before_slash = first_slash_position === -1 ? after_colon : after_colon.substring(0, first_slash_position);
				var at_position = before_slash.indexOf("@");
				if (at_position !== -1) {
					var before_at = before_slash.substring(0, at_position);
					var is_valid_auth = /^[a-zA-Z0-9\-_.%:]*$/.test(before_at);
					var has_encoded_content = /%[0-9a-fA-F]{2}/.test(before_at);
					if (is_valid_auth && !has_encoded_content) {
						if (options.require_protocol) return false;
					} else {
						url = cleanUpProtocol(potential_protocol);
						if (url === false) return false;
					}
				} else if (/^[0-9]/.test(after_colon)) {
					if (options.require_protocol) return false;
				} else {
					url = cleanUpProtocol(potential_protocol);
					if (url === false) return false;
				}
			} else {
				url = cleanUpProtocol(potential_protocol);
				if (url === false) return false;
			}
		} else if (options.require_protocol) return false;
		if (url.slice(0, 2) === "//") {
			if (!had_explicit_protocol && !options.allow_protocol_relative_urls) return false;
			url = url.slice(2);
		}
		if (url === "") return false;
		split = url.split("/");
		url = split.shift();
		if (url === "" && !options.require_host) return true;
		split = url.split("@");
		if (split.length > 1) {
			if (options.disallow_auth) return false;
			if (split[0] === "") return false;
			auth = split.shift();
			if (auth.indexOf(":") >= 0 && auth.split(":").length > 2) return false;
			var _auth$split2 = _slicedToArray(auth.split(":"), 2), user = _auth$split2[0], password = _auth$split2[1];
			if (user === "" && password === "") return false;
		}
		hostname = split.join("@");
		port_str = null;
		ipv6 = null;
		var ipv6_match = hostname.match(wrapped_ipv6);
		if (ipv6_match) {
			host = "";
			ipv6 = ipv6_match[1];
			port_str = ipv6_match[2] || null;
		} else {
			split = hostname.split(":");
			host = split.shift();
			if (split.length) port_str = split.join(":");
		}
		if (port_str !== null && port_str.length > 0) {
			port = parseInt(port_str, 10);
			if (!/^[0-9]+$/.test(port_str) || port <= 0 || port > 65535) return false;
		} else if (options.require_port) return false;
		if (options.host_whitelist) return (0, _checkHost.default)(host, options.host_whitelist);
		if (host === "" && !options.require_host) return true;
		if (!(0, _isIP.default)(host) && !(0, _isFQDN.default)(host, options) && (!ipv6 || !(0, _isIP.default)(ipv6, 6))) return false;
		host = host || ipv6;
		if (options.host_blacklist && (0, _checkHost.default)(host, options.host_blacklist)) return false;
		return true;
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/isMACAddress.js
var require_isMACAddress = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = isMACAddress;
	var _assertString = _interopRequireDefault(require_assertString());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	var macAddress48 = /^(?:[0-9a-fA-F]{2}([-:\s]))([0-9a-fA-F]{2}\1){4}([0-9a-fA-F]{2})$/;
	var macAddress48NoSeparators = /^([0-9a-fA-F]){12}$/;
	var macAddress48WithDots = /^([0-9a-fA-F]{4}\.){2}([0-9a-fA-F]{4})$/;
	var macAddress64 = /^(?:[0-9a-fA-F]{2}([-:\s]))([0-9a-fA-F]{2}\1){6}([0-9a-fA-F]{2})$/;
	var macAddress64NoSeparators = /^([0-9a-fA-F]){16}$/;
	var macAddress64WithDots = /^([0-9a-fA-F]{4}\.){3}([0-9a-fA-F]{4})$/;
	function isMACAddress(str, options) {
		(0, _assertString.default)(str);
		if (options !== null && options !== void 0 && options.eui) options.eui = String(options.eui);
		/**
		* @deprecated `no_colons` TODO: remove it in the next major
		*/
		if (options !== null && options !== void 0 && options.no_colons || options !== null && options !== void 0 && options.no_separators) {
			if (options.eui === "48") return macAddress48NoSeparators.test(str);
			if (options.eui === "64") return macAddress64NoSeparators.test(str);
			return macAddress48NoSeparators.test(str) || macAddress64NoSeparators.test(str);
		}
		if ((options === null || options === void 0 ? void 0 : options.eui) === "48") return macAddress48.test(str) || macAddress48WithDots.test(str);
		if ((options === null || options === void 0 ? void 0 : options.eui) === "64") return macAddress64.test(str) || macAddress64WithDots.test(str);
		return isMACAddress(str, { eui: "48" }) || isMACAddress(str, { eui: "64" });
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/isIPRange.js
var require_isIPRange = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = isIPRange;
	var _assertString = _interopRequireDefault(require_assertString());
	var _isIP = _interopRequireDefault(require_isIP());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	var subnetMaybe = /^\d{1,3}$/;
	var v4Subnet = 32;
	var v6Subnet = 128;
	function isIPRange(str) {
		var version = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "";
		(0, _assertString.default)(str);
		var parts = str.split("/");
		if (parts.length !== 2) return false;
		if (!subnetMaybe.test(parts[1])) return false;
		if (parts[1].length > 1 && parts[1].startsWith("0")) return false;
		if (!(0, _isIP.default)(parts[0], version)) return false;
		var expectedSubnet = null;
		switch (String(version)) {
			case "4":
				expectedSubnet = v4Subnet;
				break;
			case "6":
				expectedSubnet = v6Subnet;
				break;
			default: expectedSubnet = (0, _isIP.default)(parts[0], "6") ? v6Subnet : v4Subnet;
		}
		return parts[1] <= expectedSubnet && parts[1] >= 0;
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/isDate.js
var require_isDate = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = isDate;
	var _merge = _interopRequireDefault(require_merge());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	function _slicedToArray(r, e) {
		return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest();
	}
	function _nonIterableRest() {
		throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
	}
	function _iterableToArrayLimit(r, l) {
		var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
		if (null != t) {
			var e, n, i, u, a = [], f = !0, o = !1;
			try {
				if (i = (t = t.call(r)).next, 0 === l) {
					if (Object(t) !== t) return;
					f = !1;
				} else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0);
			} catch (r) {
				o = !0, n = r;
			} finally {
				try {
					if (!f && null != t.return && (u = t.return(), Object(u) !== u)) return;
				} finally {
					if (o) throw n;
				}
			}
			return a;
		}
	}
	function _arrayWithHoles(r) {
		if (Array.isArray(r)) return r;
	}
	function _createForOfIteratorHelper(r, e) {
		var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
		if (!t) {
			if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) {
				t && (r = t);
				var _n = 0, F = function F() {};
				return {
					s: F,
					n: function n() {
						return _n >= r.length ? { done: !0 } : {
							done: !1,
							value: r[_n++]
						};
					},
					e: function e(r) {
						throw r;
					},
					f: F
				};
			}
			throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
		}
		var o, a = !0, u = !1;
		return {
			s: function s() {
				t = t.call(r);
			},
			n: function n() {
				var r = t.next();
				return a = r.done, r;
			},
			e: function e(r) {
				u = !0, o = r;
			},
			f: function f() {
				try {
					a || null == t.return || t.return();
				} finally {
					if (u) throw o;
				}
			}
		};
	}
	function _unsupportedIterableToArray(r, a) {
		if (r) {
			if ("string" == typeof r) return _arrayLikeToArray(r, a);
			var t = {}.toString.call(r).slice(8, -1);
			return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0;
		}
	}
	function _arrayLikeToArray(r, a) {
		(null == a || a > r.length) && (a = r.length);
		for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
		return n;
	}
	var default_date_options = {
		format: "YYYY/MM/DD",
		delimiters: ["/", "-"],
		strictMode: false
	};
	function isValidFormat(format) {
		return /(^(y{4}|y{2})[.\/-](m{1,2})[.\/-](d{1,2})$)|(^(m{1,2})[.\/-](d{1,2})[.\/-]((y{4}|y{2})$))|(^(d{1,2})[.\/-](m{1,2})[.\/-]((y{4}|y{2})$))/gi.test(format);
	}
	function zip(date, format) {
		var zippedArr = [], len = Math.max(date.length, format.length);
		for (var i = 0; i < len; i++) zippedArr.push([date[i], format[i]]);
		return zippedArr;
	}
	function isDate(input, options) {
		if (typeof options === "string") options = (0, _merge.default)({ format: options }, default_date_options);
		else options = (0, _merge.default)(options, default_date_options);
		if (typeof input === "string" && isValidFormat(options.format)) {
			if (options.strictMode && input.length !== options.format.length) return false;
			var formatDelimiter = options.delimiters.find(function(delimiter) {
				return options.format.indexOf(delimiter) !== -1;
			});
			var dateDelimiter = options.strictMode ? formatDelimiter : options.delimiters.find(function(delimiter) {
				return input.indexOf(delimiter) !== -1;
			});
			var dateAndFormat = zip(input.split(dateDelimiter), options.format.toLowerCase().split(formatDelimiter));
			var dateObj = {};
			var _iterator = _createForOfIteratorHelper(dateAndFormat), _step;
			try {
				for (_iterator.s(); !(_step = _iterator.n()).done;) {
					var _step$value = _slicedToArray(_step.value, 2), dateWord = _step$value[0], formatWord = _step$value[1];
					if (!dateWord || !formatWord || dateWord.length !== formatWord.length) return false;
					dateObj[formatWord.charAt(0)] = dateWord;
				}
			} catch (err) {
				_iterator.e(err);
			} finally {
				_iterator.f();
			}
			var fullYear = dateObj.y;
			if (fullYear.startsWith("-")) return false;
			if (dateObj.y.length === 2) {
				var parsedYear = parseInt(dateObj.y, 10);
				if (isNaN(parsedYear)) return false;
				if (parsedYear < (/* @__PURE__ */ new Date()).getFullYear() % 100) fullYear = "20".concat(dateObj.y);
				else fullYear = "19".concat(dateObj.y);
			}
			var month = dateObj.m;
			if (dateObj.m.length === 1) month = "0".concat(dateObj.m);
			var day = dateObj.d;
			if (dateObj.d.length === 1) day = "0".concat(dateObj.d);
			return new Date("".concat(fullYear, "-").concat(month, "-").concat(day, "T00:00:00.000Z")).getUTCDate() === +dateObj.d;
		}
		if (!options.strictMode) return Object.prototype.toString.call(input) === "[object Date]" && isFinite(input);
		return false;
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/isTime.js
var require_isTime = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = isTime;
	var _merge = _interopRequireDefault(require_merge());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	var default_time_options = {
		hourFormat: "hour24",
		mode: "default"
	};
	var formats = {
		hour24: {
			default: /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/,
			withSeconds: /^([01]?[0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])$/,
			withOptionalSeconds: /^([01]?[0-9]|2[0-3]):([0-5][0-9])(?::([0-5][0-9]))?$/
		},
		hour12: {
			default: /^(0?[1-9]|1[0-2]):([0-5][0-9]) (A|P)M$/,
			withSeconds: /^(0?[1-9]|1[0-2]):([0-5][0-9]):([0-5][0-9]) (A|P)M$/,
			withOptionalSeconds: /^(0?[1-9]|1[0-2]):([0-5][0-9])(?::([0-5][0-9]))? (A|P)M$/
		}
	};
	function isTime(input, options) {
		options = (0, _merge.default)(options, default_time_options);
		if (typeof input !== "string") return false;
		return formats[options.hourFormat][options.mode].test(input);
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/util/includesArray.js
var require_includesArray = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = void 0;
	exports.default = function includes(arr, val) {
		return arr.some(function(arrVal) {
			return val === arrVal;
		});
	};
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/isBoolean.js
var require_isBoolean = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = isBoolean;
	var _assertString = _interopRequireDefault(require_assertString());
	var _includesArray = _interopRequireDefault(require_includesArray());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	var defaultOptions = { loose: false };
	var strictBooleans = [
		"true",
		"false",
		"1",
		"0"
	];
	var looseBooleans = [].concat(strictBooleans, ["yes", "no"]);
	function isBoolean(str) {
		var options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : defaultOptions;
		(0, _assertString.default)(str);
		if (options.loose) return (0, _includesArray.default)(looseBooleans, str.toLowerCase());
		return (0, _includesArray.default)(strictBooleans, str);
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/isLocale.js
var require_isLocale = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = isLocale;
	var _assertString = _interopRequireDefault(require_assertString());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	var language = "(([a-zA-Z]{2,3}(-".concat("([A-Za-z]{3}(-[A-Za-z]{3}){0,2})", ")?)|([a-zA-Z]{5,8}))");
	var script = "([A-Za-z]{4})";
	var region = "([A-Za-z]{2}|\\d{3})";
	var variant = "([A-Za-z0-9]{5,8}|(\\d[A-Z-a-z0-9]{3}))";
	var extension = "(".concat("(\\d|[A-W]|[Y-Z]|[a-w]|[y-z])", "(-[A-Za-z0-9]{2,8})+)");
	var privateuse = "(x(-[A-Za-z0-9]{1,8})+)";
	var grandfathered = "(".concat("((en-GB-oed)|(i-ami)|(i-bnn)|(i-default)|(i-enochian)|(i-hak)|(i-klingon)|(i-lux)|(i-mingo)|(i-navajo)|(i-pwn)|(i-tao)|(i-tay)|(i-tsu)|(sgn-BE-FR)|(sgn-BE-NL)|(sgn-CH-DE))", "|").concat("((art-lojban)|(cel-gaulish)|(no-bok)|(no-nyn)|(zh-guoyu)|(zh-hakka)|(zh-min)|(zh-min-nan)|(zh-xiang))", ")");
	var delimiter = "(-|_)";
	var langtag = "".concat(language, "(").concat(delimiter).concat(script, ")?(").concat(delimiter).concat(region, ")?(").concat(delimiter).concat(variant, ")*(").concat(delimiter).concat(extension, ")*(").concat(delimiter).concat(privateuse, ")?");
	var languageTagRegex = new RegExp("(^".concat(privateuse, "$)|(^").concat(grandfathered, "$)|(^").concat(langtag, "$)"));
	function isLocale(str) {
		(0, _assertString.default)(str);
		return languageTagRegex.test(str);
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/isAbaRouting.js
var require_isAbaRouting = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = isAbaRouting;
	var _assertString = _interopRequireDefault(require_assertString());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	var isRoutingReg = /^(?!(1[3-9])|(20)|(3[3-9])|(4[0-9])|(5[0-9])|(60)|(7[3-9])|(8[1-9])|(9[0-2])|(9[3-9]))[0-9]{9}$/;
	function isAbaRouting(str) {
		(0, _assertString.default)(str);
		if (!isRoutingReg.test(str)) return false;
		var checkSumVal = 0;
		for (var i = 0; i < str.length; i++) if (i % 3 === 0) checkSumVal += str[i] * 3;
		else if (i % 3 === 1) checkSumVal += str[i] * 7;
		else checkSumVal += str[i] * 1;
		return checkSumVal % 10 === 0;
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/isAlpha.js
var require_isAlpha = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = isAlpha;
	exports.locales = void 0;
	var _assertString = _interopRequireDefault(require_assertString());
	var _alpha = require_alpha();
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	function isAlpha(_str) {
		var locale = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "en-US";
		var options = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
		(0, _assertString.default)(_str);
		var str = _str;
		var ignore = options.ignore;
		if (ignore) {
			if (ignore instanceof RegExp) str = str.replace(ignore, "");
			else if (typeof ignore === "string") str = str.replace(new RegExp("[".concat(ignore.replace(/[-[\]{}()*+?.,\\^$|#\\s]/g, "\\$&"), "]"), "g"), "");
			else throw new Error("ignore should be instance of a String or RegExp");
		}
		if (locale in _alpha.alpha) return _alpha.alpha[locale].test(str);
		throw new Error("Invalid locale '".concat(locale, "'"));
	}
	exports.locales = Object.keys(_alpha.alpha);
}));
// node_modules/validator/lib/isAlphanumeric.js
var require_isAlphanumeric = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = isAlphanumeric;
	exports.locales = void 0;
	var _assertString = _interopRequireDefault(require_assertString());
	var _alpha = require_alpha();
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	function isAlphanumeric(_str) {
		var locale = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "en-US";
		var options = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
		(0, _assertString.default)(_str);
		var str = _str;
		var ignore = options.ignore;
		if (ignore) {
			if (ignore instanceof RegExp) str = str.replace(ignore, "");
			else if (typeof ignore === "string") str = str.replace(new RegExp("[".concat(ignore.replace(/[-[\]{}()*+?.,\\^$|#\\s]/g, "\\$&"), "]"), "g"), "");
			else throw new Error("ignore should be instance of a String or RegExp");
		}
		if (locale in _alpha.alphanumeric) return _alpha.alphanumeric[locale].test(str);
		throw new Error("Invalid locale '".concat(locale, "'"));
	}
	exports.locales = Object.keys(_alpha.alphanumeric);
}));
// node_modules/validator/lib/isNumeric.js
var require_isNumeric = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = isNumeric;
	var _assertString = _interopRequireDefault(require_assertString());
	var _alpha = require_alpha();
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	var numericNoSymbols = /^[0-9]+$/;
	function isNumeric(str, options) {
		(0, _assertString.default)(str);
		if (options && options.no_symbols) return numericNoSymbols.test(str);
		return new RegExp("^[+-]?([0-9]*[".concat((options || {}).locale ? _alpha.decimal[options.locale] : ".", "])?[0-9]+$")).test(str);
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/isPassportNumber.js
var require_isPassportNumber = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = isPassportNumber;
	exports.locales = void 0;
	var _assertString = _interopRequireDefault(require_assertString());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	/**
	* Reference:
	* https://en.wikipedia.org/ -- Wikipedia
	* https://docs.microsoft.com/en-us/microsoft-365/compliance/eu-passport-number -- EU Passport Number
	* https://countrycode.org/ -- Country Codes
	*/
	var passportRegexByCountryCode = {
		AM: /^[A-Z]{2}\d{7}$/,
		AR: /^[A-Z]{3}\d{6}$/,
		AT: /^[A-Z]\d{7}$/,
		AU: /^[A-Z]\d{7}$/,
		AZ: /^[A-Z]{1}\d{8}$/,
		BE: /^[A-Z]{2}\d{6}$/,
		BG: /^\d{9}$/,
		BR: /^[A-Z]{2}\d{6}$/,
		BY: /^[A-Z]{2}\d{7}$/,
		CA: /^[A-Z]{2}\d{6}$|^[A-Z]\d{6}[A-Z]{2}$/,
		CH: /^[A-Z]\d{7}$/,
		CN: /^G\d{8}$|^E(?![IO])[A-Z0-9]\d{7}$/,
		CY: /^[A-Z](\d{6}|\d{8})$/,
		CZ: /^\d{8}$/,
		DE: /^[CFGHJKLMNPRTVWXYZ0-9]{9}$/,
		DK: /^\d{9}$/,
		DZ: /^\d{9}$/,
		EE: /^([A-Z]\d{7}|[A-Z]{2}\d{7})$/,
		ES: /^[A-Z0-9]{2}([A-Z0-9]?)\d{6}$/,
		FI: /^[A-Z]{2}\d{7}$/,
		FR: /^\d{2}[A-Z]{2}\d{5}$/,
		GB: /^\d{9}$/,
		GR: /^[A-Z]{2}\d{7}$/,
		HR: /^\d{9}$/,
		HU: /^[A-Z]{2}(\d{6}|\d{7})$/,
		IE: /^[A-Z0-9]{2}\d{7}$/,
		IN: /^[A-Z]{1}-?\d{7}$/,
		ID: /^[A-C]\d{7}$/,
		IR: /^[A-Z]\d{8}$/,
		IS: /^(A)\d{7}$/,
		IT: /^[A-Z0-9]{2}\d{7}$/,
		JM: /^[Aa]\d{7}$/,
		JP: /^[A-Z]{2}\d{7}$/,
		KR: /^[MS]\d{8}$/,
		KZ: /^[a-zA-Z]\d{7}$/,
		LI: /^[a-zA-Z]\d{5}$/,
		LT: /^[A-Z0-9]{8}$/,
		LU: /^[A-Z0-9]{8}$/,
		LV: /^[A-Z0-9]{2}\d{7}$/,
		LY: /^[A-Z0-9]{8}$/,
		MT: /^\d{7}$/,
		MZ: /^([A-Z]{2}\d{7})|(\d{2}[A-Z]{2}\d{5})$/,
		MY: /^[AHK]\d{8}$/,
		MX: /^[A-Z]\d{8}$/,
		NL: /^[A-Z]{2}[A-Z0-9]{6}\d$/,
		NZ: /^([Ll]([Aa]|[Dd]|[Ff]|[Hh])|[Ee]([Aa]|[Pp])|[Nn])\d{6}$/,
		PH: /^([A-Z](\d{6}|\d{7}[A-Z]))|([A-Z]{2}(\d{6}|\d{7}))$/,
		PK: /^[A-Z]{2}\d{7}$/,
		PL: /^[A-Z]{2}\d{7}$/,
		PT: /^[A-Z]\d{6}$/,
		RO: /^\d{8,9}$/,
		RU: /^\d{9}$/,
		SE: /^\d{8}$/,
		SL: /^(P)[A-Z]\d{7}$/,
		SK: /^[0-9A-Z]\d{7}$/,
		TH: /^[A-Z]{1,2}\d{6,7}$/,
		TR: /^[A-Z]\d{8}$/,
		UA: /^[A-Z]{2}\d{6}$/,
		US: /^\d{9}$|^[A-Z]\d{8}$/,
		ZA: /^[TAMD]\d{8}$/
	};
	exports.locales = Object.keys(passportRegexByCountryCode);
	/**
	* Check if str is a valid passport number
	* relative to provided ISO Country Code.
	*
	* @param {string} str
	* @param {string} countryCode
	* @return {boolean}
	*/
	function isPassportNumber(str, countryCode) {
		(0, _assertString.default)(str);
		/** Remove All Whitespaces, Convert to UPPERCASE */
		var normalizedStr = str.replace(/\s/g, "").toUpperCase();
		return countryCode.toUpperCase() in passportRegexByCountryCode && passportRegexByCountryCode[countryCode].test(normalizedStr);
	}
}));
// node_modules/validator/lib/isInt.js
var require_isInt = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = isInt;
	var _assertString = _interopRequireDefault(require_assertString());
	var _nullUndefinedCheck = _interopRequireDefault(require_nullUndefinedCheck());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	var int = /^(?:[-+]?(?:0|[1-9][0-9]*))$/;
	var intLeadingZeroes = /^[-+]?[0-9]+$/;
	function isInt(str, options) {
		(0, _assertString.default)(str);
		options = options || {};
		var regex = options.allow_leading_zeroes === false ? int : intLeadingZeroes;
		var minCheckPassed = !options.hasOwnProperty("min") || (0, _nullUndefinedCheck.default)(options.min) || str >= options.min;
		var maxCheckPassed = !options.hasOwnProperty("max") || (0, _nullUndefinedCheck.default)(options.max) || str <= options.max;
		var ltCheckPassed = !options.hasOwnProperty("lt") || (0, _nullUndefinedCheck.default)(options.lt) || str < options.lt;
		var gtCheckPassed = !options.hasOwnProperty("gt") || (0, _nullUndefinedCheck.default)(options.gt) || str > options.gt;
		return regex.test(str) && minCheckPassed && maxCheckPassed && ltCheckPassed && gtCheckPassed;
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/isPort.js
var require_isPort = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = isPort;
	var _isInt = _interopRequireDefault(require_isInt());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	function isPort(str) {
		return (0, _isInt.default)(str, {
			allow_leading_zeroes: false,
			min: 0,
			max: 65535
		});
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/isLowercase.js
var require_isLowercase = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = isLowercase;
	var _assertString = _interopRequireDefault(require_assertString());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	function isLowercase(str) {
		(0, _assertString.default)(str);
		return str === str.toLowerCase();
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/isUppercase.js
var require_isUppercase = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = isUppercase;
	var _assertString = _interopRequireDefault(require_assertString());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	function isUppercase(str) {
		(0, _assertString.default)(str);
		return str === str.toUpperCase();
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/isIMEI.js
var require_isIMEI = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = isIMEI;
	var _assertString = _interopRequireDefault(require_assertString());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	var imeiRegexWithoutHyphens = /^[0-9]{15}$/;
	var imeiRegexWithHyphens = /^\d{2}-\d{6}-\d{6}-\d{1}$/;
	function isIMEI(str, options) {
		(0, _assertString.default)(str);
		options = options || {};
		var imeiRegex = imeiRegexWithoutHyphens;
		if (options.allow_hyphens) imeiRegex = imeiRegexWithHyphens;
		if (!imeiRegex.test(str)) return false;
		str = str.replace(/-/g, "");
		var sum = 0, mul = 2, l = 14;
		for (var i = 0; i < l; i++) {
			var digit = str.substring(l - i - 1, l - i);
			var tp = parseInt(digit, 10) * mul;
			if (tp >= 10) sum += tp % 10 + 1;
			else sum += tp;
			if (mul === 1) mul += 1;
			else mul -= 1;
		}
		if ((10 - sum % 10) % 10 !== parseInt(str.substring(14, 15), 10)) return false;
		return true;
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/isAscii.js
var require_isAscii = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = isAscii;
	var _assertString = _interopRequireDefault(require_assertString());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	var ascii = /^[\x00-\x7F]+$/;
	function isAscii(str) {
		(0, _assertString.default)(str);
		return ascii.test(str);
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/isFullWidth.js
var require_isFullWidth = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = isFullWidth;
	exports.fullWidth = void 0;
	var _assertString = _interopRequireDefault(require_assertString());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	var fullWidth = exports.fullWidth = /[^\u0020-\u007E\uFF61-\uFF9F\uFFA0-\uFFDC\uFFE8-\uFFEE0-9a-zA-Z]/;
	function isFullWidth(str) {
		(0, _assertString.default)(str);
		return fullWidth.test(str);
	}
}));
// node_modules/validator/lib/isHalfWidth.js
var require_isHalfWidth = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = isHalfWidth;
	exports.halfWidth = void 0;
	var _assertString = _interopRequireDefault(require_assertString());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	var halfWidth = exports.halfWidth = /[\u0020-\u007E\uFF61-\uFF9F\uFFA0-\uFFDC\uFFE8-\uFFEE0-9a-zA-Z]/;
	function isHalfWidth(str) {
		(0, _assertString.default)(str);
		return halfWidth.test(str);
	}
}));
// node_modules/validator/lib/isVariableWidth.js
var require_isVariableWidth = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = isVariableWidth;
	var _assertString = _interopRequireDefault(require_assertString());
	var _isFullWidth = require_isFullWidth();
	var _isHalfWidth = require_isHalfWidth();
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	function isVariableWidth(str) {
		(0, _assertString.default)(str);
		return _isFullWidth.fullWidth.test(str) && _isHalfWidth.halfWidth.test(str);
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/isMultibyte.js
var require_isMultibyte = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = isMultibyte;
	var _assertString = _interopRequireDefault(require_assertString());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	var multibyte = /[^\x00-\x7F]/;
	function isMultibyte(str) {
		(0, _assertString.default)(str);
		return multibyte.test(str);
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/util/multilineRegex.js
var require_multilineRegex = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = multilineRegexp;
	/**
	* Build RegExp object from an array
	* of multiple/multi-line regexp parts
	*
	* @param {string[]} parts
	* @param {string} flags
	* @return {object} - RegExp object
	*/
	function multilineRegexp(parts, flags) {
		var regexpAsStringLiteral = parts.join("");
		return new RegExp(regexpAsStringLiteral, flags);
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/isSemVer.js
var require_isSemVer = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = isSemVer;
	var _assertString = _interopRequireDefault(require_assertString());
	var _multilineRegex = _interopRequireDefault(require_multilineRegex());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	/**
	* Regular Expression to match
	* semantic versioning (SemVer)
	* built from multi-line, multi-parts regexp
	* Reference: https://semver.org/
	*/
	var semanticVersioningRegex = (0, _multilineRegex.default)([
		"^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)",
		"(?:-((?:0|[1-9]\\d*|\\d*[a-z-][0-9a-z-]*)(?:\\.(?:0|[1-9]\\d*|\\d*[a-z-][0-9a-z-]*))*))",
		"?(?:\\+([0-9a-z-]+(?:\\.[0-9a-z-]+)*))?$"
	], "i");
	function isSemVer(str) {
		(0, _assertString.default)(str);
		return semanticVersioningRegex.test(str);
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/isSurrogatePair.js
var require_isSurrogatePair = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = isSurrogatePair;
	var _assertString = _interopRequireDefault(require_assertString());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	var surrogatePair = /[\uD800-\uDBFF][\uDC00-\uDFFF]/;
	function isSurrogatePair(str) {
		(0, _assertString.default)(str);
		return surrogatePair.test(str);
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/isDecimal.js
var require_isDecimal = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = isDecimal;
	var _merge = _interopRequireDefault(require_merge());
	var _assertString = _interopRequireDefault(require_assertString());
	var _includesArray = _interopRequireDefault(require_includesArray());
	var _alpha = require_alpha();
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	function decimalRegExp(options) {
		return new RegExp("^[-+]?([0-9]+)?(\\".concat(_alpha.decimal[options.locale], "[0-9]{").concat(options.decimal_digits, "})").concat(options.force_decimal ? "" : "?", "$"));
	}
	var default_decimal_options = {
		force_decimal: false,
		decimal_digits: "1,",
		locale: "en-US"
	};
	var blacklist = [
		"",
		"-",
		"+"
	];
	function isDecimal(str, options) {
		(0, _assertString.default)(str);
		options = (0, _merge.default)(options, default_decimal_options);
		if (options.locale in _alpha.decimal) return !(0, _includesArray.default)(blacklist, str.replace(/ /g, "")) && decimalRegExp(options).test(str);
		throw new Error("Invalid locale '".concat(options.locale, "'"));
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/isHexadecimal.js
var require_isHexadecimal = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = isHexadecimal;
	var _assertString = _interopRequireDefault(require_assertString());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	var hexadecimal = /^(0x|0h)?[0-9A-F]+$/i;
	function isHexadecimal(str) {
		(0, _assertString.default)(str);
		return hexadecimal.test(str);
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/isOctal.js
var require_isOctal = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = isOctal;
	var _assertString = _interopRequireDefault(require_assertString());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	var octal = /^(0o)?[0-7]+$/i;
	function isOctal(str) {
		(0, _assertString.default)(str);
		return octal.test(str);
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/isDivisibleBy.js
var require_isDivisibleBy = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = isDivisibleBy;
	var _assertString = _interopRequireDefault(require_assertString());
	var _toFloat = _interopRequireDefault(require_toFloat());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	function isDivisibleBy(str, num) {
		(0, _assertString.default)(str);
		return (0, _toFloat.default)(str) % parseInt(num, 10) === 0;
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/isHexColor.js
var require_isHexColor = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = isHexColor;
	var _assertString = _interopRequireDefault(require_assertString());
	var _merge = _interopRequireDefault(require_merge());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	var hexcolor = /^#?([0-9A-F]{3}|[0-9A-F]{4}|[0-9A-F]{6}|[0-9A-F]{8})$/i;
	var hexcolor_with_prefix = /^#([0-9A-F]{3}|[0-9A-F]{4}|[0-9A-F]{6}|[0-9A-F]{8})$/i;
	var default_is_hexcolor_options = { require_hashtag: false };
	function isHexColor(str, options) {
		(0, _assertString.default)(str);
		options = (0, _merge.default)(options, default_is_hexcolor_options);
		return (options.require_hashtag ? hexcolor_with_prefix : hexcolor).test(str);
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/isRgbColor.js
var require_isRgbColor = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = isRgbColor;
	var _assertString = _interopRequireDefault(require_assertString());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	function _typeof(o) {
		"@babel/helpers - typeof";
		return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o) {
			return typeof o;
		} : function(o) {
			return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
		}, _typeof(o);
	}
	var rgbColor = /^rgb\((([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5]),){2}([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\)$/;
	var rgbaColor = /^rgba\((([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5]),){3}(0?\.\d\d?|1(\.0)?|0(\.0)?)\)$/;
	var rgbColorPercent = /^rgb\((([0-9]%|[1-9][0-9]%|100%),){2}([0-9]%|[1-9][0-9]%|100%)\)$/;
	var rgbaColorPercent = /^rgba\((([0-9]%|[1-9][0-9]%|100%),){3}(0?\.\d\d?|1(\.0)?|0(\.0)?)\)$/;
	var startsWithRgb = /^rgba?/;
	function isRgbColor(str, options) {
		(0, _assertString.default)(str);
		var allowSpaces = false;
		var includePercentValues = true;
		if (_typeof(options) !== "object") {
			if (arguments.length >= 2) includePercentValues = arguments[1];
		} else {
			allowSpaces = options.allowSpaces !== void 0 ? options.allowSpaces : allowSpaces;
			includePercentValues = options.includePercentValues !== void 0 ? options.includePercentValues : includePercentValues;
		}
		if (allowSpaces) {
			if (!startsWithRgb.test(str)) return false;
			str = str.replace(/\s/g, "");
		}
		if (!includePercentValues) return rgbColor.test(str) || rgbaColor.test(str);
		return rgbColor.test(str) || rgbaColor.test(str) || rgbColorPercent.test(str) || rgbaColorPercent.test(str);
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/isHSL.js
var require_isHSL = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = isHSL;
	var _assertString = _interopRequireDefault(require_assertString());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	var hslComma = /^hsla?\(((\+|\-)?([0-9]+(\.[0-9]+)?(e(\+|\-)?[0-9]+)?|\.[0-9]+(e(\+|\-)?[0-9]+)?))(deg|grad|rad|turn)?(,(\+|\-)?([0-9]+(\.[0-9]+)?(e(\+|\-)?[0-9]+)?|\.[0-9]+(e(\+|\-)?[0-9]+)?)%){2}(,((\+|\-)?([0-9]+(\.[0-9]+)?(e(\+|\-)?[0-9]+)?|\.[0-9]+(e(\+|\-)?[0-9]+)?)%?))?\)$/i;
	var hslSpace = /^hsla?\(((\+|\-)?([0-9]+(\.[0-9]+)?(e(\+|\-)?[0-9]+)?|\.[0-9]+(e(\+|\-)?[0-9]+)?))(deg|grad|rad|turn)?(\s(\+|\-)?([0-9]+(\.[0-9]+)?(e(\+|\-)?[0-9]+)?|\.[0-9]+(e(\+|\-)?[0-9]+)?)%){2}\s?(\/\s((\+|\-)?([0-9]+(\.[0-9]+)?(e(\+|\-)?[0-9]+)?|\.[0-9]+(e(\+|\-)?[0-9]+)?)%?)\s?)?\)$/i;
	function isHSL(str) {
		(0, _assertString.default)(str);
		var strippedStr = str.replace(/\s+/g, " ").replace(/\s?(hsla?\(|\)|,)\s?/gi, "$1");
		if (strippedStr.indexOf(",") !== -1) return hslComma.test(strippedStr);
		return hslSpace.test(strippedStr);
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/isISRC.js
var require_isISRC = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = isISRC;
	var _assertString = _interopRequireDefault(require_assertString());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	var isrc = /^[A-Z]{2}[0-9A-Z]{3}\d{2}\d{5}$/;
	function isISRC(str) {
		(0, _assertString.default)(str);
		return isrc.test(str);
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/isIBAN.js
var require_isIBAN = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = isIBAN;
	exports.locales = void 0;
	var _assertString = _interopRequireDefault(require_assertString());
	var _includesArray = _interopRequireDefault(require_includesArray());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	/**
	* List of country codes with
	* corresponding IBAN regular expression
	* Reference: https://en.wikipedia.org/wiki/International_Bank_Account_Number
	*/
	var ibanRegexThroughCountryCode = {
		AD: /^(AD[0-9]{2})\d{8}[A-Z0-9]{12}$/,
		AE: /^(AE[0-9]{2})\d{3}\d{16}$/,
		AL: /^(AL[0-9]{2})\d{8}[A-Z0-9]{16}$/,
		AT: /^(AT[0-9]{2})\d{16}$/,
		AZ: /^(AZ[0-9]{2})[A-Z0-9]{4}\d{20}$/,
		BA: /^(BA[0-9]{2})\d{16}$/,
		BE: /^(BE[0-9]{2})\d{12}$/,
		BG: /^(BG[0-9]{2})[A-Z]{4}\d{6}[A-Z0-9]{8}$/,
		BH: /^(BH[0-9]{2})[A-Z]{4}[A-Z0-9]{14}$/,
		BR: /^(BR[0-9]{2})\d{23}[A-Z]{1}[A-Z0-9]{1}$/,
		BY: /^(BY[0-9]{2})[A-Z0-9]{4}\d{20}$/,
		CH: /^(CH[0-9]{2})\d{5}[A-Z0-9]{12}$/,
		CR: /^(CR[0-9]{2})\d{18}$/,
		CY: /^(CY[0-9]{2})\d{8}[A-Z0-9]{16}$/,
		CZ: /^(CZ[0-9]{2})\d{20}$/,
		DE: /^(DE[0-9]{2})\d{18}$/,
		DK: /^(DK[0-9]{2})\d{14}$/,
		DO: /^(DO[0-9]{2})[A-Z]{4}\d{20}$/,
		DZ: /^(DZ\d{24})$/,
		EE: /^(EE[0-9]{2})\d{16}$/,
		EG: /^(EG[0-9]{2})\d{25}$/,
		ES: /^(ES[0-9]{2})\d{20}$/,
		FI: /^(FI[0-9]{2})\d{14}$/,
		FO: /^(FO[0-9]{2})\d{14}$/,
		FR: /^(FR[0-9]{2})\d{10}[A-Z0-9]{11}\d{2}$/,
		GB: /^(GB[0-9]{2})[A-Z]{4}\d{14}$/,
		GE: /^(GE[0-9]{2})[A-Z0-9]{2}\d{16}$/,
		GI: /^(GI[0-9]{2})[A-Z]{4}[A-Z0-9]{15}$/,
		GL: /^(GL[0-9]{2})\d{14}$/,
		GR: /^(GR[0-9]{2})\d{7}[A-Z0-9]{16}$/,
		GT: /^(GT[0-9]{2})[A-Z0-9]{4}[A-Z0-9]{20}$/,
		HR: /^(HR[0-9]{2})\d{17}$/,
		HU: /^(HU[0-9]{2})\d{24}$/,
		IE: /^(IE[0-9]{2})[A-Z]{4}\d{14}$/,
		IL: /^(IL[0-9]{2})\d{19}$/,
		IQ: /^(IQ[0-9]{2})[A-Z]{4}\d{15}$/,
		IR: /^(IR[0-9]{2})\d{22}$/,
		IS: /^(IS[0-9]{2})\d{22}$/,
		IT: /^(IT[0-9]{2})[A-Z]{1}\d{10}[A-Z0-9]{12}$/,
		JO: /^(JO[0-9]{2})[A-Z]{4}\d{22}$/,
		KW: /^(KW[0-9]{2})[A-Z]{4}[A-Z0-9]{22}$/,
		KZ: /^(KZ[0-9]{2})\d{3}[A-Z0-9]{13}$/,
		LB: /^(LB[0-9]{2})\d{4}[A-Z0-9]{20}$/,
		LC: /^(LC[0-9]{2})[A-Z]{4}[A-Z0-9]{24}$/,
		LI: /^(LI[0-9]{2})\d{5}[A-Z0-9]{12}$/,
		LT: /^(LT[0-9]{2})\d{16}$/,
		LU: /^(LU[0-9]{2})\d{3}[A-Z0-9]{13}$/,
		LV: /^(LV[0-9]{2})[A-Z]{4}[A-Z0-9]{13}$/,
		MA: /^(MA[0-9]{26})$/,
		MC: /^(MC[0-9]{2})\d{10}[A-Z0-9]{11}\d{2}$/,
		MD: /^(MD[0-9]{2})[A-Z0-9]{20}$/,
		ME: /^(ME[0-9]{2})\d{18}$/,
		MK: /^(MK[0-9]{2})\d{3}[A-Z0-9]{10}\d{2}$/,
		MR: /^(MR[0-9]{2})\d{23}$/,
		MT: /^(MT[0-9]{2})[A-Z]{4}\d{5}[A-Z0-9]{18}$/,
		MU: /^(MU[0-9]{2})[A-Z]{4}\d{19}[A-Z]{3}$/,
		MZ: /^(MZ[0-9]{2})\d{21}$/,
		NL: /^(NL[0-9]{2})[A-Z]{4}\d{10}$/,
		NO: /^(NO[0-9]{2})\d{11}$/,
		PK: /^(PK[0-9]{2})[A-Z0-9]{4}\d{16}$/,
		PL: /^(PL[0-9]{2})\d{24}$/,
		PS: /^(PS[0-9]{2})[A-Z]{4}[A-Z0-9]{21}$/,
		PT: /^(PT[0-9]{2})\d{21}$/,
		QA: /^(QA[0-9]{2})[A-Z]{4}[A-Z0-9]{21}$/,
		RO: /^(RO[0-9]{2})[A-Z]{4}[A-Z0-9]{16}$/,
		RS: /^(RS[0-9]{2})\d{18}$/,
		SA: /^(SA[0-9]{2})\d{2}[A-Z0-9]{18}$/,
		SC: /^(SC[0-9]{2})[A-Z]{4}\d{20}[A-Z]{3}$/,
		SE: /^(SE[0-9]{2})\d{20}$/,
		SI: /^(SI[0-9]{2})\d{15}$/,
		SK: /^(SK[0-9]{2})\d{20}$/,
		SM: /^(SM[0-9]{2})[A-Z]{1}\d{10}[A-Z0-9]{12}$/,
		SV: /^(SV[0-9]{2})[A-Z0-9]{4}\d{20}$/,
		TL: /^(TL[0-9]{2})\d{19}$/,
		TN: /^(TN[0-9]{2})\d{20}$/,
		TR: /^(TR[0-9]{2})\d{5}[A-Z0-9]{17}$/,
		UA: /^(UA[0-9]{2})\d{6}[A-Z0-9]{19}$/,
		VA: /^(VA[0-9]{2})\d{18}$/,
		VG: /^(VG[0-9]{2})[A-Z]{4}\d{16}$/,
		XK: /^(XK[0-9]{2})\d{16}$/
	};
	/**
	* Check if the country codes passed are valid using the
	* ibanRegexThroughCountryCode as a reference
	*
	* @param {array} countryCodeArray
	* @return {boolean}
	*/
	function hasOnlyValidCountryCodes(countryCodeArray) {
		return countryCodeArray.filter(function(countryCode) {
			return !(countryCode in ibanRegexThroughCountryCode);
		}).length === 0;
	}
	/**
	* Check whether string has correct universal IBAN format
	* The IBAN consists of up to 34 alphanumeric characters, as follows:
	* Country Code using ISO 3166-1 alpha-2, two letters
	* check digits, two digits and
	* Basic Bank Account Number (BBAN), up to 30 alphanumeric characters.
	* NOTE: Permitted IBAN characters are: digits [0-9] and the 26 latin alphabetic [A-Z]
	*
	* @param {string} str - string under validation
	* @param {object} options - object to pass the countries to be either whitelisted or blacklisted
	* @return {boolean}
	*/
	function hasValidIbanFormat(str, options) {
		var strippedStr = str.replace(/[\s\-]+/gi, "").toUpperCase();
		var isoCountryCode = strippedStr.slice(0, 2).toUpperCase();
		var isoCountryCodeInIbanRegexCodeObject = isoCountryCode in ibanRegexThroughCountryCode;
		if (options.whitelist) {
			if (!hasOnlyValidCountryCodes(options.whitelist)) return false;
			if (!(0, _includesArray.default)(options.whitelist, isoCountryCode)) return false;
		}
		if (options.blacklist) {
			if ((0, _includesArray.default)(options.blacklist, isoCountryCode)) return false;
		}
		return isoCountryCodeInIbanRegexCodeObject && ibanRegexThroughCountryCode[isoCountryCode].test(strippedStr);
	}
	/**
	* Check whether string has valid IBAN Checksum
	* by performing basic mod-97 operation and
	* the remainder should equal 1
	* -- Start by rearranging the IBAN by moving the four initial characters to the end of the string
	* -- Replace each letter in the string with two digits, A -> 10, B = 11, Z = 35
	* -- Interpret the string as a decimal integer and
	* -- compute the remainder on division by 97 (mod 97)
	* Reference: https://en.wikipedia.org/wiki/International_Bank_Account_Number
	*
	* @param {string} str
	* @return {boolean}
	*/
	function hasValidIbanChecksum(str) {
		var strippedStr = str.replace(/[^A-Z0-9]+/gi, "").toUpperCase();
		return (strippedStr.slice(4) + strippedStr.slice(0, 4)).replace(/[A-Z]/g, function(char) {
			return char.charCodeAt(0) - 55;
		}).match(/\d{1,7}/g).reduce(function(acc, value) {
			return Number(acc + value) % 97;
		}, "") === 1;
	}
	function isIBAN(str) {
		var options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
		(0, _assertString.default)(str);
		return hasValidIbanFormat(str, options) && hasValidIbanChecksum(str);
	}
	exports.locales = Object.keys(ibanRegexThroughCountryCode);
}));
// node_modules/validator/lib/isISO31661Alpha2.js
var require_isISO31661Alpha2 = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.CountryCodes = void 0;
	exports.default = isISO31661Alpha2;
	var _assertString = _interopRequireDefault(require_assertString());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	var validISO31661Alpha2CountriesCodes = /* @__PURE__ */ new Set([
		"AD",
		"AE",
		"AF",
		"AG",
		"AI",
		"AL",
		"AM",
		"AO",
		"AQ",
		"AR",
		"AS",
		"AT",
		"AU",
		"AW",
		"AX",
		"AZ",
		"BA",
		"BB",
		"BD",
		"BE",
		"BF",
		"BG",
		"BH",
		"BI",
		"BJ",
		"BL",
		"BM",
		"BN",
		"BO",
		"BQ",
		"BR",
		"BS",
		"BT",
		"BV",
		"BW",
		"BY",
		"BZ",
		"CA",
		"CC",
		"CD",
		"CF",
		"CG",
		"CH",
		"CI",
		"CK",
		"CL",
		"CM",
		"CN",
		"CO",
		"CR",
		"CU",
		"CV",
		"CW",
		"CX",
		"CY",
		"CZ",
		"DE",
		"DJ",
		"DK",
		"DM",
		"DO",
		"DZ",
		"EC",
		"EE",
		"EG",
		"EH",
		"ER",
		"ES",
		"ET",
		"FI",
		"FJ",
		"FK",
		"FM",
		"FO",
		"FR",
		"GA",
		"GB",
		"GD",
		"GE",
		"GF",
		"GG",
		"GH",
		"GI",
		"GL",
		"GM",
		"GN",
		"GP",
		"GQ",
		"GR",
		"GS",
		"GT",
		"GU",
		"GW",
		"GY",
		"HK",
		"HM",
		"HN",
		"HR",
		"HT",
		"HU",
		"ID",
		"IE",
		"IL",
		"IM",
		"IN",
		"IO",
		"IQ",
		"IR",
		"IS",
		"IT",
		"JE",
		"JM",
		"JO",
		"JP",
		"KE",
		"KG",
		"KH",
		"KI",
		"KM",
		"KN",
		"KP",
		"KR",
		"KW",
		"KY",
		"KZ",
		"LA",
		"LB",
		"LC",
		"LI",
		"LK",
		"LR",
		"LS",
		"LT",
		"LU",
		"LV",
		"LY",
		"MA",
		"MC",
		"MD",
		"ME",
		"MF",
		"MG",
		"MH",
		"MK",
		"ML",
		"MM",
		"MN",
		"MO",
		"MP",
		"MQ",
		"MR",
		"MS",
		"MT",
		"MU",
		"MV",
		"MW",
		"MX",
		"MY",
		"MZ",
		"NA",
		"NC",
		"NE",
		"NF",
		"NG",
		"NI",
		"NL",
		"NO",
		"NP",
		"NR",
		"NU",
		"NZ",
		"OM",
		"PA",
		"PE",
		"PF",
		"PG",
		"PH",
		"PK",
		"PL",
		"PM",
		"PN",
		"PR",
		"PS",
		"PT",
		"PW",
		"PY",
		"QA",
		"RE",
		"RO",
		"RS",
		"RU",
		"RW",
		"SA",
		"SB",
		"SC",
		"SD",
		"SE",
		"SG",
		"SH",
		"SI",
		"SJ",
		"SK",
		"SL",
		"SM",
		"SN",
		"SO",
		"SR",
		"SS",
		"ST",
		"SV",
		"SX",
		"SY",
		"SZ",
		"TC",
		"TD",
		"TF",
		"TG",
		"TH",
		"TJ",
		"TK",
		"TL",
		"TM",
		"TN",
		"TO",
		"TR",
		"TT",
		"TV",
		"TW",
		"TZ",
		"UA",
		"UG",
		"UM",
		"US",
		"UY",
		"UZ",
		"VA",
		"VC",
		"VE",
		"VG",
		"VI",
		"VN",
		"VU",
		"WF",
		"WS",
		"YE",
		"YT",
		"ZA",
		"ZM",
		"ZW"
	]);
	var alpha2CountryCode = /^[a-zA-Z]{2}$/;
	function isISO31661Alpha2(str) {
		var options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
		(0, _assertString.default)(str);
		if ((options.userAssignedCodes || []).reduce(function(accumulator, userAssignedCode) {
			if (alpha2CountryCode.test(userAssignedCode)) accumulator.push(userAssignedCode.toUpperCase());
			return accumulator;
		}, []).includes(str.toUpperCase())) return true;
		return validISO31661Alpha2CountriesCodes.has(str.toUpperCase());
	}
	exports.CountryCodes = validISO31661Alpha2CountriesCodes;
}));
// node_modules/validator/lib/isBIC.js
var require_isBIC = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = isBIC;
	var _assertString = _interopRequireDefault(require_assertString());
	var _isISO31661Alpha = require_isISO31661Alpha2();
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	var isBICReg = /^[A-Za-z]{6}[A-Za-z0-9]{2}([A-Za-z0-9]{3})?$/;
	function isBIC(str) {
		(0, _assertString.default)(str);
		var countryCode = str.slice(4, 6).toUpperCase();
		if (!_isISO31661Alpha.CountryCodes.has(countryCode) && countryCode !== "XK") return false;
		return isBICReg.test(str);
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/isMD5.js
var require_isMD5 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = isMD5;
	var _assertString = _interopRequireDefault(require_assertString());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	var md5 = /^[a-f0-9]{32}$/;
	function isMD5(str) {
		(0, _assertString.default)(str);
		return md5.test(str);
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/isHash.js
var require_isHash = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = isHash;
	var _assertString = _interopRequireDefault(require_assertString());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	var lengths = {
		md5: 32,
		md4: 32,
		sha1: 40,
		sha256: 64,
		sha384: 96,
		sha512: 128,
		ripemd128: 32,
		ripemd160: 40,
		tiger128: 32,
		tiger160: 40,
		tiger192: 48,
		crc32: 8,
		crc32b: 8
	};
	function isHash(str, algorithm) {
		(0, _assertString.default)(str);
		return new RegExp("^[a-fA-F0-9]{".concat(lengths[algorithm], "}$")).test(str);
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/isBase64.js
var require_isBase64 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = isBase64;
	var _assertString = _interopRequireDefault(require_assertString());
	var _merge = _interopRequireDefault(require_merge());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	var base64WithPadding = /^[A-Za-z0-9+/]+={0,2}$/;
	var base64WithoutPadding = /^[A-Za-z0-9+/]+$/;
	var base64UrlWithPadding = /^[A-Za-z0-9_-]+={0,2}$/;
	var base64UrlWithoutPadding = /^[A-Za-z0-9_-]+$/;
	function isBase64(str, options) {
		var _options;
		(0, _assertString.default)(str);
		options = (0, _merge.default)(options, {
			urlSafe: false,
			padding: !((_options = options) !== null && _options !== void 0 && _options.urlSafe)
		});
		if (str === "") return true;
		if (options.padding && str.length % 4 !== 0) return false;
		var regex;
		if (options.urlSafe) regex = options.padding ? base64UrlWithPadding : base64UrlWithoutPadding;
		else regex = options.padding ? base64WithPadding : base64WithoutPadding;
		return (!options.padding || str.length % 4 === 0) && regex.test(str);
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/isJWT.js
var require_isJWT = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = isJWT;
	var _assertString = _interopRequireDefault(require_assertString());
	var _isBase = _interopRequireDefault(require_isBase64());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	function isJWT(str) {
		(0, _assertString.default)(str);
		var dotSplit = str.split(".");
		if (dotSplit.length !== 3) return false;
		return dotSplit.reduce(function(acc, currElem) {
			return acc && (0, _isBase.default)(currElem, { urlSafe: true });
		}, true);
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/isJSON.js
var require_isJSON = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = isJSON;
	var _assertString = _interopRequireDefault(require_assertString());
	var _includesArray = _interopRequireDefault(require_includesArray());
	var _merge = _interopRequireDefault(require_merge());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	function _typeof(o) {
		"@babel/helpers - typeof";
		return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o) {
			return typeof o;
		} : function(o) {
			return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
		}, _typeof(o);
	}
	var default_json_options = {
		allow_primitives: false,
		allow_any_value: false
	};
	function isJSON(str, options) {
		(0, _assertString.default)(str);
		try {
			options = (0, _merge.default)(options, default_json_options);
			var obj = JSON.parse(str);
			if (options.allow_any_value) return true;
			var primitives = [];
			if (options.allow_primitives) primitives = [
				null,
				false,
				true
			];
			return (0, _includesArray.default)(primitives, obj) || !!obj && _typeof(obj) === "object";
		} catch (e) {}
		return false;
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/isEmpty.js
var require_isEmpty = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = isEmpty;
	var _assertString = _interopRequireDefault(require_assertString());
	var _merge = _interopRequireDefault(require_merge());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	var default_is_empty_options = { ignore_whitespace: false };
	function isEmpty(str, options) {
		(0, _assertString.default)(str);
		options = (0, _merge.default)(options, default_is_empty_options);
		return (options.ignore_whitespace ? str.trim().length : str.length) === 0;
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/isLength.js
var require_isLength = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = isLength;
	var _assertString = _interopRequireDefault(require_assertString());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	function _typeof(o) {
		"@babel/helpers - typeof";
		return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o) {
			return typeof o;
		} : function(o) {
			return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
		}, _typeof(o);
	}
	function isLength(str, options) {
		(0, _assertString.default)(str);
		var min;
		var max;
		if (_typeof(options) === "object") {
			min = options.min || 0;
			max = options.max;
		} else {
			min = arguments[1] || 0;
			max = arguments[2];
		}
		var presentationSequences = str.match(/[^\uFE0F\uFE0E][\uFE0F\uFE0E]/g) || [];
		var surrogatePairs = str.match(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g) || [];
		var len = str.length - presentationSequences.length - surrogatePairs.length;
		var isInsideRange = len >= min && (typeof max === "undefined" || len <= max);
		if (isInsideRange && Array.isArray(options === null || options === void 0 ? void 0 : options.discreteLengths)) return options.discreteLengths.some(function(discreteLen) {
			return discreteLen === len;
		});
		return isInsideRange;
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/isULID.js
var require_isULID = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = isULID;
	var _assertString = _interopRequireDefault(require_assertString());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	function isULID(str) {
		(0, _assertString.default)(str);
		return /^[0-7][0-9A-HJKMNP-TV-Z]{25}$/i.test(str);
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/isUUID.js
var require_isUUID = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = isUUID;
	var _assertString = _interopRequireDefault(require_assertString());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	var uuid = {
		1: /^[0-9A-F]{8}-[0-9A-F]{4}-1[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i,
		2: /^[0-9A-F]{8}-[0-9A-F]{4}-2[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i,
		3: /^[0-9A-F]{8}-[0-9A-F]{4}-3[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i,
		4: /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i,
		5: /^[0-9A-F]{8}-[0-9A-F]{4}-5[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i,
		6: /^[0-9A-F]{8}-[0-9A-F]{4}-6[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i,
		7: /^[0-9A-F]{8}-[0-9A-F]{4}-7[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i,
		8: /^[0-9A-F]{8}-[0-9A-F]{4}-8[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i,
		nil: /^00000000-0000-0000-0000-000000000000$/i,
		max: /^ffffffff-ffff-ffff-ffff-ffffffffffff$/i,
		loose: /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i,
		all: /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/i
	};
	function isUUID(str, version) {
		(0, _assertString.default)(str);
		if (version === void 0 || version === null) version = "all";
		return version in uuid ? uuid[version].test(str) : false;
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/isMongoId.js
var require_isMongoId = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = isMongoId;
	var _assertString = _interopRequireDefault(require_assertString());
	var _isHexadecimal = _interopRequireDefault(require_isHexadecimal());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	function isMongoId(str) {
		(0, _assertString.default)(str);
		return (0, _isHexadecimal.default)(str) && str.length === 24;
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/isAfter.js
var require_isAfter = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = isAfter;
	var _toDate = _interopRequireDefault(require_toDate());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	function _typeof(o) {
		"@babel/helpers - typeof";
		return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o) {
			return typeof o;
		} : function(o) {
			return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
		}, _typeof(o);
	}
	function isAfter(date, options) {
		var comparisonDate = (_typeof(options) === "object" ? options.comparisonDate : options) || Date().toString();
		var comparison = (0, _toDate.default)(comparisonDate);
		var original = (0, _toDate.default)(date);
		return !!(original && comparison && original > comparison);
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/isBefore.js
var require_isBefore = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = isBefore;
	var _toDate = _interopRequireDefault(require_toDate());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	function _typeof(o) {
		"@babel/helpers - typeof";
		return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o) {
			return typeof o;
		} : function(o) {
			return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
		}, _typeof(o);
	}
	function isBefore(date, options) {
		var comparisonDate = (_typeof(options) === "object" ? options.comparisonDate : options) || Date().toString();
		var comparison = (0, _toDate.default)(comparisonDate);
		var original = (0, _toDate.default)(date);
		return !!(original && comparison && original < comparison);
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/isIn.js
var require_isIn = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = isIn;
	var _assertString = _interopRequireDefault(require_assertString());
	var _toString = _interopRequireDefault(require_toString());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	function _typeof(o) {
		"@babel/helpers - typeof";
		return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o) {
			return typeof o;
		} : function(o) {
			return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
		}, _typeof(o);
	}
	function isIn(str, options) {
		(0, _assertString.default)(str);
		var i;
		if (Object.prototype.toString.call(options) === "[object Array]") {
			var array = [];
			for (i in options)
 // istanbul ignore else
			if ({}.hasOwnProperty.call(options, i)) array[i] = (0, _toString.default)(options[i]);
			return array.indexOf(str) >= 0;
		} else if (_typeof(options) === "object") return options.hasOwnProperty(str);
		else if (options && typeof options.indexOf === "function") return options.indexOf(str) >= 0;
		return false;
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/isLuhnNumber.js
var require_isLuhnNumber = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = isLuhnNumber;
	var _assertString = _interopRequireDefault(require_assertString());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	function isLuhnNumber(str) {
		(0, _assertString.default)(str);
		var sanitized = str.replace(/[- ]+/g, "");
		var sum = 0;
		var digit;
		var tmpNum;
		var shouldDouble;
		for (var i = sanitized.length - 1; i >= 0; i--) {
			digit = sanitized.substring(i, i + 1);
			tmpNum = parseInt(digit, 10);
			if (shouldDouble) {
				tmpNum *= 2;
				if (tmpNum >= 10) sum += tmpNum % 10 + 1;
				else sum += tmpNum;
			} else sum += tmpNum;
			shouldDouble = !shouldDouble;
		}
		return !!(sum % 10 === 0 ? sanitized : false);
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/isCreditCard.js
var require_isCreditCard = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = isCreditCard;
	var _assertString = _interopRequireDefault(require_assertString());
	var _isLuhnNumber = _interopRequireDefault(require_isLuhnNumber());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	var cards = {
		amex: /^3[47][0-9]{13}$/,
		dinersclub: /^3(?:0[0-5]|[68][0-9])[0-9]{11}$/,
		discover: /^6(?:011|5[0-9][0-9])[0-9]{12,15}$/,
		jcb: /^(?:2131|1800|35\d{3})\d{11}$/,
		mastercard: /^5[1-5][0-9]{2}|(222[1-9]|22[3-9][0-9]|2[3-6][0-9]{2}|27[01][0-9]|2720)[0-9]{12}$/,
		unionpay: /^(6[27][0-9]{14}|^(81[0-9]{14,17}))$/,
		visa: /^(?:4[0-9]{12})(?:[0-9]{3,6})?$/
	};
	var allCards = function() {
		var tmpCardsArray = [];
		for (var cardProvider in cards)
 // istanbul ignore else
		if (cards.hasOwnProperty(cardProvider)) tmpCardsArray.push(cards[cardProvider]);
		return tmpCardsArray;
	}();
	function isCreditCard(card) {
		var options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
		(0, _assertString.default)(card);
		var provider = options.provider;
		var sanitized = card.replace(/[- ]+/g, "");
		if (provider && provider.toLowerCase() in cards) {
			if (!cards[provider.toLowerCase()].test(sanitized)) return false;
		} else if (provider && !(provider.toLowerCase() in cards)) throw new Error("".concat(provider, " is not a valid credit card provider."));
		else if (!allCards.some(function(cardProvider) {
			return cardProvider.test(sanitized);
		})) return false;
		return (0, _isLuhnNumber.default)(card);
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/isIdentityCard.js
var require_isIdentityCard = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = isIdentityCard;
	var _assertString = _interopRequireDefault(require_assertString());
	var _includesArray = _interopRequireDefault(require_includesArray());
	var _isInt = _interopRequireDefault(require_isInt());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	var validators = {
		PL: function PL(str) {
			(0, _assertString.default)(str);
			var weightOfDigits = {
				1: 1,
				2: 3,
				3: 7,
				4: 9,
				5: 1,
				6: 3,
				7: 7,
				8: 9,
				9: 1,
				10: 3,
				11: 0
			};
			if (str != null && str.length === 11 && (0, _isInt.default)(str, { allow_leading_zeroes: true })) {
				var modulo = str.split("").slice(0, -1).reduce(function(acc, digit, index) {
					return acc + Number(digit) * weightOfDigits[index + 1];
				}, 0) % 10;
				var lastDigit = Number(str.charAt(str.length - 1));
				if (modulo === 0 && lastDigit === 0 || lastDigit === 10 - modulo) return true;
			}
			return false;
		},
		ES: function ES(str) {
			(0, _assertString.default)(str);
			var DNI = /^[0-9X-Z][0-9]{7}[TRWAGMYFPDXBNJZSQVHLCKE]$/;
			var charsValue = {
				X: 0,
				Y: 1,
				Z: 2
			};
			var controlDigits = [
				"T",
				"R",
				"W",
				"A",
				"G",
				"M",
				"Y",
				"F",
				"P",
				"D",
				"X",
				"B",
				"N",
				"J",
				"Z",
				"S",
				"Q",
				"V",
				"H",
				"L",
				"C",
				"K",
				"E"
			];
			var sanitized = str.trim().toUpperCase();
			if (!DNI.test(sanitized)) return false;
			var number = sanitized.slice(0, -1).replace(/[X,Y,Z]/g, function(char) {
				return charsValue[char];
			});
			return sanitized.endsWith(controlDigits[number % 23]);
		},
		FI: function FI(str) {
			(0, _assertString.default)(str);
			if (str.length !== 11) return false;
			if (!str.match(/^\d{6}[\-A\+]\d{3}[0-9ABCDEFHJKLMNPRSTUVWXY]{1}$/)) return false;
			return "0123456789ABCDEFHJKLMNPRSTUVWXY"[(parseInt(str.slice(0, 6), 10) * 1e3 + parseInt(str.slice(7, 10), 10)) % 31] === str.slice(10, 11);
		},
		IN: function IN(str) {
			var DNI = /^[1-9]\d{3}\s?\d{4}\s?\d{4}$/;
			var d = [
				[
					0,
					1,
					2,
					3,
					4,
					5,
					6,
					7,
					8,
					9
				],
				[
					1,
					2,
					3,
					4,
					0,
					6,
					7,
					8,
					9,
					5
				],
				[
					2,
					3,
					4,
					0,
					1,
					7,
					8,
					9,
					5,
					6
				],
				[
					3,
					4,
					0,
					1,
					2,
					8,
					9,
					5,
					6,
					7
				],
				[
					4,
					0,
					1,
					2,
					3,
					9,
					5,
					6,
					7,
					8
				],
				[
					5,
					9,
					8,
					7,
					6,
					0,
					4,
					3,
					2,
					1
				],
				[
					6,
					5,
					9,
					8,
					7,
					1,
					0,
					4,
					3,
					2
				],
				[
					7,
					6,
					5,
					9,
					8,
					2,
					1,
					0,
					4,
					3
				],
				[
					8,
					7,
					6,
					5,
					9,
					3,
					2,
					1,
					0,
					4
				],
				[
					9,
					8,
					7,
					6,
					5,
					4,
					3,
					2,
					1,
					0
				]
			];
			var p = [
				[
					0,
					1,
					2,
					3,
					4,
					5,
					6,
					7,
					8,
					9
				],
				[
					1,
					5,
					7,
					6,
					2,
					8,
					3,
					0,
					9,
					4
				],
				[
					5,
					8,
					0,
					3,
					7,
					9,
					6,
					1,
					4,
					2
				],
				[
					8,
					9,
					1,
					6,
					0,
					4,
					3,
					5,
					2,
					7
				],
				[
					9,
					4,
					5,
					3,
					1,
					2,
					6,
					8,
					7,
					0
				],
				[
					4,
					2,
					8,
					6,
					5,
					7,
					3,
					9,
					0,
					1
				],
				[
					2,
					7,
					9,
					3,
					8,
					0,
					6,
					4,
					1,
					5
				],
				[
					7,
					0,
					4,
					6,
					9,
					1,
					3,
					2,
					5,
					8
				]
			];
			var sanitized = str.trim();
			if (!DNI.test(sanitized)) return false;
			var c = 0;
			sanitized.replace(/\s/g, "").split("").map(Number).reverse().forEach(function(val, i) {
				c = d[c][p[i % 8][val]];
			});
			return c === 0;
		},
		IR: function IR(str) {
			if (!str.match(/^\d{10}$/)) return false;
			str = "0000".concat(str).slice(str.length - 6);
			if (parseInt(str.slice(3, 9), 10) === 0) return false;
			var lastNumber = parseInt(str.slice(9, 10), 10);
			var sum = 0;
			for (var i = 0; i < 9; i++) sum += parseInt(str.slice(i, i + 1), 10) * (10 - i);
			sum %= 11;
			return sum < 2 && lastNumber === sum || sum >= 2 && lastNumber === 11 - sum;
		},
		IT: function IT(str) {
			if (str.length !== 9) return false;
			if (str === "CA00000AA") return false;
			return str.search(/C[A-Z]\d{5}[A-Z]{2}/i) > -1;
		},
		NO: function NO(str) {
			var sanitized = str.trim();
			if (isNaN(Number(sanitized))) return false;
			if (sanitized.length !== 11) return false;
			if (sanitized === "00000000000") return false;
			var f = sanitized.split("").map(Number);
			var k1 = (11 - (3 * f[0] + 7 * f[1] + 6 * f[2] + 1 * f[3] + 8 * f[4] + 9 * f[5] + 4 * f[6] + 5 * f[7] + 2 * f[8]) % 11) % 11;
			var k2 = (11 - (5 * f[0] + 4 * f[1] + 3 * f[2] + 2 * f[3] + 7 * f[4] + 6 * f[5] + 5 * f[6] + 4 * f[7] + 3 * f[8] + 2 * k1) % 11) % 11;
			if (k1 !== f[9] || k2 !== f[10]) return false;
			return true;
		},
		TH: function TH(str) {
			if (!str.match(/^[1-8]\d{12}$/)) return false;
			var sum = 0;
			for (var i = 0; i < 12; i++) sum += parseInt(str[i], 10) * (13 - i);
			return str[12] === ((11 - sum % 11) % 10).toString();
		},
		LK: function LK(str) {
			var old_nic = /^[1-9]\d{8}[vx]$/i;
			var new_nic = /^[1-9]\d{11}$/i;
			if (str.length === 10 && old_nic.test(str)) return true;
			else if (str.length === 12 && new_nic.test(str)) return true;
			return false;
		},
		"he-IL": function heIL(str) {
			var DNI = /^\d{9}$/;
			var sanitized = str.trim();
			if (!DNI.test(sanitized)) return false;
			var id = sanitized;
			var sum = 0, incNum;
			for (var i = 0; i < id.length; i++) {
				incNum = Number(id[i]) * (i % 2 + 1);
				sum += incNum > 9 ? incNum - 9 : incNum;
			}
			return sum % 10 === 0;
		},
		"ar-LY": function arLY(str) {
			var NIN = /^(1|2)\d{11}$/;
			var sanitized = str.trim();
			return NIN.test(sanitized);
		},
		"ar-TN": function arTN(str) {
			var DNI = /^\d{8}$/;
			var sanitized = str.trim();
			return DNI.test(sanitized);
		},
		"zh-CN": function zhCN(str) {
			var provincesAndCities = [
				"11",
				"12",
				"13",
				"14",
				"15",
				"21",
				"22",
				"23",
				"31",
				"32",
				"33",
				"34",
				"35",
				"36",
				"37",
				"41",
				"42",
				"43",
				"44",
				"45",
				"46",
				"50",
				"51",
				"52",
				"53",
				"54",
				"61",
				"62",
				"63",
				"64",
				"65",
				"71",
				"81",
				"82",
				"91"
			];
			var powers = [
				"7",
				"9",
				"10",
				"5",
				"8",
				"4",
				"2",
				"1",
				"6",
				"3",
				"7",
				"9",
				"10",
				"5",
				"8",
				"4",
				"2"
			];
			var parityBit = [
				"1",
				"0",
				"X",
				"9",
				"8",
				"7",
				"6",
				"5",
				"4",
				"3",
				"2"
			];
			var checkAddressCode = function checkAddressCode(addressCode) {
				return (0, _includesArray.default)(provincesAndCities, addressCode);
			};
			var checkBirthDayCode = function checkBirthDayCode(birDayCode) {
				var yyyy = parseInt(birDayCode.substring(0, 4), 10);
				var mm = parseInt(birDayCode.substring(4, 6), 10);
				var dd = parseInt(birDayCode.substring(6), 10);
				var xdata = new Date(yyyy, mm - 1, dd);
				if (xdata > /* @__PURE__ */ new Date()) return false;
				else if (xdata.getFullYear() === yyyy && xdata.getMonth() === mm - 1 && xdata.getDate() === dd) return true;
				return false;
			};
			var getParityBit = function getParityBit(idCardNo) {
				var id17 = idCardNo.substring(0, 17);
				var power = 0;
				for (var i = 0; i < 17; i++) power += parseInt(id17.charAt(i), 10) * parseInt(powers[i], 10);
				return parityBit[power % 11];
			};
			var checkParityBit = function checkParityBit(idCardNo) {
				return getParityBit(idCardNo) === idCardNo.charAt(17).toUpperCase();
			};
			var check15IdCardNo = function check15IdCardNo(idCardNo) {
				var check = /^[1-9]\d{7}((0[1-9])|(1[0-2]))((0[1-9])|([1-2][0-9])|(3[0-1]))\d{3}$/.test(idCardNo);
				if (!check) return false;
				check = checkAddressCode(idCardNo.substring(0, 2));
				if (!check) return false;
				check = checkBirthDayCode("19".concat(idCardNo.substring(6, 12)));
				if (!check) return false;
				return true;
			};
			var check18IdCardNo = function check18IdCardNo(idCardNo) {
				var check = /^[1-9]\d{5}[1-9]\d{3}((0[1-9])|(1[0-2]))((0[1-9])|([1-2][0-9])|(3[0-1]))\d{3}(\d|x|X)$/.test(idCardNo);
				if (!check) return false;
				check = checkAddressCode(idCardNo.substring(0, 2));
				if (!check) return false;
				check = checkBirthDayCode(idCardNo.substring(6, 14));
				if (!check) return false;
				return checkParityBit(idCardNo);
			};
			return function checkIdCardNo(idCardNo) {
				if (!/^\d{15}|(\d{17}(\d|x|X))$/.test(idCardNo)) return false;
				if (idCardNo.length === 15) return check15IdCardNo(idCardNo);
				return check18IdCardNo(idCardNo);
			}(str);
		},
		"zh-HK": function zhHK(str) {
			str = str.trim();
			var regexHKID = /^[A-Z]{1,2}[0-9]{6}((\([0-9A]\))|(\[[0-9A]\])|([0-9A]))$/;
			var regexIsDigit = /^[0-9]$/;
			str = str.toUpperCase();
			if (!regexHKID.test(str)) return false;
			str = str.replace(/\[|\]|\(|\)/g, "");
			if (str.length === 8) str = "3".concat(str);
			var checkSumVal = 0;
			for (var i = 0; i <= 7; i++) {
				var convertedChar = void 0;
				if (!regexIsDigit.test(str[i])) convertedChar = (str[i].charCodeAt(0) - 55) % 11;
				else convertedChar = str[i];
				checkSumVal += convertedChar * (9 - i);
			}
			checkSumVal %= 11;
			var checkSumConverted;
			if (checkSumVal === 0) checkSumConverted = "0";
			else if (checkSumVal === 1) checkSumConverted = "A";
			else checkSumConverted = String(11 - checkSumVal);
			if (checkSumConverted === str[str.length - 1]) return true;
			return false;
		},
		"zh-TW": function zhTW(str) {
			var ALPHABET_CODES = {
				A: 10,
				B: 11,
				C: 12,
				D: 13,
				E: 14,
				F: 15,
				G: 16,
				H: 17,
				I: 34,
				J: 18,
				K: 19,
				L: 20,
				M: 21,
				N: 22,
				O: 35,
				P: 23,
				Q: 24,
				R: 25,
				S: 26,
				T: 27,
				U: 28,
				V: 29,
				W: 32,
				X: 30,
				Y: 31,
				Z: 33
			};
			var sanitized = str.trim().toUpperCase();
			if (!/^[A-Z][0-9]{9}$/.test(sanitized)) return false;
			return Array.from(sanitized).reduce(function(sum, number, index) {
				if (index === 0) {
					var code = ALPHABET_CODES[number];
					return code % 10 * 9 + Math.floor(code / 10);
				}
				if (index === 9) return (10 - sum % 10 - Number(number)) % 10 === 0;
				return sum + Number(number) * (9 - index);
			}, 0);
		},
		PK: function PK(str) {
			var CNIC = /^[1-7][0-9]{4}-[0-9]{7}-[1-9]$/;
			var sanitized = str.trim();
			return CNIC.test(sanitized);
		}
	};
	function isIdentityCard(str, locale) {
		(0, _assertString.default)(str);
		if (locale in validators) return validators[locale](str);
		else if (locale === "any") {
			for (var key in validators)
 // istanbul ignore else
			if (validators.hasOwnProperty(key)) {
				if ((0, validators[key])(str)) return true;
			}
			return false;
		}
		throw new Error("Invalid locale '".concat(locale, "'"));
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/isEAN.js
var require_isEAN = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = isEAN;
	var _assertString = _interopRequireDefault(require_assertString());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	/**
	* The most commonly used EAN standard is
	* the thirteen-digit EAN-13, while the
	* less commonly used 8-digit EAN-8 barcode was
	* introduced for use on small packages.
	* Also EAN/UCC-14 is used for Grouping of individual
	* trade items above unit level(Intermediate, Carton or Pallet).
	* For more info about EAN-14 checkout: https://www.gtin.info/itf-14-barcodes/
	* EAN consists of:
	* GS1 prefix, manufacturer code, product code and check digit
	* Reference: https://en.wikipedia.org/wiki/International_Article_Number
	* Reference: https://www.gtin.info/
	*/
	/**
	* Define EAN Lengths; 8 for EAN-8; 13 for EAN-13; 14 for EAN-14
	* and Regular Expression for valid EANs (EAN-8, EAN-13, EAN-14),
	* with exact numeric matching of 8 or 13 or 14 digits [0-9]
	*/
	var LENGTH_EAN_8 = 8;
	var LENGTH_EAN_14 = 14;
	var validEanRegex = /^(\d{8}|\d{13}|\d{14})$/;
	/**
	* Get position weight given:
	* EAN length and digit index/position
	*
	* @param {number} length
	* @param {number} index
	* @return {number}
	*/
	function getPositionWeightThroughLengthAndIndex(length, index) {
		if (length === LENGTH_EAN_8 || length === LENGTH_EAN_14) return index % 2 === 0 ? 3 : 1;
		return index % 2 === 0 ? 1 : 3;
	}
	/**
	* Calculate EAN Check Digit
	* Reference: https://en.wikipedia.org/wiki/International_Article_Number#Calculation_of_checksum_digit
	*
	* @param {string} ean
	* @return {number}
	*/
	function calculateCheckDigit(ean) {
		var remainder = 10 - ean.slice(0, -1).split("").map(function(char, index) {
			return Number(char) * getPositionWeightThroughLengthAndIndex(ean.length, index);
		}).reduce(function(acc, partialSum) {
			return acc + partialSum;
		}, 0) % 10;
		return remainder < 10 ? remainder : 0;
	}
	/**
	* Check if string is valid EAN:
	* Matches EAN-8/EAN-13/EAN-14 regex
	* Has valid check digit.
	*
	* @param {string} str
	* @return {boolean}
	*/
	function isEAN(str) {
		(0, _assertString.default)(str);
		var actualCheckDigit = Number(str.slice(-1));
		return validEanRegex.test(str) && actualCheckDigit === calculateCheckDigit(str);
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/isISIN.js
var require_isISIN = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = isISIN;
	var _assertString = _interopRequireDefault(require_assertString());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	var isin = /^[A-Z]{2}[0-9A-Z]{9}[0-9]$/;
	function isISIN(str) {
		(0, _assertString.default)(str);
		if (!isin.test(str)) return false;
		var double = true;
		var sum = 0;
		for (var i = str.length - 2; i >= 0; i--) if (str[i] >= "A" && str[i] <= "Z") {
			var value = str[i].charCodeAt(0) - 55;
			var lo = value % 10;
			var hi = Math.trunc(value / 10);
			for (var _i = 0, _arr = [lo, hi]; _i < _arr.length; _i++) {
				var digit = _arr[_i];
				if (double) {
					if (digit >= 5) sum += 1 + (digit - 5) * 2;
					else sum += digit * 2;
				} else sum += digit;
				double = !double;
			}
		} else {
			var _digit = str[i].charCodeAt(0) - "0".charCodeAt(0);
			if (double) {
				if (_digit >= 5) sum += 1 + (_digit - 5) * 2;
				else sum += _digit * 2;
			} else sum += _digit;
			double = !double;
		}
		var check = Math.trunc((sum + 9) / 10) * 10 - sum;
		return +str[str.length - 1] === check;
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/isISBN.js
var require_isISBN = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = isISBN;
	var _assertString = _interopRequireDefault(require_assertString());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	var possibleIsbn10 = /^(?:[0-9]{9}X|[0-9]{10})$/;
	var possibleIsbn13 = /^(?:[0-9]{13})$/;
	var factor = [1, 3];
	function isISBN(isbn, options) {
		(0, _assertString.default)(isbn);
		var version = String((options === null || options === void 0 ? void 0 : options.version) || options);
		if (!(options !== null && options !== void 0 && options.version || options)) return isISBN(isbn, { version: 10 }) || isISBN(isbn, { version: 13 });
		var sanitizedIsbn = isbn.replace(/[\s-]+/g, "");
		var checksum = 0;
		if (version === "10") {
			if (!possibleIsbn10.test(sanitizedIsbn)) return false;
			for (var i = 0; i < version - 1; i++) checksum += (i + 1) * sanitizedIsbn.charAt(i);
			if (sanitizedIsbn.charAt(9) === "X") checksum += 100;
			else checksum += 10 * sanitizedIsbn.charAt(9);
			if (checksum % 11 === 0) return true;
		} else if (version === "13") {
			if (!possibleIsbn13.test(sanitizedIsbn)) return false;
			for (var _i = 0; _i < 12; _i++) checksum += factor[_i % 2] * sanitizedIsbn.charAt(_i);
			if (sanitizedIsbn.charAt(12) - (10 - checksum % 10) % 10 === 0) return true;
		}
		return false;
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/isISSN.js
var require_isISSN = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = isISSN;
	var _assertString = _interopRequireDefault(require_assertString());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	var issn = "^\\d{4}-?\\d{3}[\\dX]$";
	function isISSN(str) {
		var options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
		(0, _assertString.default)(str);
		var testIssn = issn;
		testIssn = options.require_hyphen ? testIssn.replace("?", "") : testIssn;
		testIssn = options.case_sensitive ? new RegExp(testIssn) : new RegExp(testIssn, "i");
		if (!testIssn.test(str)) return false;
		var digits = str.replace("-", "").toUpperCase();
		var checksum = 0;
		for (var i = 0; i < digits.length; i++) {
			var digit = digits[i];
			checksum += (digit === "X" ? 10 : +digit) * (8 - i);
		}
		return checksum % 11 === 0;
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/util/algorithms.js
var require_algorithms = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.iso7064Check = iso7064Check;
	exports.luhnCheck = luhnCheck;
	exports.reverseMultiplyAndSum = reverseMultiplyAndSum;
	exports.verhoeffCheck = verhoeffCheck;
	/**
	* Algorithmic validation functions
	* May be used as is or implemented in the workflow of other validators.
	*/
	function iso7064Check(str) {
		var checkvalue = 10;
		for (var i = 0; i < str.length - 1; i++) checkvalue = (parseInt(str[i], 10) + checkvalue) % 10 === 0 ? 9 : (parseInt(str[i], 10) + checkvalue) % 10 * 2 % 11;
		checkvalue = checkvalue === 1 ? 0 : 11 - checkvalue;
		return checkvalue === parseInt(str[10], 10);
	}
	function luhnCheck(str) {
		var checksum = 0;
		var second = false;
		for (var i = str.length - 1; i >= 0; i--) {
			if (second) {
				var product = parseInt(str[i], 10) * 2;
				if (product > 9) checksum += product.toString().split("").map(function(a) {
					return parseInt(a, 10);
				}).reduce(function(a, b) {
					return a + b;
				}, 0);
				else checksum += product;
			} else checksum += parseInt(str[i], 10);
			second = !second;
		}
		return checksum % 10 === 0;
	}
	function reverseMultiplyAndSum(digits, base) {
		var total = 0;
		for (var i = 0; i < digits.length; i++) total += digits[i] * (base - i);
		return total;
	}
	function verhoeffCheck(str) {
		var d_table = [
			[
				0,
				1,
				2,
				3,
				4,
				5,
				6,
				7,
				8,
				9
			],
			[
				1,
				2,
				3,
				4,
				0,
				6,
				7,
				8,
				9,
				5
			],
			[
				2,
				3,
				4,
				0,
				1,
				7,
				8,
				9,
				5,
				6
			],
			[
				3,
				4,
				0,
				1,
				2,
				8,
				9,
				5,
				6,
				7
			],
			[
				4,
				0,
				1,
				2,
				3,
				9,
				5,
				6,
				7,
				8
			],
			[
				5,
				9,
				8,
				7,
				6,
				0,
				4,
				3,
				2,
				1
			],
			[
				6,
				5,
				9,
				8,
				7,
				1,
				0,
				4,
				3,
				2
			],
			[
				7,
				6,
				5,
				9,
				8,
				2,
				1,
				0,
				4,
				3
			],
			[
				8,
				7,
				6,
				5,
				9,
				3,
				2,
				1,
				0,
				4
			],
			[
				9,
				8,
				7,
				6,
				5,
				4,
				3,
				2,
				1,
				0
			]
		];
		var p_table = [
			[
				0,
				1,
				2,
				3,
				4,
				5,
				6,
				7,
				8,
				9
			],
			[
				1,
				5,
				7,
				6,
				2,
				8,
				3,
				0,
				9,
				4
			],
			[
				5,
				8,
				0,
				3,
				7,
				9,
				6,
				1,
				4,
				2
			],
			[
				8,
				9,
				1,
				6,
				0,
				4,
				3,
				5,
				2,
				7
			],
			[
				9,
				4,
				5,
				3,
				1,
				2,
				6,
				8,
				7,
				0
			],
			[
				4,
				2,
				8,
				6,
				5,
				7,
				3,
				9,
				0,
				1
			],
			[
				2,
				7,
				9,
				3,
				8,
				0,
				6,
				4,
				1,
				5
			],
			[
				7,
				0,
				4,
				6,
				9,
				1,
				3,
				2,
				5,
				8
			]
		];
		var str_copy = str.split("").reverse().join("");
		var checksum = 0;
		for (var i = 0; i < str_copy.length; i++) checksum = d_table[checksum][p_table[i % 8][parseInt(str_copy[i], 10)]];
		return checksum === 0;
	}
}));
// node_modules/validator/lib/isTaxID.js
var require_isTaxID = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	function _typeof(o) {
		"@babel/helpers - typeof";
		return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o) {
			return typeof o;
		} : function(o) {
			return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
		}, _typeof(o);
	}
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = isTaxID;
	var _assertString = _interopRequireDefault(require_assertString());
	var algorithms = _interopRequireWildcard(require_algorithms());
	var _isDate = _interopRequireDefault(require_isDate());
	function _interopRequireWildcard(e, t) {
		if ("function" == typeof WeakMap) var r = /* @__PURE__ */ new WeakMap(), n = /* @__PURE__ */ new WeakMap();
		return (_interopRequireWildcard = function _interopRequireWildcard(e, t) {
			if (!t && e && e.__esModule) return e;
			var o, i, f = {
				__proto__: null,
				default: e
			};
			if (null === e || "object" != _typeof(e) && "function" != typeof e) return f;
			if (o = t ? n : r) {
				if (o.has(e)) return o.get(e);
				o.set(e, f);
			}
			for (var _t in e) "default" !== _t && {}.hasOwnProperty.call(e, _t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, _t)) && (i.get || i.set) ? o(f, _t, i) : f[_t] = e[_t]);
			return f;
		})(e, t);
	}
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	function _toConsumableArray(r) {
		return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread();
	}
	function _nonIterableSpread() {
		throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
	}
	function _unsupportedIterableToArray(r, a) {
		if (r) {
			if ("string" == typeof r) return _arrayLikeToArray(r, a);
			var t = {}.toString.call(r).slice(8, -1);
			return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0;
		}
	}
	function _iterableToArray(r) {
		if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r);
	}
	function _arrayWithoutHoles(r) {
		if (Array.isArray(r)) return _arrayLikeToArray(r);
	}
	function _arrayLikeToArray(r, a) {
		(null == a || a > r.length) && (a = r.length);
		for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
		return n;
	}
	/**
	* TIN Validation
	* Validates Tax Identification Numbers (TINs) from the US, EU member states and the United Kingdom.
	*
	* EU-UK:
	* National TIN validity is calculated using public algorithms as made available by DG TAXUD.
	*
	* See `https://ec.europa.eu/taxation_customs/tin/specs/FS-TIN%20Algorithms-Public.docx` for more information.
	*
	* US:
	* An Employer Identification Number (EIN), also known as a Federal Tax Identification Number,
	*  is used to identify a business entity.
	*
	* NOTES:
	*  - Prefix 47 is being reserved for future use
	*  - Prefixes 26, 27, 45, 46 and 47 were previously assigned by the Philadelphia campus.
	*
	* See `http://www.irs.gov/Businesses/Small-Businesses-&-Self-Employed/How-EINs-are-Assigned-and-Valid-EIN-Prefixes`
	* for more information.
	*/
	function bgBgCheck(tin) {
		var century_year = tin.slice(0, 2);
		var month = parseInt(tin.slice(2, 4), 10);
		if (month > 40) {
			month -= 40;
			century_year = "20".concat(century_year);
		} else if (month > 20) {
			month -= 20;
			century_year = "18".concat(century_year);
		} else century_year = "19".concat(century_year);
		if (month < 10) month = "0".concat(month);
		var date = "".concat(century_year, "/").concat(month, "/").concat(tin.slice(4, 6));
		if (!(0, _isDate.default)(date, "YYYY/MM/DD")) return false;
		var digits = tin.split("").map(function(a) {
			return parseInt(a, 10);
		});
		var multip_lookup = [
			2,
			4,
			8,
			5,
			10,
			9,
			7,
			3,
			6
		];
		var checksum = 0;
		for (var i = 0; i < multip_lookup.length; i++) checksum += digits[i] * multip_lookup[i];
		checksum = checksum % 11 === 10 ? 0 : checksum % 11;
		return checksum === digits[9];
	}
	/**
	* Check if an input is a valid Canadian SIN (Social Insurance Number)
	*
	* The Social Insurance Number (SIN) is a 9 digit number that
	* you need to work in Canada or to have access to government programs and benefits.
	*
	* https://en.wikipedia.org/wiki/Social_Insurance_Number
	* https://www.canada.ca/en/employment-social-development/services/sin.html
	* https://www.codercrunch.com/challenge/819302488/sin-validator
	*
	* @param {string} input
	* @return {boolean}
	*/
	function isCanadianSIN(input) {
		var digitsArray = input.split("");
		var even = digitsArray.filter(function(_, idx) {
			return idx % 2;
		}).map(function(i) {
			return Number(i) * 2;
		}).join("").split("");
		return digitsArray.filter(function(_, idx) {
			return !(idx % 2);
		}).concat(even).map(function(i) {
			return Number(i);
		}).reduce(function(acc, cur) {
			return acc + cur;
		}) % 10 === 0;
	}
	function csCzCheck(tin) {
		tin = tin.replace(/\W/, "");
		var full_year = parseInt(tin.slice(0, 2), 10);
		if (tin.length === 10) {
			if (full_year < 54) full_year = "20".concat(full_year);
			else full_year = "19".concat(full_year);
		} else {
			if (tin.slice(6) === "000") return false;
			if (full_year < 54) full_year = "19".concat(full_year);
			else return false;
		}
		if (full_year.length === 3) full_year = [
			full_year.slice(0, 2),
			"0",
			full_year.slice(2)
		].join("");
		var month = parseInt(tin.slice(2, 4), 10);
		if (month > 50) month -= 50;
		if (month > 20) {
			if (parseInt(full_year, 10) < 2004) return false;
			month -= 20;
		}
		if (month < 10) month = "0".concat(month);
		var date = "".concat(full_year, "/").concat(month, "/").concat(tin.slice(4, 6));
		if (!(0, _isDate.default)(date, "YYYY/MM/DD")) return false;
		if (tin.length === 10) {
			if (parseInt(tin, 10) % 11 !== 0) {
				var checkdigit = parseInt(tin.slice(0, 9), 10) % 11;
				if (parseInt(full_year, 10) < 1986 && checkdigit === 10) {
					if (parseInt(tin.slice(9), 10) !== 0) return false;
				} else return false;
			}
		}
		return true;
	}
	function deAtCheck(tin) {
		return algorithms.luhnCheck(tin);
	}
	function deDeCheck(tin) {
		var digits = tin.split("").map(function(a) {
			return parseInt(a, 10);
		});
		var occurrences = [];
		for (var i = 0; i < digits.length - 1; i++) {
			occurrences.push("");
			for (var j = 0; j < digits.length - 1; j++) if (digits[i] === digits[j]) occurrences[i] += j;
		}
		occurrences = occurrences.filter(function(a) {
			return a.length > 1;
		});
		if (occurrences.length !== 2 && occurrences.length !== 3) return false;
		if (occurrences[0].length === 3) {
			var trip_locations = occurrences[0].split("").map(function(a) {
				return parseInt(a, 10);
			});
			var recurrent = 0;
			for (var _i = 0; _i < trip_locations.length - 1; _i++) if (trip_locations[_i] + 1 === trip_locations[_i + 1]) recurrent += 1;
			if (recurrent === 2) return false;
		}
		return algorithms.iso7064Check(tin);
	}
	function dkDkCheck(tin) {
		tin = tin.replace(/\W/, "");
		var year = parseInt(tin.slice(4, 6), 10);
		switch (tin.slice(6, 7)) {
			case "0":
			case "1":
			case "2":
			case "3":
				year = "19".concat(year);
				break;
			case "4":
			case "9":
				if (year < 37) year = "20".concat(year);
				else year = "19".concat(year);
				break;
			default: if (year < 37) year = "20".concat(year);
			else if (year > 58) year = "18".concat(year);
			else return false;
		}
		if (year.length === 3) year = [
			year.slice(0, 2),
			"0",
			year.slice(2)
		].join("");
		var date = "".concat(year, "/").concat(tin.slice(2, 4), "/").concat(tin.slice(0, 2));
		if (!(0, _isDate.default)(date, "YYYY/MM/DD")) return false;
		var digits = tin.split("").map(function(a) {
			return parseInt(a, 10);
		});
		var checksum = 0;
		var weight = 4;
		for (var i = 0; i < 9; i++) {
			checksum += digits[i] * weight;
			weight -= 1;
			if (weight === 1) weight = 7;
		}
		checksum %= 11;
		if (checksum === 1) return false;
		return checksum === 0 ? digits[9] === 0 : digits[9] === 11 - checksum;
	}
	function elCyCheck(tin) {
		var digits = tin.slice(0, 8).split("").map(function(a) {
			return parseInt(a, 10);
		});
		var checksum = 0;
		for (var i = 1; i < digits.length; i += 2) checksum += digits[i];
		for (var _i2 = 0; _i2 < digits.length; _i2 += 2) if (digits[_i2] < 2) checksum += 1 - digits[_i2];
		else {
			checksum += 2 * (digits[_i2] - 2) + 5;
			if (digits[_i2] > 4) checksum += 2;
		}
		return String.fromCharCode(checksum % 26 + 65) === tin.charAt(8);
	}
	function elGrCheck(tin) {
		var digits = tin.split("").map(function(a) {
			return parseInt(a, 10);
		});
		var checksum = 0;
		for (var i = 0; i < 8; i++) checksum += digits[i] * Math.pow(2, 8 - i);
		return checksum % 11 % 10 === digits[8];
	}
	function enIeCheck(tin) {
		var checksum = algorithms.reverseMultiplyAndSum(tin.split("").slice(0, 7).map(function(a) {
			return parseInt(a, 10);
		}), 8);
		if (tin.length === 9 && tin[8] !== "W") checksum += (tin[8].charCodeAt(0) - 64) * 9;
		checksum %= 23;
		if (checksum === 0) return tin[7].toUpperCase() === "W";
		return tin[7].toUpperCase() === String.fromCharCode(64 + checksum);
	}
	var enUsCampusPrefix = {
		andover: ["10", "12"],
		atlanta: ["60", "67"],
		austin: ["50", "53"],
		brookhaven: [
			"01",
			"02",
			"03",
			"04",
			"05",
			"06",
			"11",
			"13",
			"14",
			"16",
			"21",
			"22",
			"23",
			"25",
			"34",
			"51",
			"52",
			"54",
			"55",
			"56",
			"57",
			"58",
			"59",
			"65"
		],
		cincinnati: [
			"30",
			"32",
			"35",
			"36",
			"37",
			"38",
			"61"
		],
		fresno: ["15", "24"],
		internet: [
			"20",
			"26",
			"27",
			"45",
			"46",
			"47"
		],
		kansas: ["40", "44"],
		memphis: ["94", "95"],
		ogden: ["80", "90"],
		philadelphia: [
			"33",
			"39",
			"41",
			"42",
			"43",
			"46",
			"48",
			"62",
			"63",
			"64",
			"66",
			"68",
			"71",
			"72",
			"73",
			"74",
			"75",
			"76",
			"77",
			"81",
			"82",
			"83",
			"84",
			"85",
			"86",
			"87",
			"88",
			"91",
			"92",
			"93",
			"98",
			"99"
		],
		sba: ["31"]
	};
	function enUsGetPrefixes() {
		var prefixes = [];
		for (var location in enUsCampusPrefix)
 // istanbul ignore else
		if (enUsCampusPrefix.hasOwnProperty(location)) prefixes.push.apply(prefixes, _toConsumableArray(enUsCampusPrefix[location]));
		return prefixes;
	}
	function enUsCheck(tin) {
		return enUsGetPrefixes().indexOf(tin.slice(0, 2)) !== -1;
	}
	function esArCheck(tin) {
		var accum = 0;
		var digits = tin.split("");
		var digit = parseInt(digits.pop(), 10);
		for (var i = 0; i < digits.length; i++) accum += digits[9 - i] * (2 + i % 6);
		var verif = 11 - accum % 11;
		if (verif === 11) verif = 0;
		else if (verif === 10) verif = 9;
		return digit === verif;
	}
	function esEsCheck(tin) {
		var chars = tin.toUpperCase().split("");
		if (isNaN(parseInt(chars[0], 10)) && chars.length > 1) {
			var lead_replace = 0;
			switch (chars[0]) {
				case "Y":
					lead_replace = 1;
					break;
				case "Z": lead_replace = 2;
			}
			chars.splice(0, 1, lead_replace);
		} else while (chars.length < 9) chars.unshift(0);
		var lookup = [
			"T",
			"R",
			"W",
			"A",
			"G",
			"M",
			"Y",
			"F",
			"P",
			"D",
			"X",
			"B",
			"N",
			"J",
			"Z",
			"S",
			"Q",
			"V",
			"H",
			"L",
			"C",
			"K",
			"E"
		];
		chars = chars.join("");
		var checksum = parseInt(chars.slice(0, 8), 10) % 23;
		return chars[8] === lookup[checksum];
	}
	function etEeCheck(tin) {
		var full_year = tin.slice(1, 3);
		switch (tin.slice(0, 1)) {
			case "1":
			case "2":
				full_year = "18".concat(full_year);
				break;
			case "3":
			case "4":
				full_year = "19".concat(full_year);
				break;
			default: full_year = "20".concat(full_year);
		}
		var date = "".concat(full_year, "/").concat(tin.slice(3, 5), "/").concat(tin.slice(5, 7));
		if (!(0, _isDate.default)(date, "YYYY/MM/DD")) return false;
		var digits = tin.split("").map(function(a) {
			return parseInt(a, 10);
		});
		var checksum = 0;
		var weight = 1;
		for (var i = 0; i < 10; i++) {
			checksum += digits[i] * weight;
			weight += 1;
			if (weight === 10) weight = 1;
		}
		if (checksum % 11 === 10) {
			checksum = 0;
			weight = 3;
			for (var _i3 = 0; _i3 < 10; _i3++) {
				checksum += digits[_i3] * weight;
				weight += 1;
				if (weight === 10) weight = 1;
			}
			if (checksum % 11 === 10) return digits[10] === 0;
		}
		return checksum % 11 === digits[10];
	}
	function fiFiCheck(tin) {
		var full_year = tin.slice(4, 6);
		switch (tin.slice(6, 7)) {
			case "+":
				full_year = "18".concat(full_year);
				break;
			case "-":
				full_year = "19".concat(full_year);
				break;
			default: full_year = "20".concat(full_year);
		}
		var date = "".concat(full_year, "/").concat(tin.slice(2, 4), "/").concat(tin.slice(0, 2));
		if (!(0, _isDate.default)(date, "YYYY/MM/DD")) return false;
		var checksum = parseInt(tin.slice(0, 6) + tin.slice(7, 10), 10) % 31;
		if (checksum < 10) return checksum === parseInt(tin.slice(10), 10);
		checksum -= 10;
		return [
			"A",
			"B",
			"C",
			"D",
			"E",
			"F",
			"H",
			"J",
			"K",
			"L",
			"M",
			"N",
			"P",
			"R",
			"S",
			"T",
			"U",
			"V",
			"W",
			"X",
			"Y"
		][checksum] === tin.slice(10);
	}
	function frBeCheck(tin) {
		if (tin.slice(2, 4) !== "00" || tin.slice(4, 6) !== "00") {
			var date = "".concat(tin.slice(0, 2), "/").concat(tin.slice(2, 4), "/").concat(tin.slice(4, 6));
			if (!(0, _isDate.default)(date, "YY/MM/DD")) return false;
		}
		var checksum = 97 - parseInt(tin.slice(0, 9), 10) % 97;
		var checkdigits = parseInt(tin.slice(9, 11), 10);
		if (checksum !== checkdigits) {
			checksum = 97 - parseInt("2".concat(tin.slice(0, 9)), 10) % 97;
			if (checksum !== checkdigits) return false;
		}
		return true;
	}
	function frFrCheck(tin) {
		tin = tin.replace(/\s/g, "");
		return parseInt(tin.slice(0, 10), 10) % 511 === parseInt(tin.slice(10, 13), 10);
	}
	function frLuCheck(tin) {
		var date = "".concat(tin.slice(0, 4), "/").concat(tin.slice(4, 6), "/").concat(tin.slice(6, 8));
		if (!(0, _isDate.default)(date, "YYYY/MM/DD")) return false;
		if (!algorithms.luhnCheck(tin.slice(0, 12))) return false;
		return algorithms.verhoeffCheck("".concat(tin.slice(0, 11)).concat(tin[12]));
	}
	function hrHrCheck(tin) {
		return algorithms.iso7064Check(tin);
	}
	function huHuCheck(tin) {
		var digits = tin.split("").map(function(a) {
			return parseInt(a, 10);
		});
		var checksum = 8;
		for (var i = 1; i < 9; i++) checksum += digits[i] * (i + 1);
		return checksum % 11 === digits[9];
	}
	function itItNameCheck(name) {
		var vowelflag = false;
		var xflag = false;
		for (var i = 0; i < 3; i++) if (!vowelflag && /[AEIOU]/.test(name[i])) vowelflag = true;
		else if (!xflag && vowelflag && name[i] === "X") xflag = true;
		else if (i > 0) {
			if (vowelflag && !xflag) {
				if (!/[AEIOU]/.test(name[i])) return false;
			}
			if (xflag) {
				if (!/X/.test(name[i])) return false;
			}
		}
		return true;
	}
	function itItCheck(tin) {
		var chars = tin.toUpperCase().split("");
		if (!itItNameCheck(chars.slice(0, 3))) return false;
		if (!itItNameCheck(chars.slice(3, 6))) return false;
		var number_locations = [
			6,
			7,
			9,
			10,
			12,
			13,
			14
		];
		var number_replace = {
			L: "0",
			M: "1",
			N: "2",
			P: "3",
			Q: "4",
			R: "5",
			S: "6",
			T: "7",
			U: "8",
			V: "9"
		};
		for (var _i4 = 0, _number_locations = number_locations; _i4 < _number_locations.length; _i4++) {
			var i = _number_locations[_i4];
			if (chars[i] in number_replace) chars.splice(i, 1, number_replace[chars[i]]);
		}
		var month = {
			A: "01",
			B: "02",
			C: "03",
			D: "04",
			E: "05",
			H: "06",
			L: "07",
			M: "08",
			P: "09",
			R: "10",
			S: "11",
			T: "12"
		}[chars[8]];
		var day = parseInt(chars[9] + chars[10], 10);
		if (day > 40) day -= 40;
		if (day < 10) day = "0".concat(day);
		var date = "".concat(chars[6]).concat(chars[7], "/").concat(month, "/").concat(day);
		if (!(0, _isDate.default)(date, "YY/MM/DD")) return false;
		var checksum = 0;
		for (var _i5 = 1; _i5 < chars.length - 1; _i5 += 2) {
			var char_to_int = parseInt(chars[_i5], 10);
			if (isNaN(char_to_int)) char_to_int = chars[_i5].charCodeAt(0) - 65;
			checksum += char_to_int;
		}
		var odd_convert = {
			A: 1,
			B: 0,
			C: 5,
			D: 7,
			E: 9,
			F: 13,
			G: 15,
			H: 17,
			I: 19,
			J: 21,
			K: 2,
			L: 4,
			M: 18,
			N: 20,
			O: 11,
			P: 3,
			Q: 6,
			R: 8,
			S: 12,
			T: 14,
			U: 16,
			V: 10,
			W: 22,
			X: 25,
			Y: 24,
			Z: 23,
			0: 1,
			1: 0
		};
		for (var _i6 = 0; _i6 < chars.length - 1; _i6 += 2) {
			var _char_to_int = 0;
			if (chars[_i6] in odd_convert) _char_to_int = odd_convert[chars[_i6]];
			else {
				var multiplier = parseInt(chars[_i6], 10);
				_char_to_int = 2 * multiplier + 1;
				if (multiplier > 4) _char_to_int += 2;
			}
			checksum += _char_to_int;
		}
		if (String.fromCharCode(65 + checksum % 26) !== chars[15]) return false;
		return true;
	}
	function lvLvCheck(tin) {
		tin = tin.replace(/\W/, "");
		var day = tin.slice(0, 2);
		if (day !== "32") {
			if (tin.slice(2, 4) !== "00") {
				var full_year = tin.slice(4, 6);
				switch (tin[6]) {
					case "0":
						full_year = "18".concat(full_year);
						break;
					case "1":
						full_year = "19".concat(full_year);
						break;
					default: full_year = "20".concat(full_year);
				}
				var date = "".concat(full_year, "/").concat(tin.slice(2, 4), "/").concat(day);
				if (!(0, _isDate.default)(date, "YYYY/MM/DD")) return false;
			}
			var checksum = 1101;
			var multip_lookup = [
				1,
				6,
				3,
				7,
				9,
				10,
				5,
				8,
				4,
				2
			];
			for (var i = 0; i < tin.length - 1; i++) checksum -= parseInt(tin[i], 10) * multip_lookup[i];
			return parseInt(tin[10], 10) === checksum % 11;
		}
		return true;
	}
	function mtMtCheck(tin) {
		if (tin.length !== 9) {
			var chars = tin.toUpperCase().split("");
			while (chars.length < 8) chars.unshift(0);
			switch (tin[7]) {
				case "A":
				case "P":
					if (parseInt(chars[6], 10) === 0) return false;
					break;
				default:
					var first_part = parseInt(chars.join("").slice(0, 5), 10);
					if (first_part > 32e3) return false;
					if (first_part === parseInt(chars.join("").slice(5, 7), 10)) return false;
			}
		}
		return true;
	}
	function nlNlCheck(tin) {
		return algorithms.reverseMultiplyAndSum(tin.split("").slice(0, 8).map(function(a) {
			return parseInt(a, 10);
		}), 9) % 11 === parseInt(tin[8], 10);
	}
	function plPlCheck(tin) {
		if (tin.length === 10) {
			var lookup = [
				6,
				5,
				7,
				2,
				3,
				4,
				5,
				6,
				7
			];
			var _checksum = 0;
			for (var i = 0; i < lookup.length; i++) _checksum += parseInt(tin[i], 10) * lookup[i];
			_checksum %= 11;
			if (_checksum === 10) return false;
			return _checksum === parseInt(tin[9], 10);
		}
		var full_year = tin.slice(0, 2);
		var month = parseInt(tin.slice(2, 4), 10);
		if (month > 80) {
			full_year = "18".concat(full_year);
			month -= 80;
		} else if (month > 60) {
			full_year = "22".concat(full_year);
			month -= 60;
		} else if (month > 40) {
			full_year = "21".concat(full_year);
			month -= 40;
		} else if (month > 20) {
			full_year = "20".concat(full_year);
			month -= 20;
		} else full_year = "19".concat(full_year);
		if (month < 10) month = "0".concat(month);
		var date = "".concat(full_year, "/").concat(month, "/").concat(tin.slice(4, 6));
		if (!(0, _isDate.default)(date, "YYYY/MM/DD")) return false;
		var checksum = 0;
		var multiplier = 1;
		for (var _i7 = 0; _i7 < tin.length - 1; _i7++) {
			checksum += parseInt(tin[_i7], 10) * multiplier % 10;
			multiplier += 2;
			if (multiplier > 10) multiplier = 1;
			else if (multiplier === 5) multiplier += 2;
		}
		checksum = 10 - checksum % 10;
		return checksum === parseInt(tin[10], 10);
	}
	/**
	* Convert a CNPJ character to its numeric value for check digit calculation.
	* Numbers 0-9 map to values 0-9, letters A-Z map to values 17-42.
	* This is done by subtracting 48 from the ASCII code.
	*/
	function cnpjCharToValue(char) {
		return char.charCodeAt(0) - 48;
	}
	/**
	* Validate CNPJ (both numeric and alphanumeric formats).
	* Algorithm: module 11 with weights 2-9 from right to left.
	*/
	function validateCnpj(cnpj) {
		var identifiers = cnpj.substring(0, 12).toUpperCase();
		var checkDigits = cnpj.substring(12);
		if (/^(.)\1+$/.test(cnpj.toUpperCase())) return false;
		var sum = 0;
		var weight = 5;
		for (var i = 0; i < 12; i++) {
			sum += cnpjCharToValue(identifiers.charAt(i)) * weight;
			weight = weight === 2 ? 9 : weight - 1;
		}
		var remainder = sum % 11;
		var firstDV = remainder < 2 ? 0 : 11 - remainder;
		if (firstDV !== parseInt(checkDigits.charAt(0), 10)) return false;
		sum = 0;
		weight = 6;
		for (var _i8 = 0; _i8 < 12; _i8++) {
			sum += cnpjCharToValue(identifiers.charAt(_i8)) * weight;
			weight = weight === 2 ? 9 : weight - 1;
		}
		sum += firstDV * 2;
		remainder = sum % 11;
		return (remainder < 2 ? 0 : 11 - remainder) === parseInt(checkDigits.charAt(1), 10);
	}
	function ptBrCheck(tin) {
		tin = tin.replace(/[.\-/]/g, "");
		if (tin.length === 11) {
			var sum;
			var remainder;
			sum = 0;
			if (tin === "11111111111" || tin === "22222222222" || tin === "33333333333" || tin === "44444444444" || tin === "55555555555" || tin === "66666666666" || tin === "77777777777" || tin === "88888888888" || tin === "99999999999" || tin === "00000000000") return false;
			for (var i = 1; i <= 9; i++) sum += parseInt(tin.substring(i - 1, i), 10) * (11 - i);
			remainder = sum * 10 % 11;
			if (remainder === 10) remainder = 0;
			if (remainder !== parseInt(tin.substring(9, 10), 10)) return false;
			sum = 0;
			for (var _i9 = 1; _i9 <= 10; _i9++) sum += parseInt(tin.substring(_i9 - 1, _i9), 10) * (12 - _i9);
			remainder = sum * 10 % 11;
			if (remainder === 10) remainder = 0;
			if (remainder !== parseInt(tin.substring(10, 11), 10)) return false;
			return true;
		}
		return validateCnpj(tin);
	}
	function ptPtCheck(tin) {
		var checksum = 11 - algorithms.reverseMultiplyAndSum(tin.split("").slice(0, 8).map(function(a) {
			return parseInt(a, 10);
		}), 9) % 11;
		if (checksum > 9) return parseInt(tin[8], 10) === 0;
		return checksum === parseInt(tin[8], 10);
	}
	function roRoCheck(tin) {
		if (tin.slice(0, 4) !== "9000") {
			var full_year = tin.slice(1, 3);
			switch (tin[0]) {
				case "1":
				case "2":
					full_year = "19".concat(full_year);
					break;
				case "3":
				case "4":
					full_year = "18".concat(full_year);
					break;
				case "5":
				case "6": full_year = "20".concat(full_year);
			}
			var date = "".concat(full_year, "/").concat(tin.slice(3, 5), "/").concat(tin.slice(5, 7));
			if (date.length === 8) {
				if (!(0, _isDate.default)(date, "YY/MM/DD")) return false;
			} else if (!(0, _isDate.default)(date, "YYYY/MM/DD")) return false;
			var digits = tin.split("").map(function(a) {
				return parseInt(a, 10);
			});
			var multipliers = [
				2,
				7,
				9,
				1,
				4,
				6,
				3,
				5,
				8,
				2,
				7,
				9
			];
			var checksum = 0;
			for (var i = 0; i < multipliers.length; i++) checksum += digits[i] * multipliers[i];
			if (checksum % 11 === 10) return digits[12] === 1;
			return digits[12] === checksum % 11;
		}
		return true;
	}
	function skSkCheck(tin) {
		if (tin.length === 9) {
			tin = tin.replace(/\W/, "");
			if (tin.slice(6) === "000") return false;
			var full_year = parseInt(tin.slice(0, 2), 10);
			if (full_year > 53) return false;
			if (full_year < 10) full_year = "190".concat(full_year);
			else full_year = "19".concat(full_year);
			var month = parseInt(tin.slice(2, 4), 10);
			if (month > 50) month -= 50;
			if (month < 10) month = "0".concat(month);
			var date = "".concat(full_year, "/").concat(month, "/").concat(tin.slice(4, 6));
			if (!(0, _isDate.default)(date, "YYYY/MM/DD")) return false;
		}
		return true;
	}
	function slSiCheck(tin) {
		var checksum = 11 - algorithms.reverseMultiplyAndSum(tin.split("").slice(0, 7).map(function(a) {
			return parseInt(a, 10);
		}), 8) % 11;
		if (checksum === 10) return parseInt(tin[7], 10) === 0;
		return checksum === parseInt(tin[7], 10);
	}
	function svSeCheck(tin) {
		var tin_copy = tin.slice(0);
		if (tin.length > 11) tin_copy = tin_copy.slice(2);
		var full_year = "";
		var month = tin_copy.slice(2, 4);
		var day = parseInt(tin_copy.slice(4, 6), 10);
		if (tin.length > 11) full_year = tin.slice(0, 4);
		else {
			full_year = tin.slice(0, 2);
			if (tin.length === 11 && day < 60) {
				var current_year = (/* @__PURE__ */ new Date()).getFullYear().toString();
				var current_century = parseInt(current_year.slice(0, 2), 10);
				current_year = parseInt(current_year, 10);
				if (tin[6] === "-") {
					if (parseInt("".concat(current_century).concat(full_year), 10) > current_year) full_year = "".concat(current_century - 1).concat(full_year);
					else full_year = "".concat(current_century).concat(full_year);
				} else {
					full_year = "".concat(current_century - 1).concat(full_year);
					if (current_year - parseInt(full_year, 10) < 100) return false;
				}
			}
		}
		if (day > 60) day -= 60;
		if (day < 10) day = "0".concat(day);
		var date = "".concat(full_year, "/").concat(month, "/").concat(day);
		if (date.length === 8) {
			if (!(0, _isDate.default)(date, "YY/MM/DD")) return false;
		} else if (!(0, _isDate.default)(date, "YYYY/MM/DD")) return false;
		return algorithms.luhnCheck(tin.replace(/\W/, ""));
	}
	/**
	* uk-UA validation function
	* Verify TIN validity by calculating check (last) digit (variant of MOD 11)
	*/
	function ukUaCheck(tin) {
		var digits = tin.split("").map(function(a) {
			return parseInt(a, 10);
		});
		var multipliers = [
			-1,
			5,
			7,
			9,
			4,
			6,
			10,
			5,
			7
		];
		var checksum = 0;
		for (var i = 0; i < multipliers.length; i++) checksum += digits[i] * multipliers[i];
		return checksum % 11 === 10 ? digits[9] === 0 : digits[9] === checksum % 11;
	}
	var taxIdFormat = {
		"bg-BG": /^\d{10}$/,
		"cs-CZ": /^\d{6}\/{0,1}\d{3,4}$/,
		"de-AT": /^\d{9}$/,
		"de-DE": /^[1-9]\d{10}$/,
		"dk-DK": /^\d{6}-{0,1}\d{4}$/,
		"el-CY": /^[09]\d{7}[A-Z]$/,
		"el-GR": /^([0-4]|[7-9])\d{8}$/,
		"en-CA": /^\d{9}$/,
		"en-GB": /^\d{10}$|^(?!GB|NK|TN|ZZ)(?![DFIQUV])[A-Z](?![DFIQUVO])[A-Z]\d{6}[ABCD ]$/i,
		"en-IE": /^\d{7}[A-W][A-IW]{0,1}$/i,
		"en-US": /^\d{2}[- ]{0,1}\d{7}$/,
		"es-AR": /(20|23|24|27|30|33|34)[0-9]{8}[0-9]/,
		"es-ES": /^(\d{0,8}|[XYZKLM]\d{7})[A-HJ-NP-TV-Z]$/i,
		"et-EE": /^[1-6]\d{6}(00[1-9]|0[1-9][0-9]|[1-6][0-9]{2}|70[0-9]|710)\d$/,
		"fi-FI": /^\d{6}[-+A]\d{3}[0-9A-FHJ-NPR-Y]$/i,
		"fr-BE": /^\d{11}$/,
		"fr-FR": /^[0-3]\d{12}$|^[0-3]\d\s\d{2}(\s\d{3}){3}$/,
		"fr-LU": /^\d{13}$/,
		"hr-HR": /^\d{11}$/,
		"hu-HU": /^8\d{9}$/,
		"it-IT": /^[A-Z]{6}[L-NP-V0-9]{2}[A-EHLMPRST][L-NP-V0-9]{2}[A-ILMZ][L-NP-V0-9]{3}[A-Z]$/i,
		"lv-LV": /^\d{6}-{0,1}\d{5}$/,
		"mt-MT": /^\d{3,7}[APMGLHBZ]$|^([1-8])\1\d{7}$/i,
		"nl-NL": /^\d{9}$/,
		"pl-PL": /^\d{10,11}$/,
		"pt-BR": /(?:^\d{3}\.\d{3}\.\d{3}-\d{2}$)|(?:^\d{11}$)|(?:^[A-Z0-9]{12}\d{2}$)/i,
		"pt-PT": /^\d{9}$/,
		"ro-RO": /^\d{13}$/,
		"sk-SK": /^\d{6}\/{0,1}\d{3,4}$/,
		"sl-SI": /^[1-9]\d{7}$/,
		"sv-SE": /^(\d{6}[-+]{0,1}\d{4}|(18|19|20)\d{6}[-+]{0,1}\d{4})$/,
		"uk-UA": /^\d{10}$/
	};
	taxIdFormat["lb-LU"] = taxIdFormat["fr-LU"];
	taxIdFormat["lt-LT"] = taxIdFormat["et-EE"];
	taxIdFormat["nl-BE"] = taxIdFormat["fr-BE"];
	taxIdFormat["fr-CA"] = taxIdFormat["en-CA"];
	var taxIdCheck = {
		"bg-BG": bgBgCheck,
		"cs-CZ": csCzCheck,
		"de-AT": deAtCheck,
		"de-DE": deDeCheck,
		"dk-DK": dkDkCheck,
		"el-CY": elCyCheck,
		"el-GR": elGrCheck,
		"en-CA": isCanadianSIN,
		"en-IE": enIeCheck,
		"en-US": enUsCheck,
		"es-AR": esArCheck,
		"es-ES": esEsCheck,
		"et-EE": etEeCheck,
		"fi-FI": fiFiCheck,
		"fr-BE": frBeCheck,
		"fr-FR": frFrCheck,
		"fr-LU": frLuCheck,
		"hr-HR": hrHrCheck,
		"hu-HU": huHuCheck,
		"it-IT": itItCheck,
		"lv-LV": lvLvCheck,
		"mt-MT": mtMtCheck,
		"nl-NL": nlNlCheck,
		"pl-PL": plPlCheck,
		"pt-BR": ptBrCheck,
		"pt-PT": ptPtCheck,
		"ro-RO": roRoCheck,
		"sk-SK": skSkCheck,
		"sl-SI": slSiCheck,
		"sv-SE": svSeCheck,
		"uk-UA": ukUaCheck
	};
	taxIdCheck["lb-LU"] = taxIdCheck["fr-LU"];
	taxIdCheck["lt-LT"] = taxIdCheck["et-EE"];
	taxIdCheck["nl-BE"] = taxIdCheck["fr-BE"];
	taxIdCheck["fr-CA"] = taxIdCheck["en-CA"];
	var allsymbols = /[-\\\/!@#$%\^&\*\(\)\+\=\[\]]+/g;
	var sanitizeRegexes = {
		"de-AT": allsymbols,
		"de-DE": /[\/\\]/g,
		"fr-BE": allsymbols
	};
	sanitizeRegexes["nl-BE"] = sanitizeRegexes["fr-BE"];
	function isTaxID(str) {
		var locale = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "en-US";
		(0, _assertString.default)(str);
		var strcopy = str.slice(0);
		if (locale in taxIdFormat) {
			if (locale in sanitizeRegexes) strcopy = strcopy.replace(sanitizeRegexes[locale], "");
			if (!taxIdFormat[locale].test(strcopy)) return false;
			if (locale in taxIdCheck) return taxIdCheck[locale](strcopy);
			return true;
		}
		throw new Error("Invalid locale '".concat(locale, "'"));
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/isMobilePhone.js
var require_isMobilePhone = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = isMobilePhone;
	exports.locales = void 0;
	var _assertString = _interopRequireDefault(require_assertString());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	var phones = {
		"am-AM": /^(\+?374|0)(33|4[134]|55|77|88|9[13-689])\d{6}$/,
		"ar-AE": /^((\+?971)|0)?5[024568]\d{7}$/,
		"ar-BH": /^(\+?973)?(3|6)\d{7}$/,
		"ar-DZ": /^(\+?213|0)(5|6|7)\d{8}$/,
		"ar-LB": /^(\+?961)?((3|81)\d{6}|7\d{7})$/,
		"ar-EG": /^((\+?20)|0)?1[0125]\d{8}$/,
		"ar-IQ": /^(\+?964|0)?7[0-9]\d{8}$/,
		"ar-JO": /^(\+?962|0)?7[789]\d{7}$/,
		"ar-KW": /^(\+?965)([569]\d{7}|41\d{6})$/,
		"ar-LY": /^((\+?218)|0)?(9[1-6]\d{7}|[1-8]\d{7,9})$/,
		"ar-MA": /^(?:(?:\+|00)212|0)[5-7]\d{8}$/,
		"ar-OM": /^((\+|00)968)?([79][1-9])\d{6}$/,
		"ar-PS": /^(\+?970|0)5[6|9](\d{7})$/,
		"ar-SA": /^(!?(\+?966)|0)?5\d{8}$/,
		"ar-SD": /^((\+?249)|0)?(9[012369]|1[012])\d{7}$/,
		"ar-SY": /^(!?(\+?963)|0)?9\d{8}$/,
		"ar-TN": /^(\+?216)?[2459]\d{7}$/,
		"az-AZ": /^(\+994|0)(10|5[015]|7[07]|99)\d{7}$/,
		"ar-QA": /^(\+?974|0)?([3567]\d{7})$/,
		"bs-BA": /^((((\+|00)3876)|06))((([0-3]|[5-6])\d{6})|(4\d{7}))$/,
		"be-BY": /^(\+?375)?(24|25|29|33|44)\d{7}$/,
		"bg-BG": /^(\+?359|0)?8[789]\d{7}$/,
		"bn-BD": /^(\+?880|0)1[13456789][0-9]{8}$/,
		"ca-AD": /^(\+376)?[346]\d{5}$/,
		"cs-CZ": /^(\+?420)? ?[1-9][0-9]{2} ?[0-9]{3} ?[0-9]{3}$/,
		"da-DK": /^(\+?45)?\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{2}$/,
		"de-DE": /^((\+49|0)1)(5[0-25-9]\d|6([23]|0\d?)|7([0-57-9]|6\d))\d{7,9}$/,
		"de-AT": /^(\+43|0)\d{1,4}\d{3,12}$/,
		"de-CH": /^(\+41|0)([1-9])\d{1,9}$/,
		"de-LU": /^(\+352)?((6\d1)\d{6})$/,
		"dv-MV": /^(\+?960)?(7[2-9]|9[1-9])\d{5}$/,
		"el-GR": /^(\+?30|0)?6(8[5-9]|9(?![26])[0-9])\d{7}$/,
		"el-CY": /^(\+?357?)?(9(9|7|6|5|4)\d{6})$/,
		"en-AI": /^(\+?1|0)264(?:2(35|92)|4(?:6[1-2]|76|97)|5(?:3[6-9]|8[1-4])|7(?:2(4|9)|72))\d{4}$/,
		"en-AU": /^(\+?61|0)4\d{8}$/,
		"en-AG": /^(?:\+1|1)268(?:464|7(?:1[3-9]|[28]\d|3[0246]|64|7[0-689]))\d{4}$/,
		"en-BM": /^(\+?1)?441(((3|7)\d{6}$)|(5[0-3][0-9]\d{4}$)|(59\d{5}$))/,
		"en-BS": /^(\+?1[-\s]?|0)?\(?242\)?[-\s]?\d{3}[-\s]?\d{4}$/,
		"en-GB": /^(\+?44|0)7[1-9]\d{8}$/,
		"en-GG": /^(\+?44|0)1481\d{6}$/,
		"en-GH": /^(\+233|0)(20|50|24|54|27|57|26|56|23|53|28|55|59)\d{7}$/,
		"en-GY": /^(\+592|0)6\d{6}$/,
		"en-HK": /^(\+?852[-\s]?)?[456789]\d{3}[-\s]?\d{4}$/,
		"en-MO": /^(\+?853[-\s]?)?[6]\d{3}[-\s]?\d{4}$/,
		"en-IE": /^(\+?353|0)8[356789]\d{7}$/,
		"en-IN": /^(\+?91|0)?[6789]\d{9}$/,
		"en-JM": /^(\+?876)?\d{7}$/,
		"en-KE": /^(\+?254|0)(7|1)\d{8}$/,
		"fr-CF": /^(\+?236| ?)(70|75|77|72|21|22)\d{6}$/,
		"en-SS": /^(\+?211|0)(9[1257])\d{7}$/,
		"en-KI": /^((\+686|686)?)?( )?((6|7)(2|3|8)[0-9]{6})$/,
		"en-KN": /^(?:\+1|1)869(?:46\d|48[89]|55[6-8]|66\d|76[02-7])\d{4}$/,
		"en-LS": /^(\+?266)(22|28|57|58|59|27|52)\d{6}$/,
		"en-MT": /^(\+?356|0)?(99|79|77|21|27|22|25)[0-9]{6}$/,
		"en-MU": /^(\+?230|0)?\d{8}$/,
		"en-MW": /^(\+?265|0)(((77|88|31|99|98|21)\d{7})|(((111)|1)\d{6})|(32000\d{4}))$/,
		"en-NA": /^(\+?264|0)(6|8)\d{7}$/,
		"en-NG": /^(\+?234|0)?[789]\d{9}$/,
		"en-NZ": /^(\+?64|0)[28]\d{7,9}$/,
		"en-PG": /^(\+?675|0)?(7\d|8[18])\d{6}$/,
		"en-PK": /^((00|\+)?92|0)3[0-6]\d{8}$/,
		"en-PH": /^(09|\+639)\d{9}$/,
		"en-RW": /^(\+?250|0)?[7]\d{8}$/,
		"en-SG": /^(\+65)?[3689]\d{7}$/,
		"en-SL": /^(\+?232|0)\d{8}$/,
		"en-TZ": /^(\+?255|0)?[67]\d{8}$/,
		"en-UG": /^(\+?256|0)?[7]\d{8}$/,
		"en-US": /^((\+1|1)?( |-)?)?(\([2-9][0-9]{2}\)|[2-9][0-9]{2})( |-)?([2-9][0-9]{2}( |-)?[0-9]{4})$/,
		"en-ZA": /^(\+?27|0)\d{9}$/,
		"en-ZM": /^(\+?26)?0[79][567]\d{7}$/,
		"en-ZW": /^(\+263)[0-9]{9}$/,
		"en-BW": /^(\+?267)?(7[1-8]{1})\d{6}$/,
		"es-AR": /^\+?549(11|[2368]\d)\d{8}$/,
		"es-BO": /^(\+?591)?(6|7)\d{7}$/,
		"es-CO": /^(\+?57)?3(0(0|1|2|4|5)|1\d|2[0-4]|5(0|1))\d{7}$/,
		"es-CL": /^(\+?56|0)[2-9]\d{1}\d{7}$/,
		"es-CR": /^(\+506)?[2-8]\d{7}$/,
		"es-CU": /^(\+53|0053)?5\d{7}$/,
		"es-DO": /^(\+?1)?8[024]9\d{7}$/,
		"es-HN": /^(\+?504)?[9|8|3|2]\d{7}$/,
		"es-EC": /^(\+?593|0)([2-7]|9[2-9])\d{7}$/,
		"es-ES": /^(\+?34)?[6|7]\d{8}$/,
		"es-GT": /^(\+?502)?[2|6|7]\d{7}$/,
		"es-PE": /^(\+?51)?9\d{8}$/,
		"es-MX": /^(\+?52)?(1|01)?\d{10,11}$/,
		"es-NI": /^(\+?505)\d{7,8}$/,
		"es-PA": /^(\+?507)\d{7,8}$/,
		"es-PY": /^(\+?595|0)9[9876]\d{7}$/,
		"es-SV": /^(\+?503)?[67]\d{7}$/,
		"es-UY": /^(\+598|0)9[1-9][\d]{6}$/,
		"es-VE": /^(\+?58)?(2|4)\d{9}$/,
		"et-EE": /^(\+?372)?\s?(5|8[1-4])\s?([0-9]\s?){6,7}$/,
		"fa-IR": /^(\+?98[\-\s]?|0)9[0-39]\d[\-\s]?\d{3}[\-\s]?\d{4}$/,
		"fi-FI": /^(\+?358|0)\s?(4[0-6]|50)\s?(\d\s?){4,8}$/,
		"fj-FJ": /^(\+?679)?\s?\d{3}\s?\d{4}$/,
		"fo-FO": /^(\+?298)?\s?\d{2}\s?\d{2}\s?\d{2}$/,
		"fr-BF": /^(\+226|0)[67]\d{7}$/,
		"fr-BJ": /^(\+229)\d{8}$/,
		"fr-CD": /^(\+?243|0)?(8|9)\d{8}$/,
		"fr-CM": /^(\+?237)6[0-9]{8}$/,
		"fr-DJ": /^(?:\+253)?77[6-8]\d{5}$/,
		"fr-FR": /^(\+?33|0)[67]\d{8}$/,
		"fr-GF": /^(\+?594|0|00594)[67]\d{8}$/,
		"fr-GP": /^(\+?590|0|00590)[67]\d{8}$/,
		"fr-MQ": /^(\+?596|0|00596)[67]\d{8}$/,
		"fr-PF": /^(\+?689)?8[789]\d{6}$/,
		"fr-RE": /^(\+?262|0|00262)[67]\d{8}$/,
		"fr-WF": /^(\+681)?\d{6}$/,
		"he-IL": /^(\+972|0)([23489]|5[012345689]|77)[1-9]\d{6}$/,
		"hu-HU": /^(\+?36|06)(20|30|31|50|70)\d{7}$/,
		"id-ID": /^(\+?62|0)8(1[123456789]|2[1238]|3[1238]|5[12356789]|7[78]|9[56789]|8[123456789])([\s?|\d]{5,11})$/,
		"ir-IR": /^(\+98|0)?9\d{9}$/,
		"it-IT": /^(\+?39)?\s?3\d{2} ?\d{6,7}$/,
		"it-SM": /^((\+378)|(0549)|(\+390549)|(\+3780549))?6\d{5,9}$/,
		"ja-JP": /^(\+81[ \-]?(\(0\))?|0)[6789]0[ \-]?\d{4}[ \-]?\d{4}$/,
		"ka-GE": /^(\+?995)?(79\d{7}|5\d{8})$/,
		"kk-KZ": /^(\+?7|8)?7\d{9}$/,
		"kl-GL": /^(\+?299)?\s?\d{2}\s?\d{2}\s?\d{2}$/,
		"ko-KR": /^((\+?82)[ \-]?)?0?1([0|1|6|7|8|9]{1})[ \-]?\d{3,4}[ \-]?\d{4}$/,
		"ky-KG": /^(\+996\s?)?(22[0-9]|50[0-9]|55[0-9]|70[0-9]|75[0-9]|77[0-9]|880|990|995|996|997|998)\s?\d{3}\s?\d{3}$/,
		"lt-LT": /^(\+370|8)\d{8}$/,
		"lv-LV": /^(\+?371)2\d{7}$/,
		"mg-MG": /^((\+?261|0)(2|3)\d)?\d{7}$/,
		"mn-MN": /^(\+|00|011)?976(77|81|88|91|94|95|96|99)\d{6}$/,
		"my-MM": /^(\+?959|09|9)(2[5-7]|3[1-2]|4[0-5]|6[6-9]|7[5-9]|9[6-9])[0-9]{7}$/,
		"ms-MY": /^(\+?60|0)1(([0145](-|\s)?\d{7,8})|([236-9](-|\s)?\d{7}))$/,
		"mz-MZ": /^(\+?258)?8[234567]\d{7}$/,
		"nb-NO": /^(\+?47)?[49]\d{7}$/,
		"ne-NP": /^(\+?977)?9[78]\d{8}$/,
		"nl-BE": /^(\+?32|0)4\d{8}$/,
		"nl-NL": /^(((\+|00)?31\(0\))|((\+|00)?31)|0)6{1}\d{8}$/,
		"nl-AW": /^(\+)?297(56|59|64|73|74|99)\d{5}$/,
		"nn-NO": /^(\+?47)?[49]\d{7}$/,
		"pl-PL": /^(\+?48)? ?([5-8]\d|45) ?\d{3} ?\d{2} ?\d{2}$/,
		"pt-BR": /^((\+?55\ ?[1-9]{2}\ ?)|(\+?55\ ?\([1-9]{2}\)\ ?)|(0[1-9]{2}\ ?)|(\([1-9]{2}\)\ ?)|([1-9]{2}\ ?))((\d{4}\-?\d{4})|(9[1-9]{1}\d{3}\-?\d{4}))$/,
		"pt-PT": /^(\+?351)?9[1236]\d{7}$/,
		"pt-AO": /^(\+?244)?9\d{8}$/,
		"ro-MD": /^(\+?373|0)((6(0|1|2|6|7|8|9))|(7(6|7|8|9)))\d{6}$/,
		"ro-RO": /^(\+?40|0)\s?7\d{2}(\/|\s|\.|-)?\d{3}(\s|\.|-)?\d{3}$/,
		"ru-RU": /^(\+?7|8)?9\d{9}$/,
		"si-LK": /^(?:0|94|\+94)?(7(0|1|2|4|5|6|7|8)( |-)?)\d{7}$/,
		"sl-SI": /^(\+386\s?|0)(\d{1}\s?\d{3}\s?\d{2}\s?\d{2}|\d{2}\s?\d{3}\s?\d{3})$/,
		"sk-SK": /^(\+?421)? ?[1-9][0-9]{2} ?[0-9]{3} ?[0-9]{3}$/,
		"so-SO": /^(\+?252|0)((6[0-9])\d{7}|(7[1-9])\d{7})$/,
		"sq-AL": /^(\+355|0)6[2-9]\d{7}$/,
		"sr-RS": /^(\+3816|06)[- \d]{5,9}$/,
		"sv-SE": /^(\+?46|0)[\s\-]?7[\s\-]?[02369]([\s\-]?\d){7}$/,
		"tg-TJ": /^(\+?992)?[5][5]\d{7}$/,
		"th-TH": /^(\+66|66|0)\d{9}$/,
		"tr-TR": /^(\+?90|0)?5\d{9}$/,
		"tk-TM": /^(\+993|993|8)\d{8}$/,
		"uk-UA": /^(\+?38)?0(50|6[36-8]|7[357]|9[1-9])\d{7}$/,
		"uz-UZ": /^(\+?998)?(6[125-79]|7[1-69]|88|9\d)\d{7}$/,
		"vi-VN": /^((\+?84)|0)((3([2-9]))|(5([25689]))|(7([0|6-9]))|(8([1-9]))|(9([0-9])))([0-9]{7})$/,
		"zh-CN": /^((\+|00)86)?(1[3-9]|9[28])\d{9}$/,
		"zh-TW": /^(\+?886\-?|0)?9\d{8}$/,
		"dz-BT": /^(\+?975|0)?(17|16|77|02)\d{6}$/,
		"ar-YE": /^(((\+|00)9677|0?7)[0137]\d{7}|((\+|00)967|0)[1-7]\d{6})$/,
		"ar-EH": /^(\+?212|0)[\s\-]?(5288|5289)[\s\-]?\d{5}$/,
		"fa-AF": /^(\+93|0)?(2{1}[0-8]{1}|[3-5]{1}[0-4]{1})(\d{7})$/,
		"mk-MK": /^(\+?389|0)?((?:2[2-9]\d{6}|(?:3[1-4]|4[2-8])\d{6}|500\d{5}|5[2-9]\d{6}|7[0-9][2-9]\d{5}|8[1-9]\d{6}|800\d{5}|8009\d{4}))$/
	};
	phones["en-CA"] = phones["en-US"];
	phones["fr-CA"] = phones["en-CA"];
	phones["fr-BE"] = phones["nl-BE"];
	phones["zh-HK"] = phones["en-HK"];
	phones["zh-MO"] = phones["en-MO"];
	phones["ga-IE"] = phones["en-IE"];
	phones["fr-CH"] = phones["de-CH"];
	phones["it-CH"] = phones["fr-CH"];
	function isMobilePhone(str, locale, options) {
		(0, _assertString.default)(str);
		if (options && options.strictMode && !str.startsWith("+")) return false;
		if (Array.isArray(locale)) return locale.some(function(key) {
			// istanbul ignore else
			if (phones.hasOwnProperty(key)) {
				if (phones[key].test(str)) return true;
			}
			return false;
		});
		else if (locale in phones) return phones[locale].test(str);
		else if (!locale || locale === "any") {
			for (var key in phones)
 // istanbul ignore else
			if (phones.hasOwnProperty(key)) {
				if (phones[key].test(str)) return true;
			}
			return false;
		}
		throw new Error("Invalid locale '".concat(locale, "'"));
	}
	exports.locales = Object.keys(phones);
}));
// node_modules/validator/lib/isEthereumAddress.js
var require_isEthereumAddress = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = isEthereumAddress;
	var _assertString = _interopRequireDefault(require_assertString());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	var eth = /^(0x)[0-9a-f]{40}$/i;
	function isEthereumAddress(str) {
		(0, _assertString.default)(str);
		return eth.test(str);
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/isCurrency.js
var require_isCurrency = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = isCurrency;
	var _merge = _interopRequireDefault(require_merge());
	var _assertString = _interopRequireDefault(require_assertString());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	function currencyRegex(options) {
		var decimal_digits = "\\d{".concat(options.digits_after_decimal[0], "}");
		options.digits_after_decimal.forEach(function(digit, index) {
			if (index !== 0) decimal_digits = "".concat(decimal_digits, "|\\d{").concat(digit, "}");
		});
		var symbol = "(".concat(options.symbol.replace(/\W/, function(m) {
			return "\\".concat(m);
		}), ")").concat(options.require_symbol ? "" : "?"), negative = "-?", valid_whole_dollar_amounts = [
			"0",
			"[1-9]\\d*",
			"[1-9]\\d{0,2}(\\".concat(options.thousands_separator, "\\d{3})*")
		], whole_dollar_amount = "(".concat(valid_whole_dollar_amounts.join("|"), ")?"), decimal_amount = "(\\".concat(options.decimal_separator, "(").concat(decimal_digits, "))").concat(options.require_decimal ? "" : "?");
		var pattern = whole_dollar_amount + (options.allow_decimal || options.require_decimal ? decimal_amount : "");
		if (options.allow_negatives && !options.parens_for_negatives) {
			if (options.negative_sign_after_digits) pattern += negative;
			else if (options.negative_sign_before_digits) pattern = negative + pattern;
		}
		if (options.allow_negative_sign_placeholder) pattern = "( (?!\\-))?".concat(pattern);
		else if (options.allow_space_after_symbol) pattern = " ?".concat(pattern);
		else if (options.allow_space_after_digits) pattern += "( (?!$))?";
		if (options.symbol_after_digits) pattern += symbol;
		else pattern = symbol + pattern;
		if (options.allow_negatives) {
			if (options.parens_for_negatives) pattern = "(\\(".concat(pattern, "\\)|").concat(pattern, ")");
			else if (!(options.negative_sign_before_digits || options.negative_sign_after_digits)) pattern = negative + pattern;
		}
		return new RegExp("^(?!-? )(?=.*\\d)".concat(pattern, "$"));
	}
	var default_currency_options = {
		symbol: "$",
		require_symbol: false,
		allow_space_after_symbol: false,
		symbol_after_digits: false,
		allow_negatives: true,
		parens_for_negatives: false,
		negative_sign_before_digits: false,
		negative_sign_after_digits: false,
		allow_negative_sign_placeholder: false,
		thousands_separator: ",",
		decimal_separator: ".",
		allow_decimal: true,
		require_decimal: false,
		digits_after_decimal: [2],
		allow_space_after_digits: false
	};
	function isCurrency(str, options) {
		(0, _assertString.default)(str);
		options = (0, _merge.default)(options, default_currency_options);
		return currencyRegex(options).test(str);
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/isBtcAddress.js
var require_isBtcAddress = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = isBtcAddress;
	var _assertString = _interopRequireDefault(require_assertString());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	var bech32 = /^(bc1|tb1|bc1p|tb1p)[ac-hj-np-z02-9]{39,58}$/;
	var base58 = /^(1|2|3|m)[A-HJ-NP-Za-km-z1-9]{25,39}$/;
	function isBtcAddress(str) {
		(0, _assertString.default)(str);
		return bech32.test(str) || base58.test(str);
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/isISO6346.js
var require_isISO6346 = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.isFreightContainerID = void 0;
	exports.isISO6346 = isISO6346;
	var _assertString = _interopRequireDefault(require_assertString());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	var isISO6346Str = /^[A-Z]{3}(U[0-9]{7})|([J,Z][0-9]{6,7})$/;
	var isDigit = /^[0-9]$/;
	function isISO6346(str) {
		(0, _assertString.default)(str);
		str = str.toUpperCase();
		if (!isISO6346Str.test(str)) return false;
		if (str.length === 11) {
			var sum = 0;
			for (var i = 0; i < str.length - 1; i++) if (!isDigit.test(str[i])) {
				var convertedCode = void 0;
				var letterCode = str.charCodeAt(i) - 55;
				if (letterCode < 11) convertedCode = letterCode;
				else if (letterCode >= 11 && letterCode <= 20) convertedCode = 12 + letterCode % 11;
				else if (letterCode >= 21 && letterCode <= 30) convertedCode = 23 + letterCode % 21;
				else convertedCode = 34 + letterCode % 31;
				sum += convertedCode * Math.pow(2, i);
			} else sum += str[i] * Math.pow(2, i);
			var checkSumDigit = sum % 11;
			if (checkSumDigit === 10) checkSumDigit = 0;
			return Number(str[str.length - 1]) === checkSumDigit;
		}
		return true;
	}
	exports.isFreightContainerID = isISO6346;
}));
// node_modules/validator/lib/isISO6391.js
var require_isISO6391 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = isISO6391;
	var _assertString = _interopRequireDefault(require_assertString());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	var isISO6391Set = /* @__PURE__ */ new Set([
		"aa",
		"ab",
		"ae",
		"af",
		"ak",
		"am",
		"an",
		"ar",
		"as",
		"av",
		"ay",
		"az",
		"az",
		"ba",
		"be",
		"bg",
		"bh",
		"bi",
		"bm",
		"bn",
		"bo",
		"br",
		"bs",
		"ca",
		"ce",
		"ch",
		"co",
		"cr",
		"cs",
		"cu",
		"cv",
		"cy",
		"da",
		"de",
		"dv",
		"dz",
		"ee",
		"el",
		"en",
		"eo",
		"es",
		"et",
		"eu",
		"fa",
		"ff",
		"fi",
		"fj",
		"fo",
		"fr",
		"fy",
		"ga",
		"gd",
		"gl",
		"gn",
		"gu",
		"gv",
		"ha",
		"he",
		"hi",
		"ho",
		"hr",
		"ht",
		"hu",
		"hy",
		"hz",
		"ia",
		"id",
		"ie",
		"ig",
		"ii",
		"ik",
		"io",
		"is",
		"it",
		"iu",
		"ja",
		"jv",
		"ka",
		"kg",
		"ki",
		"kj",
		"kk",
		"kl",
		"km",
		"kn",
		"ko",
		"kr",
		"ks",
		"ku",
		"kv",
		"kw",
		"ky",
		"la",
		"lb",
		"lg",
		"li",
		"ln",
		"lo",
		"lt",
		"lu",
		"lv",
		"mg",
		"mh",
		"mi",
		"mk",
		"ml",
		"mn",
		"mr",
		"ms",
		"mt",
		"my",
		"na",
		"nb",
		"nd",
		"ne",
		"ng",
		"nl",
		"nn",
		"no",
		"nr",
		"nv",
		"ny",
		"oc",
		"oj",
		"om",
		"or",
		"os",
		"pa",
		"pi",
		"pl",
		"ps",
		"pt",
		"qu",
		"rm",
		"rn",
		"ro",
		"ru",
		"rw",
		"sa",
		"sc",
		"sd",
		"se",
		"sg",
		"si",
		"sk",
		"sl",
		"sm",
		"sn",
		"so",
		"sq",
		"sr",
		"ss",
		"st",
		"su",
		"sv",
		"sw",
		"ta",
		"te",
		"tg",
		"th",
		"ti",
		"tk",
		"tl",
		"tn",
		"to",
		"tr",
		"ts",
		"tt",
		"tw",
		"ty",
		"ug",
		"uk",
		"ur",
		"uz",
		"ve",
		"vi",
		"vo",
		"wa",
		"wo",
		"xh",
		"yi",
		"yo",
		"za",
		"zh",
		"zu"
	]);
	function isISO6391(str) {
		(0, _assertString.default)(str);
		return isISO6391Set.has(str);
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/isISO8601.js
var require_isISO8601 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = isISO8601;
	var _assertString = _interopRequireDefault(require_assertString());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	var iso8601 = /^([\+-]?\d{4}(?!\d{2}\b))((-?)((0[1-9]|1[0-2])(\3([12]\d|0[1-9]|3[01]))?|W([0-4]\d|5[0-3])(-?[1-7])?|(00[1-9]|0[1-9]\d|[12]\d{2}|3([0-5]\d|6[1-6])))([T\s]((([01]\d|2[0-3])((:?)[0-5]\d)?|24:?00)([\.,]\d+(?!:))?)?(\17[0-5]\d([\.,]\d+)?)?([zZ]|([\+-])([01]\d|2[0-3]):?([0-5]\d)?)?)?)?$/;
	var iso8601StrictSeparator = /^([\+-]?\d{4}(?!\d{2}\b))((-?)((0[1-9]|1[0-2])(\3([12]\d|0[1-9]|3[01]))?|W([0-4]\d|5[0-3])(-?[1-7])?|(00[1-9]|0[1-9]\d|[12]\d{2}|3([0-5]\d|6[1-6])))([T]((([01]\d|2[0-3])((:?)[0-5]\d)?|24:?00)([\.,]\d+(?!:))?)?(\17[0-5]\d([\.,]\d+)?)?([zZ]|([\+-])([01]\d|2[0-3]):?([0-5]\d)?)?)?)?$/;
	var isValidDate = function isValidDate(str) {
		var ordinalMatch = str.match(/^(\d{4})-?(\d{3})([ T]{1}\.*|$)/);
		if (ordinalMatch) {
			var oYear = Number(ordinalMatch[1]);
			var oDay = Number(ordinalMatch[2]);
			if (oYear % 4 === 0 && oYear % 100 !== 0 || oYear % 400 === 0) return oDay <= 366;
			return oDay <= 365;
		}
		var match = str.match(/(\d{4})-?(\d{0,2})-?(\d*)/).map(Number);
		var year = match[1];
		var month = match[2];
		var day = match[3];
		var monthString = month ? "0".concat(month).slice(-2) : month;
		var dayString = day ? "0".concat(day).slice(-2) : day;
		var d = new Date("".concat(year, "-").concat(monthString || "01", "-").concat(dayString || "01"));
		if (month && day) return d.getUTCFullYear() === year && d.getUTCMonth() + 1 === month && d.getUTCDate() === day;
		return true;
	};
	function isISO8601(str) {
		var options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
		(0, _assertString.default)(str);
		var check = options.strictSeparator ? iso8601StrictSeparator.test(str) : iso8601.test(str);
		if (check && options.strict) return isValidDate(str);
		return check;
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/isRFC3339.js
var require_isRFC3339 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = isRFC3339;
	var _assertString = _interopRequireDefault(require_assertString());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	var dateFullYear = /[0-9]{4}/;
	var dateMonth = /(0[1-9]|1[0-2])/;
	var dateMDay = /([12]\d|0[1-9]|3[01])/;
	var timeHour = /([01][0-9]|2[0-3])/;
	var timeMinute = /[0-5][0-9]/;
	var timeSecond = /([0-5][0-9]|60)/;
	var timeSecFrac = /(\.[0-9]+)?/;
	var timeNumOffset = new RegExp("[-+]".concat(timeHour.source, ":").concat(timeMinute.source));
	var timeOffset = new RegExp("([zZ]|".concat(timeNumOffset.source, ")"));
	var partialTime = new RegExp("".concat(timeHour.source, ":").concat(timeMinute.source, ":").concat(timeSecond.source).concat(timeSecFrac.source));
	var fullDate = new RegExp("".concat(dateFullYear.source, "-").concat(dateMonth.source, "-").concat(dateMDay.source));
	var fullTime = new RegExp("".concat(partialTime.source).concat(timeOffset.source));
	var rfc3339 = new RegExp("^".concat(fullDate.source, "[ tT]").concat(fullTime.source, "$"));
	function isRFC3339(str) {
		(0, _assertString.default)(str);
		return rfc3339.test(str);
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/isISO15924.js
var require_isISO15924 = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.ScriptCodes = void 0;
	exports.default = isISO15924;
	var _assertString = _interopRequireDefault(require_assertString());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	var validISO15924Codes = /* @__PURE__ */ new Set([
		"Adlm",
		"Afak",
		"Aghb",
		"Ahom",
		"Arab",
		"Aran",
		"Armi",
		"Armn",
		"Avst",
		"Bali",
		"Bamu",
		"Bass",
		"Batk",
		"Beng",
		"Bhks",
		"Blis",
		"Bopo",
		"Brah",
		"Brai",
		"Bugi",
		"Buhd",
		"Cakm",
		"Cans",
		"Cari",
		"Cham",
		"Cher",
		"Chis",
		"Chrs",
		"Cirt",
		"Copt",
		"Cpmn",
		"Cprt",
		"Cyrl",
		"Cyrs",
		"Deva",
		"Diak",
		"Dogr",
		"Dsrt",
		"Dupl",
		"Egyd",
		"Egyh",
		"Egyp",
		"Elba",
		"Elym",
		"Ethi",
		"Gara",
		"Geok",
		"Geor",
		"Glag",
		"Gong",
		"Gonm",
		"Goth",
		"Gran",
		"Grek",
		"Gujr",
		"Gukh",
		"Guru",
		"Hanb",
		"Hang",
		"Hani",
		"Hano",
		"Hans",
		"Hant",
		"Hatr",
		"Hebr",
		"Hira",
		"Hluw",
		"Hmng",
		"Hmnp",
		"Hrkt",
		"Hung",
		"Inds",
		"Ital",
		"Jamo",
		"Java",
		"Jpan",
		"Jurc",
		"Kali",
		"Kana",
		"Kawi",
		"Khar",
		"Khmr",
		"Khoj",
		"Kitl",
		"Kits",
		"Knda",
		"Kore",
		"Kpel",
		"Krai",
		"Kthi",
		"Lana",
		"Laoo",
		"Latf",
		"Latg",
		"Latn",
		"Leke",
		"Lepc",
		"Limb",
		"Lina",
		"Linb",
		"Lisu",
		"Loma",
		"Lyci",
		"Lydi",
		"Mahj",
		"Maka",
		"Mand",
		"Mani",
		"Marc",
		"Maya",
		"Medf",
		"Mend",
		"Merc",
		"Mero",
		"Mlym",
		"Modi",
		"Mong",
		"Moon",
		"Mroo",
		"Mtei",
		"Mult",
		"Mymr",
		"Nagm",
		"Nand",
		"Narb",
		"Nbat",
		"Newa",
		"Nkdb",
		"Nkgb",
		"Nkoo",
		"Nshu",
		"Ogam",
		"Olck",
		"Onao",
		"Orkh",
		"Orya",
		"Osge",
		"Osma",
		"Ougr",
		"Palm",
		"Pauc",
		"Pcun",
		"Pelm",
		"Perm",
		"Phag",
		"Phli",
		"Phlp",
		"Phlv",
		"Phnx",
		"Plrd",
		"Piqd",
		"Prti",
		"Psin",
		"Qaaa",
		"Qaab",
		"Qaac",
		"Qaad",
		"Qaae",
		"Qaaf",
		"Qaag",
		"Qaah",
		"Qaai",
		"Qaaj",
		"Qaak",
		"Qaal",
		"Qaam",
		"Qaan",
		"Qaao",
		"Qaap",
		"Qaaq",
		"Qaar",
		"Qaas",
		"Qaat",
		"Qaau",
		"Qaav",
		"Qaaw",
		"Qaax",
		"Qaay",
		"Qaaz",
		"Qaba",
		"Qabb",
		"Qabc",
		"Qabd",
		"Qabe",
		"Qabf",
		"Qabg",
		"Qabh",
		"Qabi",
		"Qabj",
		"Qabk",
		"Qabl",
		"Qabm",
		"Qabn",
		"Qabo",
		"Qabp",
		"Qabq",
		"Qabr",
		"Qabs",
		"Qabt",
		"Qabu",
		"Qabv",
		"Qabw",
		"Qabx",
		"Ranj",
		"Rjng",
		"Rohg",
		"Roro",
		"Runr",
		"Samr",
		"Sara",
		"Sarb",
		"Saur",
		"Sgnw",
		"Shaw",
		"Shrd",
		"Shui",
		"Sidd",
		"Sidt",
		"Sind",
		"Sinh",
		"Sogd",
		"Sogo",
		"Sora",
		"Soyo",
		"Sund",
		"Sunu",
		"Sylo",
		"Syrc",
		"Syre",
		"Syrj",
		"Syrn",
		"Tagb",
		"Takr",
		"Tale",
		"Talu",
		"Taml",
		"Tang",
		"Tavt",
		"Tayo",
		"Telu",
		"Teng",
		"Tfng",
		"Tglg",
		"Thaa",
		"Thai",
		"Tibt",
		"Tirh",
		"Tnsa",
		"Todr",
		"Tols",
		"Toto",
		"Tutg",
		"Ugar",
		"Vaii",
		"Visp",
		"Vith",
		"Wara",
		"Wcho",
		"Wole",
		"Xpeo",
		"Xsux",
		"Yezi",
		"Yiii",
		"Zanb",
		"Zinh",
		"Zmth",
		"Zsye",
		"Zsym",
		"Zxxx",
		"Zyyy",
		"Zzzz"
	]);
	function isISO15924(str) {
		(0, _assertString.default)(str);
		return validISO15924Codes.has(str);
	}
	exports.ScriptCodes = validISO15924Codes;
}));
// node_modules/validator/lib/isISO31661Alpha3.js
var require_isISO31661Alpha3 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = isISO31661Alpha3;
	var _assertString = _interopRequireDefault(require_assertString());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	var validISO31661Alpha3CountriesCodes = /* @__PURE__ */ new Set([
		"AFG",
		"ALA",
		"ALB",
		"DZA",
		"ASM",
		"AND",
		"AGO",
		"AIA",
		"ATA",
		"ATG",
		"ARG",
		"ARM",
		"ABW",
		"AUS",
		"AUT",
		"AZE",
		"BHS",
		"BHR",
		"BGD",
		"BRB",
		"BLR",
		"BEL",
		"BLZ",
		"BEN",
		"BMU",
		"BTN",
		"BOL",
		"BES",
		"BIH",
		"BWA",
		"BVT",
		"BRA",
		"IOT",
		"BRN",
		"BGR",
		"BFA",
		"BDI",
		"KHM",
		"CMR",
		"CAN",
		"CPV",
		"CYM",
		"CAF",
		"TCD",
		"CHL",
		"CHN",
		"CXR",
		"CCK",
		"COL",
		"COM",
		"COG",
		"COD",
		"COK",
		"CRI",
		"CIV",
		"HRV",
		"CUB",
		"CUW",
		"CYP",
		"CZE",
		"DNK",
		"DJI",
		"DMA",
		"DOM",
		"ECU",
		"EGY",
		"SLV",
		"GNQ",
		"ERI",
		"EST",
		"ETH",
		"FLK",
		"FRO",
		"FJI",
		"FIN",
		"FRA",
		"GUF",
		"PYF",
		"ATF",
		"GAB",
		"GMB",
		"GEO",
		"DEU",
		"GHA",
		"GIB",
		"GRC",
		"GRL",
		"GRD",
		"GLP",
		"GUM",
		"GTM",
		"GGY",
		"GIN",
		"GNB",
		"GUY",
		"HTI",
		"HMD",
		"VAT",
		"HND",
		"HKG",
		"HUN",
		"ISL",
		"IND",
		"IDN",
		"IRN",
		"IRQ",
		"IRL",
		"IMN",
		"ISR",
		"ITA",
		"JAM",
		"JPN",
		"JEY",
		"JOR",
		"KAZ",
		"KEN",
		"KIR",
		"PRK",
		"KOR",
		"KWT",
		"KGZ",
		"LAO",
		"LVA",
		"LBN",
		"LSO",
		"LBR",
		"LBY",
		"LIE",
		"LTU",
		"LUX",
		"MAC",
		"MKD",
		"MDG",
		"MWI",
		"MYS",
		"MDV",
		"MLI",
		"MLT",
		"MHL",
		"MTQ",
		"MRT",
		"MUS",
		"MYT",
		"MEX",
		"FSM",
		"MDA",
		"MCO",
		"MNG",
		"MNE",
		"MSR",
		"MAR",
		"MOZ",
		"MMR",
		"NAM",
		"NRU",
		"NPL",
		"NLD",
		"NCL",
		"NZL",
		"NIC",
		"NER",
		"NGA",
		"NIU",
		"NFK",
		"MNP",
		"NOR",
		"OMN",
		"PAK",
		"PLW",
		"PSE",
		"PAN",
		"PNG",
		"PRY",
		"PER",
		"PHL",
		"PCN",
		"POL",
		"PRT",
		"PRI",
		"QAT",
		"REU",
		"ROU",
		"RUS",
		"RWA",
		"BLM",
		"SHN",
		"KNA",
		"LCA",
		"MAF",
		"SPM",
		"VCT",
		"WSM",
		"SMR",
		"STP",
		"SAU",
		"SEN",
		"SRB",
		"SYC",
		"SLE",
		"SGP",
		"SXM",
		"SVK",
		"SVN",
		"SLB",
		"SOM",
		"ZAF",
		"SGS",
		"SSD",
		"ESP",
		"LKA",
		"SDN",
		"SUR",
		"SJM",
		"SWZ",
		"SWE",
		"CHE",
		"SYR",
		"TWN",
		"TJK",
		"TZA",
		"THA",
		"TLS",
		"TGO",
		"TKL",
		"TON",
		"TTO",
		"TUN",
		"TUR",
		"TKM",
		"TCA",
		"TUV",
		"UGA",
		"UKR",
		"ARE",
		"GBR",
		"USA",
		"UMI",
		"URY",
		"UZB",
		"VUT",
		"VEN",
		"VNM",
		"VGB",
		"VIR",
		"WLF",
		"ESH",
		"YEM",
		"ZMB",
		"ZWE"
	]);
	var alpha3CountryCode = /^[a-zA-Z]{3}$/;
	function isISO31661Alpha3(str) {
		var options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
		(0, _assertString.default)(str);
		if ((options.userAssignedCodes || []).reduce(function(accumulator, userAssignedCode) {
			if (alpha3CountryCode.test(userAssignedCode)) accumulator.push(userAssignedCode.toUpperCase());
			return accumulator;
		}, []).includes(str.toUpperCase())) return true;
		return validISO31661Alpha3CountriesCodes.has(str.toUpperCase());
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/isISO31661Numeric.js
var require_isISO31661Numeric = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = isISO31661Numeric;
	var _assertString = _interopRequireDefault(require_assertString());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	var validISO31661NumericCountriesCodes = /* @__PURE__ */ new Set([
		"004",
		"008",
		"010",
		"012",
		"016",
		"020",
		"024",
		"028",
		"031",
		"032",
		"036",
		"040",
		"044",
		"048",
		"050",
		"051",
		"052",
		"056",
		"060",
		"064",
		"068",
		"070",
		"072",
		"074",
		"076",
		"084",
		"086",
		"090",
		"092",
		"096",
		"100",
		"104",
		"108",
		"112",
		"116",
		"120",
		"124",
		"132",
		"136",
		"140",
		"144",
		"148",
		"152",
		"156",
		"158",
		"162",
		"166",
		"170",
		"174",
		"175",
		"178",
		"180",
		"184",
		"188",
		"191",
		"192",
		"196",
		"203",
		"204",
		"208",
		"212",
		"214",
		"218",
		"222",
		"226",
		"231",
		"232",
		"233",
		"234",
		"238",
		"239",
		"242",
		"246",
		"248",
		"250",
		"254",
		"258",
		"260",
		"262",
		"266",
		"268",
		"270",
		"275",
		"276",
		"288",
		"292",
		"296",
		"300",
		"304",
		"308",
		"312",
		"316",
		"320",
		"324",
		"328",
		"332",
		"334",
		"336",
		"340",
		"344",
		"348",
		"352",
		"356",
		"360",
		"364",
		"368",
		"372",
		"376",
		"380",
		"384",
		"388",
		"392",
		"398",
		"400",
		"404",
		"408",
		"410",
		"414",
		"417",
		"418",
		"422",
		"426",
		"428",
		"430",
		"434",
		"438",
		"440",
		"442",
		"446",
		"450",
		"454",
		"458",
		"462",
		"466",
		"470",
		"474",
		"478",
		"480",
		"484",
		"492",
		"496",
		"498",
		"499",
		"500",
		"504",
		"508",
		"512",
		"516",
		"520",
		"524",
		"528",
		"531",
		"533",
		"534",
		"535",
		"540",
		"548",
		"554",
		"558",
		"562",
		"566",
		"570",
		"574",
		"578",
		"580",
		"581",
		"583",
		"584",
		"585",
		"586",
		"591",
		"598",
		"600",
		"604",
		"608",
		"612",
		"616",
		"620",
		"624",
		"626",
		"630",
		"634",
		"638",
		"642",
		"643",
		"646",
		"652",
		"654",
		"659",
		"660",
		"662",
		"663",
		"666",
		"670",
		"674",
		"678",
		"682",
		"686",
		"688",
		"690",
		"694",
		"702",
		"703",
		"704",
		"705",
		"706",
		"710",
		"716",
		"724",
		"728",
		"729",
		"732",
		"740",
		"744",
		"748",
		"752",
		"756",
		"760",
		"762",
		"764",
		"768",
		"772",
		"776",
		"780",
		"784",
		"788",
		"792",
		"795",
		"796",
		"798",
		"800",
		"804",
		"807",
		"818",
		"826",
		"831",
		"832",
		"833",
		"834",
		"840",
		"850",
		"854",
		"858",
		"860",
		"862",
		"876",
		"882",
		"887",
		"894"
	]);
	function isISO31661Numeric(str) {
		(0, _assertString.default)(str);
		return validISO31661NumericCountriesCodes.has(str);
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/isISO4217.js
var require_isISO4217 = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.CurrencyCodes = void 0;
	exports.default = isISO4217;
	var _assertString = _interopRequireDefault(require_assertString());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	var validISO4217CurrencyCodes = /* @__PURE__ */ new Set([
		"AED",
		"AFN",
		"ALL",
		"AMD",
		"ANG",
		"AOA",
		"ARS",
		"AUD",
		"AWG",
		"AZN",
		"BAM",
		"BBD",
		"BDT",
		"BGN",
		"BHD",
		"BIF",
		"BMD",
		"BND",
		"BOB",
		"BOV",
		"BRL",
		"BSD",
		"BTN",
		"BWP",
		"BYN",
		"BZD",
		"CAD",
		"CDF",
		"CHE",
		"CHF",
		"CHW",
		"CLF",
		"CLP",
		"CNY",
		"COP",
		"COU",
		"CRC",
		"CUP",
		"CVE",
		"CZK",
		"DJF",
		"DKK",
		"DOP",
		"DZD",
		"EGP",
		"ERN",
		"ETB",
		"EUR",
		"FJD",
		"FKP",
		"GBP",
		"GEL",
		"GHS",
		"GIP",
		"GMD",
		"GNF",
		"GTQ",
		"GYD",
		"HKD",
		"HNL",
		"HTG",
		"HUF",
		"IDR",
		"ILS",
		"INR",
		"IQD",
		"IRR",
		"ISK",
		"JMD",
		"JOD",
		"JPY",
		"KES",
		"KGS",
		"KHR",
		"KMF",
		"KPW",
		"KRW",
		"KWD",
		"KYD",
		"KZT",
		"LAK",
		"LBP",
		"LKR",
		"LRD",
		"LSL",
		"LYD",
		"MAD",
		"MDL",
		"MGA",
		"MKD",
		"MMK",
		"MNT",
		"MOP",
		"MRU",
		"MUR",
		"MVR",
		"MWK",
		"MXN",
		"MXV",
		"MYR",
		"MZN",
		"NAD",
		"NGN",
		"NIO",
		"NOK",
		"NPR",
		"NZD",
		"OMR",
		"PAB",
		"PEN",
		"PGK",
		"PHP",
		"PKR",
		"PLN",
		"PYG",
		"QAR",
		"RON",
		"RSD",
		"RUB",
		"RWF",
		"SAR",
		"SBD",
		"SCR",
		"SDG",
		"SEK",
		"SGD",
		"SHP",
		"SLE",
		"SLL",
		"SOS",
		"SRD",
		"SSP",
		"STN",
		"SVC",
		"SYP",
		"SZL",
		"THB",
		"TJS",
		"TMT",
		"TND",
		"TOP",
		"TRY",
		"TTD",
		"TWD",
		"TZS",
		"UAH",
		"UGX",
		"USD",
		"USN",
		"UYI",
		"UYU",
		"UYW",
		"UZS",
		"VED",
		"VES",
		"VND",
		"VUV",
		"WST",
		"XAF",
		"XAG",
		"XAU",
		"XBA",
		"XBB",
		"XBC",
		"XBD",
		"XCD",
		"XDR",
		"XOF",
		"XPD",
		"XPF",
		"XPT",
		"XSU",
		"XTS",
		"XUA",
		"XXX",
		"YER",
		"ZAR",
		"ZMW",
		"ZWL"
	]);
	function isISO4217(str) {
		(0, _assertString.default)(str);
		return validISO4217CurrencyCodes.has(str.toUpperCase());
	}
	exports.CurrencyCodes = validISO4217CurrencyCodes;
}));
// node_modules/validator/lib/isBase32.js
var require_isBase32 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = isBase32;
	var _assertString = _interopRequireDefault(require_assertString());
	var _merge = _interopRequireDefault(require_merge());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	var base32 = /^[A-Z2-7]+=*$/;
	var crockfordBase32 = /^[A-HJKMNP-TV-Z0-9]+$/;
	var defaultBase32Options = { crockford: false };
	function isBase32(str, options) {
		(0, _assertString.default)(str);
		options = (0, _merge.default)(options, defaultBase32Options);
		if (options.crockford) return crockfordBase32.test(str);
		return str.length % 8 === 0 && base32.test(str);
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/isBase58.js
var require_isBase58 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = isBase58;
	var _assertString = _interopRequireDefault(require_assertString());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	var base58Reg = /^[A-HJ-NP-Za-km-z1-9]*$/;
	function isBase58(str) {
		(0, _assertString.default)(str);
		return base58Reg.test(str);
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/isDataURI.js
var require_isDataURI = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = isDataURI;
	var _assertString = _interopRequireDefault(require_assertString());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	var validMediaType = /^[a-z]+\/[a-z0-9\-\+\._]+$/i;
	var validAttribute = /^[a-z\-]+=[a-z0-9\-]+$/i;
	var validData = /^[a-z0-9!\$&'\(\)\*\+,;=\-\._~:@\/\?%\s]*$/i;
	function isDataURI(str) {
		(0, _assertString.default)(str);
		var data = str.split(",");
		if (data.length < 2) return false;
		var attributes = data.shift().trim().split(";");
		var schemeAndMediaType = attributes.shift();
		if (schemeAndMediaType.slice(0, 5) !== "data:") return false;
		var mediaType = schemeAndMediaType.slice(5);
		if (mediaType !== "" && !validMediaType.test(mediaType)) return false;
		for (var i = 0; i < attributes.length; i++) if (!(i === attributes.length - 1 && attributes[i].toLowerCase() === "base64") && !validAttribute.test(attributes[i])) return false;
		for (var _i = 0; _i < data.length; _i++) if (!validData.test(data[_i])) return false;
		return true;
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/isMagnetURI.js
var require_isMagnetURI = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = isMagnetURI;
	var _assertString = _interopRequireDefault(require_assertString());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	var magnetURIComponent = /(?:^magnet:\?|[^?&]&)xt(?:\.1)?=urn:(?:(?:aich|bitprint|btih|ed2k|ed2khash|kzhash|md5|sha1|tree:tiger):[a-z0-9]{32}(?:[a-z0-9]{8})?|btmh:1220[a-z0-9]{64})(?:$|&)/i;
	function isMagnetURI(url) {
		(0, _assertString.default)(url);
		if (url.indexOf("magnet:?") !== 0) return false;
		return magnetURIComponent.test(url);
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/rtrim.js
var require_rtrim = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = rtrim;
	var _assertString = _interopRequireDefault(require_assertString());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	function rtrim(str, chars) {
		(0, _assertString.default)(str);
		if (chars) {
			var pattern = new RegExp("[".concat(chars.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "]+$"), "g");
			return str.replace(pattern, "");
		}
		var strIndex = str.length - 1;
		while (/\s/.test(str.charAt(strIndex))) strIndex -= 1;
		return str.slice(0, strIndex + 1);
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/ltrim.js
var require_ltrim = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = ltrim;
	var _assertString = _interopRequireDefault(require_assertString());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	function ltrim(str, chars) {
		(0, _assertString.default)(str);
		var pattern = chars ? new RegExp("^[".concat(chars.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "]+"), "g") : /^\s+/g;
		return str.replace(pattern, "");
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/trim.js
var require_trim = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = trim;
	var _rtrim = _interopRequireDefault(require_rtrim());
	var _ltrim = _interopRequireDefault(require_ltrim());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	function trim(str, chars) {
		return (0, _rtrim.default)((0, _ltrim.default)(str, chars), chars);
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/isMailtoURI.js
var require_isMailtoURI = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = isMailtoURI;
	var _trim = _interopRequireDefault(require_trim());
	var _isEmail = _interopRequireDefault(require_isEmail());
	var _assertString = _interopRequireDefault(require_assertString());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	function _slicedToArray(r, e) {
		return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest();
	}
	function _nonIterableRest() {
		throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
	}
	function _iterableToArrayLimit(r, l) {
		var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
		if (null != t) {
			var e, n, i, u, a = [], f = !0, o = !1;
			try {
				if (i = (t = t.call(r)).next, 0 === l) {
					if (Object(t) !== t) return;
					f = !1;
				} else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0);
			} catch (r) {
				o = !0, n = r;
			} finally {
				try {
					if (!f && null != t.return && (u = t.return(), Object(u) !== u)) return;
				} finally {
					if (o) throw n;
				}
			}
			return a;
		}
	}
	function _arrayWithHoles(r) {
		if (Array.isArray(r)) return r;
	}
	function _createForOfIteratorHelper(r, e) {
		var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
		if (!t) {
			if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) {
				t && (r = t);
				var _n = 0, F = function F() {};
				return {
					s: F,
					n: function n() {
						return _n >= r.length ? { done: !0 } : {
							done: !1,
							value: r[_n++]
						};
					},
					e: function e(r) {
						throw r;
					},
					f: F
				};
			}
			throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
		}
		var o, a = !0, u = !1;
		return {
			s: function s() {
				t = t.call(r);
			},
			n: function n() {
				var r = t.next();
				return a = r.done, r;
			},
			e: function e(r) {
				u = !0, o = r;
			},
			f: function f() {
				try {
					a || null == t.return || t.return();
				} finally {
					if (u) throw o;
				}
			}
		};
	}
	function _unsupportedIterableToArray(r, a) {
		if (r) {
			if ("string" == typeof r) return _arrayLikeToArray(r, a);
			var t = {}.toString.call(r).slice(8, -1);
			return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0;
		}
	}
	function _arrayLikeToArray(r, a) {
		(null == a || a > r.length) && (a = r.length);
		for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
		return n;
	}
	function parseMailtoQueryString(queryString) {
		var allowedParams = /* @__PURE__ */ new Set([
			"subject",
			"body",
			"cc",
			"bcc"
		]), query = {
			cc: "",
			bcc: ""
		};
		var isParseFailed = false;
		var queryParams = queryString.split("&");
		if (queryParams.length > 4) return false;
		var _iterator = _createForOfIteratorHelper(queryParams), _step;
		try {
			for (_iterator.s(); !(_step = _iterator.n()).done;) {
				var _q$split2 = _slicedToArray(_step.value.split("="), 2), key = _q$split2[0], value = _q$split2[1];
				if (key && !allowedParams.has(key)) {
					isParseFailed = true;
					break;
				}
				if (value && (key === "cc" || key === "bcc")) query[key] = value;
				if (key) allowedParams.delete(key);
			}
		} catch (err) {
			_iterator.e(err);
		} finally {
			_iterator.f();
		}
		return isParseFailed ? false : query;
	}
	function isMailtoURI(url, options) {
		(0, _assertString.default)(url);
		if (url.indexOf("mailto:") !== 0) return false;
		var _url$replace$split2 = _slicedToArray(url.replace("mailto:", "").split("?"), 2), to = _url$replace$split2[0], _url$replace$split2$ = _url$replace$split2[1], queryString = _url$replace$split2$ === void 0 ? "" : _url$replace$split2$;
		if (!to && !queryString) return true;
		var query = parseMailtoQueryString(queryString);
		if (!query) return false;
		return "".concat(to, ",").concat(query.cc, ",").concat(query.bcc).split(",").every(function(email) {
			email = (0, _trim.default)(email, " ");
			if (email) return (0, _isEmail.default)(email, options);
			return true;
		});
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/isMimeType.js
var require_isMimeType = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = isMimeType;
	var _assertString = _interopRequireDefault(require_assertString());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	var mimeTypeSimple = /^(application|audio|font|image|message|model|multipart|text|video)\/[a-zA-Z0-9\.\-\+_]{1,100}$/i;
	var mimeTypeText = /^text\/[a-zA-Z0-9\.\-\+]{1,100};\s?charset=("[a-zA-Z0-9\.\-\+\s]{0,70}"|[a-zA-Z0-9\.\-\+]{0,70})(\s?\([a-zA-Z0-9\.\-\+\s]{1,20}\))?$/i;
	var mimeTypeMultipart = /^multipart\/[a-zA-Z0-9\.\-\+]{1,100}(;\s?(boundary|charset)=("[a-zA-Z0-9\.\-\+\s]{0,70}"|[a-zA-Z0-9\.\-\+]{0,70})(\s?\([a-zA-Z0-9\.\-\+\s]{1,20}\))?){0,2}$/i;
	function isMimeType(str) {
		(0, _assertString.default)(str);
		return mimeTypeSimple.test(str) || mimeTypeText.test(str) || mimeTypeMultipart.test(str);
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/isLatLong.js
var require_isLatLong = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = isLatLong;
	var _assertString = _interopRequireDefault(require_assertString());
	var _merge = _interopRequireDefault(require_merge());
	var _includesString = _interopRequireDefault(require_includesString());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	var lat = /^\(?[+-]?(90(\.0+)?|[1-8]?\d(\.\d+)?)$/;
	var long = /^\s?[+-]?(180(\.0+)?|1[0-7]\d(\.\d+)?|\d{1,2}(\.\d+)?)\)?$/;
	var latDMS = /^(([1-8]?\d)\D+([1-5]?\d|60)\D+([1-5]?\d|60)(\.\d+)?|90\D+0\D+0)\D+[NSns]?$/i;
	var longDMS = /^\s*([1-7]?\d{1,2}\D+([1-5]?\d|60)\D+([1-5]?\d|60)(\.\d+)?|180\D+0\D+0)\D+[EWew]?$/i;
	var defaultLatLongOptions = { checkDMS: false };
	function isLatLong(str, options) {
		(0, _assertString.default)(str);
		options = (0, _merge.default)(options, defaultLatLongOptions);
		if (!(0, _includesString.default)(str, ",")) return false;
		var pair = str.split(",");
		if (pair[0].startsWith("(") && !pair[1].endsWith(")") || pair[1].endsWith(")") && !pair[0].startsWith("(")) return false;
		if (options.checkDMS) return latDMS.test(pair[0]) && longDMS.test(pair[1]);
		return lat.test(pair[0]) && long.test(pair[1]);
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/isPostalCode.js
var require_isPostalCode = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = isPostalCode;
	exports.locales = void 0;
	var _assertString = _interopRequireDefault(require_assertString());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	var threeDigit = /^\d{3}$/;
	var fourDigit = /^\d{4}$/;
	var fiveDigit = /^\d{5}$/;
	var sixDigit = /^\d{6}$/;
	var patterns = {
		AD: /^AD\d{3}$/,
		AT: fourDigit,
		AU: fourDigit,
		AZ: /^AZ\d{4}$/,
		BA: /^([7-8]\d{4}$)/,
		BD: /^([1-8][0-9]{3}|9[0-4][0-9]{2})$/,
		BE: fourDigit,
		BG: fourDigit,
		BR: /^\d{5}-?\d{3}$/,
		BY: /^2[1-4]\d{4}$/,
		CA: /^[ABCEGHJKLMNPRSTVXY]\d[ABCEGHJ-NPRSTV-Z][\s\-]?\d[ABCEGHJ-NPRSTV-Z]\d$/i,
		CH: fourDigit,
		CN: /^(0[1-7]|1[012356]|2[0-7]|3[0-6]|4[0-7]|5[1-7]|6[1-7]|7[1-5]|8[1345]|9[09])\d{4}$/,
		CO: /^(05|08|11|13|15|17|18|19|20|23|25|27|41|44|47|50|52|54|63|66|68|70|73|76|81|85|86|88|91|94|95|97|99)(\d{4})$/,
		CZ: /^\d{3}\s?\d{2}$/,
		DE: fiveDigit,
		DK: fourDigit,
		DO: fiveDigit,
		DZ: fiveDigit,
		EE: fiveDigit,
		ES: /^(5[0-2]{1}|[0-4]{1}\d{1})\d{3}$/,
		FI: fiveDigit,
		FR: /^(?:(?:0[1-9]|[1-8]\d|9[0-5])\d{3}|97[1-46]\d{2})$/,
		GB: /^(gir\s?0aa|[a-z]{1,2}\d[\da-z]?\s?(\d[a-z]{2})?)$/i,
		GR: /^\d{3}\s?\d{2}$/,
		HR: /^([1-5]\d{4}$)/,
		HT: /^HT\d{4}$/,
		HU: fourDigit,
		ID: fiveDigit,
		IE: /^(?!.*(?:o))[A-Za-z]\d[\dw]\s\w{4}$/i,
		IL: /^(\d{5}|\d{7})$/,
		IN: /^((?!10|29|35|54|55|65|66|86|87|88|89)[1-9][0-9]{5})$/,
		IR: /^(?!(\d)\1{3})[13-9]{4}[1346-9][013-9]{5}$/,
		IS: threeDigit,
		IT: fiveDigit,
		JP: /^\d{3}\-\d{4}$/,
		KE: fiveDigit,
		KR: /^(\d{5}|\d{6})$/,
		LI: /^(948[5-9]|949[0-7])$/,
		LT: /^LT\-\d{5}$/,
		LU: fourDigit,
		LV: /^LV\-\d{4}$/,
		LK: fiveDigit,
		MC: /^980\d{2}$/,
		MG: threeDigit,
		MX: fiveDigit,
		MT: /^[A-Za-z]{3}\s{0,1}\d{4}$/,
		MY: fiveDigit,
		NL: /^[1-9]\d{3}\s?(?!sa|sd|ss)[a-z]{2}$/i,
		NO: fourDigit,
		NP: /^(10|21|22|32|33|34|44|45|56|57)\d{3}$|^(977)$/i,
		NZ: fourDigit,
		PK: fiveDigit,
		PL: /^\d{2}\-\d{3}$/,
		PR: /^00[679]\d{2}([ -]\d{4})?$/,
		PT: /^\d{4}\-\d{3}?$/,
		RO: sixDigit,
		RU: sixDigit,
		SA: fiveDigit,
		SE: /^[1-9]\d{2}\s?\d{2}$/,
		SG: sixDigit,
		SI: fourDigit,
		SK: /^\d{3}\s?\d{2}$/,
		TH: fiveDigit,
		TN: fourDigit,
		TW: /^\d{3}(\d{2,3})?$/,
		UA: fiveDigit,
		US: /^\d{5}(-\d{4})?$/,
		ZA: fourDigit,
		ZM: fiveDigit
	};
	exports.locales = Object.keys(patterns);
	function isPostalCode(str, locale) {
		(0, _assertString.default)(str);
		if (locale in patterns) return patterns[locale].test(str);
		else if (locale === "any") {
			for (var key in patterns)
 // istanbul ignore else
			if (patterns.hasOwnProperty(key)) {
				if (patterns[key].test(str)) return true;
			}
			return false;
		}
		throw new Error("Invalid locale '".concat(locale, "'"));
	}
}));
// node_modules/validator/lib/escape.js
var require_escape = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = escape;
	var _assertString = _interopRequireDefault(require_assertString());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	function escape(str) {
		(0, _assertString.default)(str);
		return str.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\//g, "&#x2F;").replace(/\\/g, "&#x5C;").replace(/`/g, "&#96;");
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/unescape.js
var require_unescape = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = unescape;
	var _assertString = _interopRequireDefault(require_assertString());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	function unescape(str) {
		(0, _assertString.default)(str);
		return str.replace(/&quot;/g, "\"").replace(/&#x27;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#x2F;/g, "/").replace(/&#x5C;/g, "\\").replace(/&#96;/g, "`").replace(/&amp;/g, "&");
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/blacklist.js
var require_blacklist = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = blacklist;
	var _assertString = _interopRequireDefault(require_assertString());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	function blacklist(str, chars) {
		(0, _assertString.default)(str);
		return str.replace(new RegExp("[".concat(chars, "]+"), "g"), "");
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/stripLow.js
var require_stripLow = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = stripLow;
	var _assertString = _interopRequireDefault(require_assertString());
	var _blacklist = _interopRequireDefault(require_blacklist());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	function stripLow(str, keep_new_lines) {
		(0, _assertString.default)(str);
		var chars = keep_new_lines ? "\\x00-\\x09\\x0B\\x0C\\x0E-\\x1F\\x7F" : "\\x00-\\x1F\\x7F";
		return (0, _blacklist.default)(str, chars);
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/whitelist.js
var require_whitelist = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = whitelist;
	var _assertString = _interopRequireDefault(require_assertString());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	function whitelist(str, chars) {
		(0, _assertString.default)(str);
		return str.replace(new RegExp("[^".concat(chars, "]+"), "g"), "");
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/isWhitelisted.js
var require_isWhitelisted = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = isWhitelisted;
	var _assertString = _interopRequireDefault(require_assertString());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	function isWhitelisted(str, chars) {
		(0, _assertString.default)(str);
		for (var i = str.length - 1; i >= 0; i--) if (chars.indexOf(str[i]) === -1) return false;
		return true;
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/normalizeEmail.js
var require_normalizeEmail = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = normalizeEmail;
	var _merge = _interopRequireDefault(require_merge());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	var default_normalize_email_options = {
		all_lowercase: true,
		gmail_lowercase: true,
		gmail_remove_dots: true,
		gmail_remove_subaddress: true,
		gmail_convert_googlemaildotcom: true,
		outlookdotcom_lowercase: true,
		outlookdotcom_remove_subaddress: true,
		yahoo_lowercase: true,
		yahoo_remove_subaddress: true,
		yandex_lowercase: true,
		yandex_convert_yandexru: true,
		icloud_lowercase: true,
		icloud_remove_subaddress: true
	};
	var icloud_domains = ["icloud.com", "me.com"];
	var outlookdotcom_domains = [
		"hotmail.at",
		"hotmail.be",
		"hotmail.ca",
		"hotmail.cl",
		"hotmail.co.il",
		"hotmail.co.nz",
		"hotmail.co.th",
		"hotmail.co.uk",
		"hotmail.com",
		"hotmail.com.ar",
		"hotmail.com.au",
		"hotmail.com.br",
		"hotmail.com.gr",
		"hotmail.com.mx",
		"hotmail.com.pe",
		"hotmail.com.tr",
		"hotmail.com.vn",
		"hotmail.cz",
		"hotmail.de",
		"hotmail.dk",
		"hotmail.es",
		"hotmail.fr",
		"hotmail.hu",
		"hotmail.id",
		"hotmail.ie",
		"hotmail.in",
		"hotmail.it",
		"hotmail.jp",
		"hotmail.kr",
		"hotmail.lv",
		"hotmail.my",
		"hotmail.ph",
		"hotmail.pt",
		"hotmail.sa",
		"hotmail.sg",
		"hotmail.sk",
		"live.be",
		"live.co.uk",
		"live.com",
		"live.com.ar",
		"live.com.mx",
		"live.de",
		"live.es",
		"live.eu",
		"live.fr",
		"live.it",
		"live.nl",
		"msn.com",
		"outlook.at",
		"outlook.be",
		"outlook.cl",
		"outlook.co.il",
		"outlook.co.nz",
		"outlook.co.th",
		"outlook.com",
		"outlook.com.ar",
		"outlook.com.au",
		"outlook.com.br",
		"outlook.com.gr",
		"outlook.com.pe",
		"outlook.com.tr",
		"outlook.com.vn",
		"outlook.cz",
		"outlook.de",
		"outlook.dk",
		"outlook.es",
		"outlook.fr",
		"outlook.hu",
		"outlook.id",
		"outlook.ie",
		"outlook.in",
		"outlook.it",
		"outlook.jp",
		"outlook.kr",
		"outlook.lv",
		"outlook.my",
		"outlook.ph",
		"outlook.pt",
		"outlook.sa",
		"outlook.sg",
		"outlook.sk",
		"passport.com"
	];
	var yahoo_domains = [
		"rocketmail.com",
		"yahoo.ca",
		"yahoo.co.uk",
		"yahoo.com",
		"yahoo.de",
		"yahoo.fr",
		"yahoo.in",
		"yahoo.it",
		"ymail.com"
	];
	var yandex_domains = [
		"yandex.ru",
		"yandex.ua",
		"yandex.kz",
		"yandex.com",
		"yandex.by",
		"ya.ru"
	];
	function dotsReplacer(match) {
		if (match.length > 1) return match;
		return "";
	}
	function normalizeEmail(email, options) {
		options = (0, _merge.default)(options, default_normalize_email_options);
		var raw_parts = email.split("@");
		var domain = raw_parts.pop();
		var parts = [raw_parts.join("@"), domain];
		parts[1] = parts[1].toLowerCase();
		if (parts[1] === "gmail.com" || parts[1] === "googlemail.com") {
			if (options.gmail_remove_subaddress) parts[0] = parts[0].split("+")[0];
			if (options.gmail_remove_dots) parts[0] = parts[0].replace(/\.+/g, dotsReplacer);
			if (!parts[0].length) return false;
			if (options.all_lowercase || options.gmail_lowercase) parts[0] = parts[0].toLowerCase();
			parts[1] = options.gmail_convert_googlemaildotcom ? "gmail.com" : parts[1];
		} else if (icloud_domains.indexOf(parts[1]) >= 0) {
			if (options.icloud_remove_subaddress) parts[0] = parts[0].split("+")[0];
			if (!parts[0].length) return false;
			if (options.all_lowercase || options.icloud_lowercase) parts[0] = parts[0].toLowerCase();
		} else if (outlookdotcom_domains.indexOf(parts[1]) >= 0) {
			if (options.outlookdotcom_remove_subaddress) parts[0] = parts[0].split("+")[0];
			if (!parts[0].length) return false;
			if (options.all_lowercase || options.outlookdotcom_lowercase) parts[0] = parts[0].toLowerCase();
		} else if (yahoo_domains.indexOf(parts[1]) >= 0) {
			if (options.yahoo_remove_subaddress) {
				var components = parts[0].split("-");
				parts[0] = components.length > 1 ? components.slice(0, -1).join("-") : components[0];
			}
			if (!parts[0].length) return false;
			if (options.all_lowercase || options.yahoo_lowercase) parts[0] = parts[0].toLowerCase();
		} else if (yandex_domains.indexOf(parts[1]) >= 0) {
			if (options.all_lowercase || options.yandex_lowercase) parts[0] = parts[0].toLowerCase();
			parts[1] = options.yandex_convert_yandexru ? "yandex.ru" : parts[1];
		} else if (options.all_lowercase) parts[0] = parts[0].toLowerCase();
		return parts.join("@");
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/isSlug.js
var require_isSlug = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = isSlug;
	var _assertString = _interopRequireDefault(require_assertString());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	var charsetRegex = /^[a-z0-9](?!.*[-_]{2,})(?:[a-z0-9_-]*[a-z0-9])?$/;
	function isSlug(str) {
		(0, _assertString.default)(str);
		return charsetRegex.test(str);
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/isLicensePlate.js
var require_isLicensePlate = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = isLicensePlate;
	var _assertString = _interopRequireDefault(require_assertString());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	var validators = {
		"cs-CZ": function csCZ(str) {
			return /^(([ABCDEFHIJKLMNPRSTUVXYZ]|[0-9])-?){5,8}$/.test(str);
		},
		"de-DE": function deDE(str) {
			return /^((A|AA|AB|AC|AE|AH|AK|AM|AN|AÖ|AP|AS|AT|AU|AW|AZ|B|BA|BB|BC|BE|BF|BH|BI|BK|BL|BM|BN|BO|BÖ|BS|BT|BZ|C|CA|CB|CE|CO|CR|CW|D|DA|DD|DE|DH|DI|DL|DM|DN|DO|DU|DW|DZ|E|EA|EB|ED|EE|EF|EG|EH|EI|EL|EM|EN|ER|ES|EU|EW|F|FB|FD|FF|FG|FI|FL|FN|FO|FR|FS|FT|FÜ|FW|FZ|G|GA|GC|GD|GE|GF|GG|GI|GK|GL|GM|GN|GÖ|GP|GR|GS|GT|GÜ|GV|GW|GZ|H|HA|HB|HC|HD|HE|HF|HG|HH|HI|HK|HL|HM|HN|HO|HP|HR|HS|HU|HV|HX|HY|HZ|IK|IL|IN|IZ|J|JE|JL|K|KA|KB|KC|KE|KF|KG|KH|KI|KK|KL|KM|KN|KO|KR|KS|KT|KU|KW|KY|L|LA|LB|LC|LD|LF|LG|LH|LI|LL|LM|LN|LÖ|LP|LR|LU|M|MA|MB|MC|MD|ME|MG|MH|MI|MK|ML|MM|MN|MO|MQ|MR|MS|MÜ|MW|MY|MZ|N|NB|ND|NE|NF|NH|NI|NK|NM|NÖ|NP|NR|NT|NU|NW|NY|NZ|OA|OB|OC|OD|OE|OF|OG|OH|OK|OL|OP|OS|OZ|P|PA|PB|PE|PF|PI|PL|PM|PN|PR|PS|PW|PZ|R|RA|RC|RD|RE|RG|RH|RI|RL|RM|RN|RO|RP|RS|RT|RU|RV|RW|RZ|S|SB|SC|SE|SG|SI|SK|SL|SM|SN|SO|SP|SR|ST|SU|SW|SY|SZ|TE|TF|TG|TO|TP|TR|TS|TT|TÜ|ÜB|UE|UH|UL|UM|UN|V|VB|VG|VK|VR|VS|W|WA|WB|WE|WF|WI|WK|WL|WM|WN|WO|WR|WS|WT|WÜ|WW|WZ|Z|ZE|ZI|ZP|ZR|ZW|ZZ)[- ]?[A-Z]{1,2}[- ]?\d{1,4}|(ABG|ABI|AIB|AIC|ALF|ALZ|ANA|ANG|ANK|APD|ARN|ART|ASL|ASZ|AUR|AZE|BAD|BAR|BBG|BCH|BED|BER|BGD|BGL|BID|BIN|BIR|BIT|BIW|BKS|BLB|BLK|BNA|BOG|BOH|BOR|BOT|BRA|BRB|BRG|BRK|BRL|BRV|BSB|BSK|BTF|BÜD|BUL|BÜR|BÜS|BÜZ|CAS|CHA|CLP|CLZ|COC|COE|CUX|DAH|DAN|DAU|DBR|DEG|DEL|DGF|DIL|DIN|DIZ|DKB|DLG|DON|DUD|DÜW|EBE|EBN|EBS|ECK|EIC|EIL|EIN|EIS|EMD|EMS|ERB|ERH|ERK|ERZ|ESB|ESW|FDB|FDS|FEU|FFB|FKB|FLÖ|FOR|FRG|FRI|FRW|FTL|FÜS|GAN|GAP|GDB|GEL|GEO|GER|GHA|GHC|GLA|GMN|GNT|GOA|GOH|GRA|GRH|GRI|GRM|GRZ|GTH|GUB|GUN|GVM|HAB|HAL|HAM|HAS|HBN|HBS|HCH|HDH|HDL|HEB|HEF|HEI|HER|HET|HGN|HGW|HHM|HIG|HIP|HMÜ|HOG|HOH|HOL|HOM|HOR|HÖS|HOT|HRO|HSK|HST|HVL|HWI|IGB|ILL|JÜL|KEH|KEL|KEM|KIB|KLE|KLZ|KÖN|KÖT|KÖZ|KRU|KÜN|KUS|KYF|LAN|LAU|LBS|LBZ|LDK|LDS|LEO|LER|LEV|LIB|LIF|LIP|LÖB|LOS|LRO|LSZ|LÜN|LUP|LWL|MAB|MAI|MAK|MAL|MED|MEG|MEI|MEK|MEL|MER|MET|MGH|MGN|MHL|MIL|MKK|MOD|MOL|MON|MOS|MSE|MSH|MSP|MST|MTK|MTL|MÜB|MÜR|MYK|MZG|NAB|NAI|NAU|NDH|NEA|NEB|NEC|NEN|NES|NEW|NMB|NMS|NOH|NOL|NOM|NOR|NVP|NWM|OAL|OBB|OBG|OCH|OHA|ÖHR|OHV|OHZ|OPR|OSL|OVI|OVL|OVP|PAF|PAN|PAR|PCH|PEG|PIR|PLÖ|PRÜ|QFT|QLB|RDG|REG|REH|REI|RID|RIE|ROD|ROF|ROK|ROL|ROS|ROT|ROW|RSL|RÜD|RÜG|SAB|SAD|SAN|SAW|SBG|SBK|SCZ|SDH|SDL|SDT|SEB|SEE|SEF|SEL|SFB|SFT|SGH|SHA|SHG|SHK|SHL|SIG|SIM|SLE|SLF|SLK|SLN|SLS|SLÜ|SLZ|SMÜ|SOB|SOG|SOK|SÖM|SON|SPB|SPN|SRB|SRO|STA|STB|STD|STE|STL|SUL|SÜW|SWA|SZB|TBB|TDO|TET|TIR|TÖL|TUT|UEM|UER|UFF|USI|VAI|VEC|VER|VIB|VIE|VIT|VOH|WAF|WAK|WAN|WAR|WAT|WBS|WDA|WEL|WEN|WER|WES|WHV|WIL|WIS|WIT|WIZ|WLG|WMS|WND|WOB|WOH|WOL|WOR|WOS|WRN|WSF|WST|WSW|WTL|WTM|WUG|WÜM|WUN|WUR|WZL|ZEL|ZIG)[- ]?(([A-Z][- ]?\d{1,4})|([A-Z]{2}[- ]?\d{1,3})))[- ]?(E|H)?$/.test(str);
		},
		"de-LI": function deLI(str) {
			return /^FL[- ]?\d{1,5}[UZ]?$/.test(str);
		},
		"en-IN": function enIN(str) {
			return /^[A-Z]{2}[ -]?[0-9]{1,2}(?:[ -]?[A-Z])(?:[ -]?[A-Z]*)?[ -]?[0-9]{4}$/.test(str);
		},
		"en-SG": function enSG(str) {
			return /^[A-Z]{3}[ -]?[\d]{4}[ -]?[A-Z]{1}$/.test(str);
		},
		"es-AR": function esAR(str) {
			return /^(([A-Z]{2} ?[0-9]{3} ?[A-Z]{2})|([A-Z]{3} ?[0-9]{3}))$/.test(str);
		},
		"fi-FI": function fiFI(str) {
			return /^(?=.{4,7})(([A-Z]{1,3}|[0-9]{1,3})[\s-]?([A-Z]{1,3}|[0-9]{1,5}))$/.test(str);
		},
		"hu-HU": function huHU(str) {
			return /^((((?!AAA)(([A-NPRSTVZWXY]{1})([A-PR-Z]{1})([A-HJ-NPR-Z]))|(A[ABC]I)|A[ABC]O|A[A-W]Q|BPI|BPO|UCO|UDO|XAO)-(?!000)\d{3})|(M\d{6})|((CK|DT|CD|HC|H[ABEFIKLMNPRSTVX]|MA|OT|R[A-Z]) \d{2}-\d{2})|(CD \d{3}-\d{3})|(C-(C|X) \d{4})|(X-(A|B|C) \d{4})|(([EPVZ]-\d{5}))|(S A[A-Z]{2} \d{2})|(SP \d{2}-\d{2}))$/.test(str);
		},
		"pt-BR": function ptBR(str) {
			return /^[A-Z]{3}[ -]?[0-9][A-Z][0-9]{2}|[A-Z]{3}[ -]?[0-9]{4}$/.test(str);
		},
		"pt-PT": function ptPT(str) {
			return /^(([A-Z]{2}[ -·]?[0-9]{2}[ -·]?[0-9]{2})|([0-9]{2}[ -·]?[A-Z]{2}[ -·]?[0-9]{2})|([0-9]{2}[ -·]?[0-9]{2}[ -·]?[A-Z]{2})|([A-Z]{2}[ -·]?[0-9]{2}[ -·]?[A-Z]{2}))$/.test(str);
		},
		"sq-AL": function sqAL(str) {
			return /^[A-Z]{2}[- ]?((\d{3}[- ]?(([A-Z]{2})|T))|(R[- ]?\d{3}))$/.test(str);
		},
		"sv-SE": function svSE(str) {
			return /^[A-HJ-PR-UW-Z]{3} ?[\d]{2}[A-HJ-PR-UW-Z1-9]$|(^[A-ZÅÄÖ ]{2,7}$)/.test(str.trim());
		},
		"en-PK": function enPK(str) {
			return /(^[A-Z]{2}((\s|-){0,1})[0-9]{3,4}((\s|-)[0-9]{2}){0,1}$)|(^[A-Z]{3}((\s|-){0,1})[0-9]{3,4}((\s|-)[0-9]{2}){0,1}$)|(^[A-Z]{4}((\s|-){0,1})[0-9]{3,4}((\s|-)[0-9]{2}){0,1}$)|(^[A-Z]((\s|-){0,1})[0-9]{4}((\s|-)[0-9]{2}){0,1}$)/.test(str.trim());
		}
	};
	function isLicensePlate(str, locale) {
		(0, _assertString.default)(str);
		if (locale in validators) return validators[locale](str);
		else if (locale === "any") {
			for (var key in validators) if ((0, validators[key])(str)) return true;
			return false;
		}
		throw new Error("Invalid locale '".concat(locale, "'"));
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/isStrongPassword.js
var require_isStrongPassword = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = isStrongPassword;
	var _merge = _interopRequireDefault(require_merge());
	var _assertString = _interopRequireDefault(require_assertString());
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	var upperCaseRegex = /^[A-Z]$/;
	var lowerCaseRegex = /^[a-z]$/;
	var numberRegex = /^[0-9]$/;
	var symbolRegex = /^[-#!$@£%^&*()_+|~=`{}\[\]:";'<>?,.\/\\ ]$/;
	var defaultOptions = {
		minLength: 8,
		minLowercase: 1,
		minUppercase: 1,
		minNumbers: 1,
		minSymbols: 1,
		returnScore: false,
		pointsPerUnique: 1,
		pointsPerRepeat: .5,
		pointsForContainingLower: 10,
		pointsForContainingUpper: 10,
		pointsForContainingNumber: 10,
		pointsForContainingSymbol: 10
	};
	function countChars(str) {
		var result = {};
		Array.from(str).forEach(function(char) {
			if (result[char]) result[char] += 1;
			else result[char] = 1;
		});
		return result;
	}
	function analyzePassword(password) {
		var charMap = countChars(password);
		var analysis = {
			length: password.length,
			uniqueChars: Object.keys(charMap).length,
			uppercaseCount: 0,
			lowercaseCount: 0,
			numberCount: 0,
			symbolCount: 0
		};
		Object.keys(charMap).forEach(function(char) {
			/* istanbul ignore else */
			if (upperCaseRegex.test(char)) analysis.uppercaseCount += charMap[char];
			else if (lowerCaseRegex.test(char)) analysis.lowercaseCount += charMap[char];
			else if (numberRegex.test(char)) analysis.numberCount += charMap[char];
			else if (symbolRegex.test(char)) analysis.symbolCount += charMap[char];
		});
		return analysis;
	}
	function scorePassword(analysis, scoringOptions) {
		var points = 0;
		points += analysis.uniqueChars * scoringOptions.pointsPerUnique;
		points += (analysis.length - analysis.uniqueChars) * scoringOptions.pointsPerRepeat;
		if (analysis.lowercaseCount > 0) points += scoringOptions.pointsForContainingLower;
		if (analysis.uppercaseCount > 0) points += scoringOptions.pointsForContainingUpper;
		if (analysis.numberCount > 0) points += scoringOptions.pointsForContainingNumber;
		if (analysis.symbolCount > 0) points += scoringOptions.pointsForContainingSymbol;
		return points;
	}
	function isStrongPassword(str) {
		var options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
		(0, _assertString.default)(str);
		var analysis = analyzePassword(str);
		options = (0, _merge.default)(options || {}, defaultOptions);
		if (options.returnScore) return scorePassword(analysis, options);
		return analysis.length >= options.minLength && analysis.lowercaseCount >= options.minLowercase && analysis.uppercaseCount >= options.minUppercase && analysis.numberCount >= options.minNumbers && analysis.symbolCount >= options.minSymbols;
	}
	module.exports = exports.default;
	module.exports.default = exports.default;
}));
// node_modules/validator/lib/isVAT.js
var require_isVAT = /* @__PURE__ */ __commonJSMin(((exports) => {
	function _typeof(o) {
		"@babel/helpers - typeof";
		return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o) {
			return typeof o;
		} : function(o) {
			return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
		}, _typeof(o);
	}
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = isVAT;
	exports.vatMatchers = void 0;
	var _assertString = _interopRequireDefault(require_assertString());
	var algorithms = _interopRequireWildcard(require_algorithms());
	function _interopRequireWildcard(e, t) {
		if ("function" == typeof WeakMap) var r = /* @__PURE__ */ new WeakMap(), n = /* @__PURE__ */ new WeakMap();
		return (_interopRequireWildcard = function _interopRequireWildcard(e, t) {
			if (!t && e && e.__esModule) return e;
			var o, i, f = {
				__proto__: null,
				default: e
			};
			if (null === e || "object" != _typeof(e) && "function" != typeof e) return f;
			if (o = t ? n : r) {
				if (o.has(e)) return o.get(e);
				o.set(e, f);
			}
			for (var _t in e) "default" !== _t && {}.hasOwnProperty.call(e, _t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, _t)) && (i.get || i.set) ? o(f, _t, i) : f[_t] = e[_t]);
			return f;
		})(e, t);
	}
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	var vatMatchers = exports.vatMatchers = {
		/**
		* European Union VAT identification numbers
		*/
		AT: function AT(str) {
			return /^(AT)?U\d{8}$/.test(str);
		},
		BE: function BE(str) {
			return /^(BE)?\d{10}$/.test(str);
		},
		BG: function BG(str) {
			return /^(BG)?\d{9,10}$/.test(str);
		},
		HR: function HR(str) {
			return /^(HR)?\d{11}$/.test(str);
		},
		CY: function CY(str) {
			return /^(CY)?\w{9}$/.test(str);
		},
		CZ: function CZ(str) {
			return /^(CZ)?\d{8,10}$/.test(str);
		},
		DK: function DK(str) {
			return /^(DK)?\d{8}$/.test(str);
		},
		EE: function EE(str) {
			return /^(EE)?\d{9}$/.test(str);
		},
		FI: function FI(str) {
			return /^(FI)?\d{8}$/.test(str);
		},
		FR: function FR(str) {
			return /^(FR)([A-Z0-9]{2}\d{9})$/.test(str);
		},
		DE: function DE(str) {
			return /^(DE)?\d{9}$/.test(str);
		},
		EL: function EL(str) {
			return /^(EL)?\d{9}$/.test(str);
		},
		HU: function HU(str) {
			return /^(HU)?\d{8}$/.test(str);
		},
		IE: function IE(str) {
			return /^(IE)?\d{7}\w{1}(W)?$/.test(str);
		},
		IT: function IT(str) {
			return /^(IT)?\d{11}$/.test(str);
		},
		LV: function LV(str) {
			return /^(LV)?\d{11}$/.test(str);
		},
		LT: function LT(str) {
			return /^(LT)?\d{9,12}$/.test(str);
		},
		LU: function LU(str) {
			return /^(LU)?\d{8}$/.test(str);
		},
		MT: function MT(str) {
			return /^(MT)?\d{8}$/.test(str);
		},
		NL: function NL(str) {
			return /^(NL)?\d{9}B\d{2}$/.test(str);
		},
		PL: function PL(str) {
			return /^(PL)?(\d{10}|(\d{3}-\d{3}-\d{2}-\d{2})|(\d{3}-\d{2}-\d{2}-\d{3}))$/.test(str);
		},
		PT: function PT(str) {
			var match = str.match(/^(PT)?(\d{9})$/);
			if (!match) return false;
			var tin = match[2];
			var checksum = 11 - algorithms.reverseMultiplyAndSum(tin.split("").slice(0, 8).map(function(a) {
				return parseInt(a, 10);
			}), 9) % 11;
			if (checksum > 9) return parseInt(tin[8], 10) === 0;
			return checksum === parseInt(tin[8], 10);
		},
		RO: function RO(str) {
			return /^(RO)?\d{2,10}$/.test(str);
		},
		SK: function SK(str) {
			return /^(SK)?\d{10}$/.test(str);
		},
		SI: function SI(str) {
			return /^(SI)?\d{8}$/.test(str);
		},
		ES: function ES(str) {
			return /^(ES)?\w\d{7}[A-Z]$/.test(str);
		},
		SE: function SE(str) {
			return /^(SE)?\d{12}$/.test(str);
		},
		/**
		* VAT numbers of non-EU countries
		*/
		AL: function AL(str) {
			return /^(AL)?\w{9}[A-Z]$/.test(str);
		},
		MK: function MK(str) {
			return /^(MK)?\d{13}$/.test(str);
		},
		AU: function AU(str) {
			if (!str.match(/^(AU)?(\d{11})$/)) return false;
			var weights = [
				10,
				1,
				3,
				5,
				7,
				9,
				11,
				13,
				15,
				17,
				19
			];
			str = str.replace(/^AU/, "");
			var ABN = (parseInt(str.slice(0, 1), 10) - 1).toString() + str.slice(1);
			var total = 0;
			for (var i = 0; i < 11; i++) total += weights[i] * ABN.charAt(i);
			return total !== 0 && total % 89 === 0;
		},
		BY: function BY(str) {
			return /^(УНП )?\d{9}$/.test(str);
		},
		CA: function CA(str) {
			return /^(CA)?\d{9}$/.test(str);
		},
		IS: function IS(str) {
			return /^(IS)?\d{5,6}$/.test(str);
		},
		IN: function IN(str) {
			return /^(IN)?\d{15}$/.test(str);
		},
		ID: function ID(str) {
			return /^(ID)?(\d{15}|(\d{2}.\d{3}.\d{3}.\d{1}-\d{3}.\d{3}))$/.test(str);
		},
		IL: function IL(str) {
			return /^(IL)?\d{9}$/.test(str);
		},
		KZ: function KZ(str) {
			return /^(KZ)?\d{12}$/.test(str);
		},
		NZ: function NZ(str) {
			return /^(NZ)?\d{9}$/.test(str);
		},
		NG: function NG(str) {
			return /^(NG)?(\d{12}|(\d{8}-\d{4}))$/.test(str);
		},
		NO: function NO(str) {
			return /^(NO)?\d{9}MVA$/.test(str);
		},
		PH: function PH(str) {
			return /^(PH)?(\d{12}|\d{3} \d{3} \d{3} \d{3})$/.test(str);
		},
		RU: function RU(str) {
			return /^(RU)?(\d{10}|\d{12})$/.test(str);
		},
		SM: function SM(str) {
			return /^(SM)?\d{5}$/.test(str);
		},
		SA: function SA(str) {
			return /^(SA)?\d{15}$/.test(str);
		},
		RS: function RS(str) {
			return /^(RS)?\d{9}$/.test(str);
		},
		CH: function CH(str) {
			return /^(CHE[- ]?)?(\d{9}|(\d{3}\.\d{3}\.\d{3})|(\d{3} \d{3} \d{3})) ?(TVA|MWST|IVA)?$/.test(str) && function hasValidCheckNumber(digits) {
				var lastDigit = digits.pop();
				var weights = [
					5,
					4,
					3,
					2,
					7,
					6,
					5,
					4
				];
				return lastDigit === (11 - digits.reduce(function(acc, el, idx) {
					return acc + el * weights[idx];
				}, 0) % 11) % 11;
			}(str.match(/\d/g).map(function(el) {
				return +el;
			}));
		},
		TR: function TR(str) {
			return /^(TR)?\d{10}$/.test(str);
		},
		UA: function UA(str) {
			return /^(UA)?\d{12}$/.test(str);
		},
		GB: function GB(str) {
			return /^GB((\d{3} \d{4} ([0-8][0-9]|9[0-6]))|(\d{9} \d{3})|(((GD[0-4])|(HA[5-9]))[0-9]{2}))$/.test(str);
		},
		UZ: function UZ(str) {
			return /^(UZ)?\d{9}$/.test(str);
		},
		/**
		* VAT numbers of Latin American countries
		*/
		AR: function AR(str) {
			return /^(AR)?\d{11}$/.test(str);
		},
		BO: function BO(str) {
			return /^(BO)?\d{7}$/.test(str);
		},
		BR: function BR(str) {
			return /^(BR)?((\d{2}.\d{3}.\d{3}\/\d{4}-\d{2})|(\d{3}.\d{3}.\d{3}-\d{2}))$/.test(str);
		},
		CL: function CL(str) {
			return /^(CL)?\d{8}-\d{1}$/.test(str);
		},
		CO: function CO(str) {
			return /^(CO)?\d{10}$/.test(str);
		},
		CR: function CR(str) {
			return /^(CR)?\d{9,12}$/.test(str);
		},
		EC: function EC(str) {
			return /^(EC)?\d{13}$/.test(str);
		},
		SV: function SV(str) {
			return /^(SV)?\d{4}-\d{6}-\d{3}-\d{1}$/.test(str);
		},
		GT: function GT(str) {
			return /^(GT)?\d{7}-\d{1}$/.test(str);
		},
		HN: function HN(str) {
			return /^(HN)?$/.test(str);
		},
		MX: function MX(str) {
			return /^(MX)?\w{3,4}\d{6}\w{3}$/.test(str);
		},
		NI: function NI(str) {
			return /^(NI)?\d{3}-\d{6}-\d{4}\w{1}$/.test(str);
		},
		PA: function PA(str) {
			return /^(PA)?$/.test(str);
		},
		PY: function PY(str) {
			return /^(PY)?\d{6,8}-\d{1}$/.test(str);
		},
		PE: function PE(str) {
			return /^(PE)?\d{11}$/.test(str);
		},
		DO: function DO(str) {
			return /^(DO)?(\d{11}|(\d{3}-\d{7}-\d{1})|[1,4,5]{1}\d{8}|([1,4,5]{1})-\d{2}-\d{5}-\d{1})$/.test(str);
		},
		UY: function UY(str) {
			return /^(UY)?\d{12}$/.test(str);
		},
		VE: function VE(str) {
			return /^(VE)?[J,G,V,E]{1}-(\d{9}|(\d{8}-\d{1}))$/.test(str);
		}
	};
	function isVAT(str, countryCode) {
		(0, _assertString.default)(str);
		(0, _assertString.default)(countryCode);
		if (countryCode in vatMatchers) return vatMatchers[countryCode](str);
		throw new Error("Invalid country code: '".concat(countryCode, "'"));
	}
}));
// src/InputParser.ts
var import_validator = /* @__PURE__ */ __toESM((/* @__PURE__ */ __commonJSMin(((exports, module) => {
	function _typeof(o) {
		"@babel/helpers - typeof";
		return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o) {
			return typeof o;
		} : function(o) {
			return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
		}, _typeof(o);
	}
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = void 0;
	var _toDate = _interopRequireDefault(require_toDate());
	var _toFloat = _interopRequireDefault(require_toFloat());
	var _toInt = _interopRequireDefault(require_toInt());
	var _toBoolean = _interopRequireDefault(require_toBoolean());
	var _equals = _interopRequireDefault(require_equals());
	var _contains = _interopRequireDefault(require_contains());
	var _matches = _interopRequireDefault(require_matches());
	var _isEmail = _interopRequireDefault(require_isEmail());
	var _isURL = _interopRequireDefault(require_isURL());
	var _isMACAddress = _interopRequireDefault(require_isMACAddress());
	var _isIP = _interopRequireDefault(require_isIP());
	var _isIPRange = _interopRequireDefault(require_isIPRange());
	var _isFQDN = _interopRequireDefault(require_isFQDN());
	var _isDate = _interopRequireDefault(require_isDate());
	var _isTime = _interopRequireDefault(require_isTime());
	var _isBoolean = _interopRequireDefault(require_isBoolean());
	var _isLocale = _interopRequireDefault(require_isLocale());
	var _isAbaRouting = _interopRequireDefault(require_isAbaRouting());
	var _isAlpha = _interopRequireWildcard(require_isAlpha());
	var _isAlphanumeric = _interopRequireWildcard(require_isAlphanumeric());
	var _isNumeric = _interopRequireDefault(require_isNumeric());
	var _isPassportNumber = _interopRequireWildcard(require_isPassportNumber());
	var _isPort = _interopRequireDefault(require_isPort());
	var _isLowercase = _interopRequireDefault(require_isLowercase());
	var _isUppercase = _interopRequireDefault(require_isUppercase());
	var _isIMEI = _interopRequireDefault(require_isIMEI());
	var _isAscii = _interopRequireDefault(require_isAscii());
	var _isFullWidth = _interopRequireDefault(require_isFullWidth());
	var _isHalfWidth = _interopRequireDefault(require_isHalfWidth());
	var _isVariableWidth = _interopRequireDefault(require_isVariableWidth());
	var _isMultibyte = _interopRequireDefault(require_isMultibyte());
	var _isSemVer = _interopRequireDefault(require_isSemVer());
	var _isSurrogatePair = _interopRequireDefault(require_isSurrogatePair());
	var _isInt = _interopRequireDefault(require_isInt());
	var _isFloat = _interopRequireWildcard(require_isFloat());
	var _isDecimal = _interopRequireDefault(require_isDecimal());
	var _isHexadecimal = _interopRequireDefault(require_isHexadecimal());
	var _isOctal = _interopRequireDefault(require_isOctal());
	var _isDivisibleBy = _interopRequireDefault(require_isDivisibleBy());
	var _isHexColor = _interopRequireDefault(require_isHexColor());
	var _isRgbColor = _interopRequireDefault(require_isRgbColor());
	var _isHSL = _interopRequireDefault(require_isHSL());
	var _isISRC = _interopRequireDefault(require_isISRC());
	var _isIBAN = _interopRequireWildcard(require_isIBAN());
	var _isBIC = _interopRequireDefault(require_isBIC());
	var _isMD = _interopRequireDefault(require_isMD5());
	var _isHash = _interopRequireDefault(require_isHash());
	var _isJWT = _interopRequireDefault(require_isJWT());
	var _isJSON = _interopRequireDefault(require_isJSON());
	var _isEmpty = _interopRequireDefault(require_isEmpty());
	var _isLength = _interopRequireDefault(require_isLength());
	var _isByteLength = _interopRequireDefault(require_isByteLength());
	var _isULID = _interopRequireDefault(require_isULID());
	var _isUUID = _interopRequireDefault(require_isUUID());
	var _isMongoId = _interopRequireDefault(require_isMongoId());
	var _isAfter = _interopRequireDefault(require_isAfter());
	var _isBefore = _interopRequireDefault(require_isBefore());
	var _isIn = _interopRequireDefault(require_isIn());
	var _isLuhnNumber = _interopRequireDefault(require_isLuhnNumber());
	var _isCreditCard = _interopRequireDefault(require_isCreditCard());
	var _isIdentityCard = _interopRequireDefault(require_isIdentityCard());
	var _isEAN = _interopRequireDefault(require_isEAN());
	var _isISIN = _interopRequireDefault(require_isISIN());
	var _isISBN = _interopRequireDefault(require_isISBN());
	var _isISSN = _interopRequireDefault(require_isISSN());
	var _isTaxID = _interopRequireDefault(require_isTaxID());
	var _isMobilePhone = _interopRequireWildcard(require_isMobilePhone());
	var _isEthereumAddress = _interopRequireDefault(require_isEthereumAddress());
	var _isCurrency = _interopRequireDefault(require_isCurrency());
	var _isBtcAddress = _interopRequireDefault(require_isBtcAddress());
	var _isISO = require_isISO6346();
	var _isISO2 = _interopRequireDefault(require_isISO6391());
	var _isISO3 = _interopRequireDefault(require_isISO8601());
	var _isRFC = _interopRequireDefault(require_isRFC3339());
	var _isISO4 = _interopRequireDefault(require_isISO15924());
	var _isISO31661Alpha = _interopRequireDefault(require_isISO31661Alpha2());
	var _isISO31661Alpha2 = _interopRequireDefault(require_isISO31661Alpha3());
	var _isISO31661Numeric = _interopRequireDefault(require_isISO31661Numeric());
	var _isISO5 = _interopRequireDefault(require_isISO4217());
	var _isBase = _interopRequireDefault(require_isBase32());
	var _isBase2 = _interopRequireDefault(require_isBase58());
	var _isBase3 = _interopRequireDefault(require_isBase64());
	var _isDataURI = _interopRequireDefault(require_isDataURI());
	var _isMagnetURI = _interopRequireDefault(require_isMagnetURI());
	var _isMailtoURI = _interopRequireDefault(require_isMailtoURI());
	var _isMimeType = _interopRequireDefault(require_isMimeType());
	var _isLatLong = _interopRequireDefault(require_isLatLong());
	var _isPostalCode = _interopRequireWildcard(require_isPostalCode());
	var _ltrim = _interopRequireDefault(require_ltrim());
	var _rtrim = _interopRequireDefault(require_rtrim());
	var _trim = _interopRequireDefault(require_trim());
	var _escape = _interopRequireDefault(require_escape());
	var _unescape = _interopRequireDefault(require_unescape());
	var _stripLow = _interopRequireDefault(require_stripLow());
	var _whitelist = _interopRequireDefault(require_whitelist());
	var _blacklist = _interopRequireDefault(require_blacklist());
	var _isWhitelisted = _interopRequireDefault(require_isWhitelisted());
	var _normalizeEmail = _interopRequireDefault(require_normalizeEmail());
	var _isSlug = _interopRequireDefault(require_isSlug());
	var _isLicensePlate = _interopRequireDefault(require_isLicensePlate());
	var _isStrongPassword = _interopRequireDefault(require_isStrongPassword());
	var _isVAT = _interopRequireDefault(require_isVAT());
	function _interopRequireWildcard(e, t) {
		if ("function" == typeof WeakMap) var r = /* @__PURE__ */ new WeakMap(), n = /* @__PURE__ */ new WeakMap();
		return (_interopRequireWildcard = function _interopRequireWildcard(e, t) {
			if (!t && e && e.__esModule) return e;
			var o, i, f = {
				__proto__: null,
				default: e
			};
			if (null === e || "object" != _typeof(e) && "function" != typeof e) return f;
			if (o = t ? n : r) {
				if (o.has(e)) return o.get(e);
				o.set(e, f);
			}
			for (var _t in e) "default" !== _t && {}.hasOwnProperty.call(e, _t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, _t)) && (i.get || i.set) ? o(f, _t, i) : f[_t] = e[_t]);
			return f;
		})(e, t);
	}
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	exports.default = {
		version: "13.15.35",
		toDate: _toDate.default,
		toFloat: _toFloat.default,
		toInt: _toInt.default,
		toBoolean: _toBoolean.default,
		equals: _equals.default,
		contains: _contains.default,
		matches: _matches.default,
		isEmail: _isEmail.default,
		isURL: _isURL.default,
		isMACAddress: _isMACAddress.default,
		isIP: _isIP.default,
		isIPRange: _isIPRange.default,
		isFQDN: _isFQDN.default,
		isBoolean: _isBoolean.default,
		isIBAN: _isIBAN.default,
		isBIC: _isBIC.default,
		isAbaRouting: _isAbaRouting.default,
		isAlpha: _isAlpha.default,
		isAlphaLocales: _isAlpha.locales,
		isAlphanumeric: _isAlphanumeric.default,
		isAlphanumericLocales: _isAlphanumeric.locales,
		isNumeric: _isNumeric.default,
		isPassportNumber: _isPassportNumber.default,
		passportNumberLocales: _isPassportNumber.locales,
		isPort: _isPort.default,
		isLowercase: _isLowercase.default,
		isUppercase: _isUppercase.default,
		isAscii: _isAscii.default,
		isFullWidth: _isFullWidth.default,
		isHalfWidth: _isHalfWidth.default,
		isVariableWidth: _isVariableWidth.default,
		isMultibyte: _isMultibyte.default,
		isSemVer: _isSemVer.default,
		isSurrogatePair: _isSurrogatePair.default,
		isInt: _isInt.default,
		isIMEI: _isIMEI.default,
		isFloat: _isFloat.default,
		isFloatLocales: _isFloat.locales,
		isDecimal: _isDecimal.default,
		isHexadecimal: _isHexadecimal.default,
		isOctal: _isOctal.default,
		isDivisibleBy: _isDivisibleBy.default,
		isHexColor: _isHexColor.default,
		isRgbColor: _isRgbColor.default,
		isHSL: _isHSL.default,
		isISRC: _isISRC.default,
		isMD5: _isMD.default,
		isHash: _isHash.default,
		isJWT: _isJWT.default,
		isJSON: _isJSON.default,
		isEmpty: _isEmpty.default,
		isLength: _isLength.default,
		isLocale: _isLocale.default,
		isByteLength: _isByteLength.default,
		isULID: _isULID.default,
		isUUID: _isUUID.default,
		isMongoId: _isMongoId.default,
		isAfter: _isAfter.default,
		isBefore: _isBefore.default,
		isIn: _isIn.default,
		isLuhnNumber: _isLuhnNumber.default,
		isCreditCard: _isCreditCard.default,
		isIdentityCard: _isIdentityCard.default,
		isEAN: _isEAN.default,
		isISIN: _isISIN.default,
		isISBN: _isISBN.default,
		isISSN: _isISSN.default,
		isMobilePhone: _isMobilePhone.default,
		isMobilePhoneLocales: _isMobilePhone.locales,
		isPostalCode: _isPostalCode.default,
		isPostalCodeLocales: _isPostalCode.locales,
		isEthereumAddress: _isEthereumAddress.default,
		isCurrency: _isCurrency.default,
		isBtcAddress: _isBtcAddress.default,
		isISO6346: _isISO.isISO6346,
		isFreightContainerID: _isISO.isFreightContainerID,
		isISO6391: _isISO2.default,
		isISO8601: _isISO3.default,
		isISO15924: _isISO4.default,
		isRFC3339: _isRFC.default,
		isISO31661Alpha2: _isISO31661Alpha.default,
		isISO31661Alpha3: _isISO31661Alpha2.default,
		isISO31661Numeric: _isISO31661Numeric.default,
		isISO4217: _isISO5.default,
		isBase32: _isBase.default,
		isBase58: _isBase2.default,
		isBase64: _isBase3.default,
		isDataURI: _isDataURI.default,
		isMagnetURI: _isMagnetURI.default,
		isMailtoURI: _isMailtoURI.default,
		isMimeType: _isMimeType.default,
		isLatLong: _isLatLong.default,
		ltrim: _ltrim.default,
		rtrim: _rtrim.default,
		trim: _trim.default,
		escape: _escape.default,
		unescape: _unescape.default,
		stripLow: _stripLow.default,
		whitelist: _whitelist.default,
		blacklist: _blacklist.default,
		isWhitelisted: _isWhitelisted.default,
		normalizeEmail: _normalizeEmail.default,
		toString,
		isSlug: _isSlug.default,
		isStrongPassword: _isStrongPassword.default,
		isTaxID: _isTaxID.default,
		isDate: _isDate.default,
		isTime: _isTime.default,
		isLicensePlate: _isLicensePlate.default,
		isVAT: _isVAT.default,
		ibanLocales: _isIBAN.locales
	};
	module.exports = exports.default;
	module.exports.default = exports.default;
})))(), 1);
var InputParser = class {
	static getMultilineString = (name) => {
		return getMultilineInput(name);
	};
	static getString = (name) => {
		return getInput(name);
	};
	static getJsonFormatted = (name) => {
		const value = getInput(name);
		if (value.length === 0) return {};
		const parsed = JSON.parse(value);
		if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) throw Error(`Invalid argument value for ${name}, pass a json object`);
		return parsed;
	};
	static getStringArray = (name) => {
		return getInput(name).split(",").map((entry) => entry.trim()).filter((entry) => entry.length !== 0);
	};
	static getBoolean = (name, defaultValue = false) => {
		const value = getInput(name);
		if (value.length === 0) return defaultValue;
		if (!import_validator.default.isBoolean(value, { loose: false })) throw Error(`Invalid argument value for ${name}`);
		return import_validator.default.toBoolean(value, true);
	};
	static getNumber = (name, defaultValue = NaN) => {
		const value = getInput(name);
		if (value.length === 0) return defaultValue;
		if (!import_validator.default.isInt(value)) throw Error(`Invalid argument value for ${name}`);
		return import_validator.default.toInt(value);
	};
};
// src/ConfigManager.ts
var ConfigManager = class ConfigManager {
	static exportIgnoredEnvs = [
		"host",
		"port",
		"key",
		"passphrase",
		"user",
		"password",
		"fingerprint",
		"command",
		"ignoredEnvs",
		"envs",
		"exportActionOptions",
		"tty",
		"connectTimeout",
		"timeout"
	];
	static envKeyPattern = /^[A-Za-z_][A-Za-z0-9_]*$/;
	config;
	constructor(validate = true) {
		const config = {
			host: InputParser.getString("host"),
			port: InputParser.getNumber("port"),
			key: InputParser.getString("key"),
			passphrase: InputParser.getString("passphrase"),
			user: InputParser.getString("user"),
			password: InputParser.getString("password"),
			fingerprint: InputParser.getString("fingerprint"),
			envs: [],
			command: InputParser.getMultilineString("command"),
			ignoredEnvs: InputParser.getStringArray("ignoredEnvs"),
			exportActionOptions: InputParser.getBoolean("exportActionOptions", false),
			tty: InputParser.getBoolean("tty", false),
			connectTimeout: InputParser.getNumber("connectTimeout", 20),
			timeout: InputParser.getNumber("timeout", 0)
		};
		let rawEnvs;
		try {
			rawEnvs = InputParser.getJsonFormatted("envs");
		} catch {
			throw new Error("Envs variable must be a json formatted string, make sure you pass correct values");
		}
		for (const [key, rawValue] of Object.entries(rawEnvs)) {
			if (config.ignoredEnvs.includes(key)) continue;
			if (!ConfigManager.envKeyPattern.test(key)) throw new Error(`Invalid env name "${key}", only letters, digits and underscores are allowed`);
			const value = typeof rawValue === "string" ? rawValue : JSON.stringify(rawValue);
			debug(`Registering ${key} ...`);
			config.envs.push({
				key,
				value
			});
		}
		this.config = config;
		if (validate) this.validate();
	}
	validate = () => {
		if (!this.config.host) throw new Error("Missing host");
		if (!import_validator.default.isInt(String(this.config.port), {
			min: 1,
			max: 65535
		})) throw new Error("Invalid port, it must be a number between 1 and 65535");
		if (!this.config.user) throw new Error("Missing user");
		if (!this.config.password && !this.config.key) throw new Error("Missing credentials, please provide at least one way to authenticate");
		if (!import_validator.default.isInt(String(this.config.connectTimeout), { min: 1 })) throw new Error("Invalid connectTimeout, it must be a number of seconds greater than 0");
		if (!import_validator.default.isInt(String(this.config.timeout), { min: 0 })) throw new Error("Invalid timeout, it must be a number of seconds, 0 disables it");
		if (this.config.command.length === 0) throw new Error("Provide command to execute when connected");
	};
};
// node_modules/sb-promise-queue/lib/esm/index.mjs
var PromiseQueue = class {
	constructor({ concurrency = 1 } = {}) {
		this.options = { concurrency };
		this.running = 0;
		this.queue = [];
		this.idleCallbacks = [];
	}
	clear() {
		this.queue = [];
	}
	onIdle(callback) {
		this.idleCallbacks.push(callback);
		return () => {
			const index = this.idleCallbacks.indexOf(callback);
			if (index !== -1) this.idleCallbacks.splice(index, 1);
		};
	}
	waitTillIdle() {
		return new Promise((resolve) => {
			if (this.running === 0) {
				resolve();
				return;
			}
			const dispose = this.onIdle(() => {
				dispose();
				resolve();
			});
		});
	}
	add(callback) {
		return new Promise((resolve, reject) => {
			const runCallback = () => {
				this.running += 1;
				try {
					Promise.resolve(callback()).then((val) => {
						resolve(val);
						this.processNext();
					}, (err) => {
						reject(err);
						this.processNext();
					});
				} catch (err) {
					reject(err);
					this.processNext();
				}
			};
			if (this.running >= this.options.concurrency) this.queue.push(runCallback);
			else runCallback();
		});
	}
	processNext() {
		this.running -= 1;
		const callback = this.queue.shift();
		if (callback) callback();
		else if (this.running === 0) this.idleCallbacks.forEach((item) => item());
	}
};
// node_modules/sb-scandir/lib/esm/index.mjs
const defaultFilesystem = {
	join(pathA, pathB) {
		return fsPath.join(pathA, pathB);
	},
	basename(path) {
		return fsPath.basename(path);
	},
	stat(path) {
		return new Promise((resolve, reject) => {
			fs$1.stat(path, (err, res) => {
				if (err) reject(err);
				else resolve(res);
			});
		});
	},
	readdir(path) {
		return new Promise((resolve, reject) => {
			fs$1.readdir(path, (err, res) => {
				if (err) reject(err);
				else resolve(res);
			});
		});
	}
};
async function scanDirectoryInternal({ path, recursive, validate, result, fileSystem, queue, reject }) {
	const itemStat = await fileSystem.stat(path);
	if (itemStat.isFile()) result.files.push(path);
	else if (itemStat.isDirectory()) result.directories.push(path);
	if (!itemStat.isDirectory() || recursive === "none") return;
	(await fileSystem.readdir(path)).forEach((item) => {
		const itemPath = fileSystem.join(path, item);
		if (!validate(itemPath)) return;
		queue.add(() => scanDirectoryInternal({
			path: itemPath,
			recursive: recursive === "shallow" ? "none" : "deep",
			validate,
			result,
			fileSystem,
			queue,
			reject
		})).catch(reject);
	});
}
async function scanDirectory(path, { recursive = true, validate = null, concurrency = 1e400, fileSystem = defaultFilesystem } = {}) {
	invariant(path && typeof path === "string", "path must be a valid string");
	invariant(typeof recursive === "boolean", "options.recursive must be a valid boolean");
	invariant(validate === null || typeof validate === "function", "options.validate must be a valid function");
	invariant(typeof concurrency === "number", "options.concurrency must be a valid number");
	invariant(fileSystem !== null && typeof fileSystem === "object", "options.fileSystem must be a valid object");
	const queue = new PromiseQueue({ concurrency });
	const result = {
		files: [],
		directories: []
	};
	const mergedFileSystem = {
		...defaultFilesystem,
		...fileSystem
	};
	await new Promise((resolve, reject) => {
		scanDirectoryInternal({
			path,
			recursive: recursive ? "deep" : "shallow",
			validate: validate != null ? validate : (item) => mergedFileSystem.basename(item).slice(0, 1) !== ".",
			result,
			fileSystem: mergedFileSystem,
			queue,
			reject
		}).then(() => queue.waitTillIdle()).then(resolve, reject);
	});
	return result;
}
// node_modules/shell-escape/shell-escape.js
var require_shell_escape = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = shellescape;
	function shellescape(a) {
		var ret = [];
		a.forEach(function(s) {
			if (!/^[A-Za-z0-9_\/-]+$/.test(s)) {
				s = "'" + s.replace(/'/g, "'\\''") + "'";
				s = s.replace(/^(?:'')+/g, "").replace(/\\'''/g, "\\'");
			}
			ret.push(s);
		});
		return ret.join(" ");
	}
}));
// node_modules/asn1/lib/ber/errors.js
var require_errors = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = { newInvalidAsn1Error: function(msg) {
		var e = /* @__PURE__ */ new Error();
		e.name = "InvalidAsn1Error";
		e.message = msg || "";
		return e;
	} };
}));
// node_modules/asn1/lib/ber/types.js
var require_types = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = {
		EOC: 0,
		Boolean: 1,
		Integer: 2,
		BitString: 3,
		OctetString: 4,
		Null: 5,
		OID: 6,
		ObjectDescriptor: 7,
		External: 8,
		Real: 9,
		Enumeration: 10,
		PDV: 11,
		Utf8String: 12,
		RelativeOID: 13,
		Sequence: 16,
		Set: 17,
		NumericString: 18,
		PrintableString: 19,
		T61String: 20,
		VideotexString: 21,
		IA5String: 22,
		UTCTime: 23,
		GeneralizedTime: 24,
		GraphicString: 25,
		VisibleString: 26,
		GeneralString: 28,
		UniversalString: 29,
		CharacterString: 30,
		BMPString: 31,
		Constructor: 32,
		Context: 128
	};
}));
// node_modules/safer-buffer/safer.js
var require_safer = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var buffer = __require("buffer");
	var Buffer = buffer.Buffer;
	var safer = {};
	var key;
	for (key in buffer) {
		if (!buffer.hasOwnProperty(key)) continue;
		if (key === "SlowBuffer" || key === "Buffer") continue;
		safer[key] = buffer[key];
	}
	var Safer = safer.Buffer = {};
	for (key in Buffer) {
		if (!Buffer.hasOwnProperty(key)) continue;
		if (key === "allocUnsafe" || key === "allocUnsafeSlow") continue;
		Safer[key] = Buffer[key];
	}
	safer.Buffer.prototype = Buffer.prototype;
	if (!Safer.from || Safer.from === Uint8Array.from) Safer.from = function(value, encodingOrOffset, length) {
		if (typeof value === "number") throw new TypeError("The \"value\" argument must not be of type number. Received type " + typeof value);
		if (value && typeof value.length === "undefined") throw new TypeError("The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof value);
		return Buffer(value, encodingOrOffset, length);
	};
	if (!Safer.alloc) Safer.alloc = function(size, fill, encoding) {
		if (typeof size !== "number") throw new TypeError("The \"size\" argument must be of type number. Received type " + typeof size);
		if (size < 0 || size >= 2 * (1 << 30)) throw new RangeError("The value \"" + size + "\" is invalid for option \"size\"");
		var buf = Buffer(size);
		if (!fill || fill.length === 0) buf.fill(0);
		else if (typeof encoding === "string") buf.fill(fill, encoding);
		else buf.fill(fill);
		return buf;
	};
	if (!safer.kStringMaxLength) try {
		safer.kStringMaxLength = process.binding("buffer").kStringMaxLength;
	} catch (e) {}
	if (!safer.constants) {
		safer.constants = { MAX_LENGTH: safer.kMaxLength };
		if (safer.kStringMaxLength) safer.constants.MAX_STRING_LENGTH = safer.kStringMaxLength;
	}
	module.exports = safer;
}));
// node_modules/asn1/lib/ber/reader.js
var require_reader = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var assert = __require("assert");
	var Buffer = require_safer().Buffer;
	var ASN1 = require_types();
	var newInvalidAsn1Error = require_errors().newInvalidAsn1Error;
	function Reader(data) {
		if (!data || !Buffer.isBuffer(data)) throw new TypeError("data must be a node Buffer");
		this._buf = data;
		this._size = data.length;
		this._len = 0;
		this._offset = 0;
	}
	Object.defineProperty(Reader.prototype, "length", {
		enumerable: true,
		get: function() {
			return this._len;
		}
	});
	Object.defineProperty(Reader.prototype, "offset", {
		enumerable: true,
		get: function() {
			return this._offset;
		}
	});
	Object.defineProperty(Reader.prototype, "remain", { get: function() {
		return this._size - this._offset;
	} });
	Object.defineProperty(Reader.prototype, "buffer", { get: function() {
		return this._buf.slice(this._offset);
	} });
	/**
	* Reads a single byte and advances offset; you can pass in `true` to make this
	* a "peek" operation (i.e., get the byte, but don't advance the offset).
	*
	* @param {Boolean} peek true means don't move offset.
	* @return {Number} the next byte, null if not enough data.
	*/
	Reader.prototype.readByte = function(peek) {
		if (this._size - this._offset < 1) return null;
		var b = this._buf[this._offset] & 255;
		if (!peek) this._offset += 1;
		return b;
	};
	Reader.prototype.peek = function() {
		return this.readByte(true);
	};
	/**
	* Reads a (potentially) variable length off the BER buffer.  This call is
	* not really meant to be called directly, as callers have to manipulate
	* the internal buffer afterwards.
	*
	* As a result of this call, you can call `Reader.length`, until the
	* next thing called that does a readLength.
	*
	* @return {Number} the amount of offset to advance the buffer.
	* @throws {InvalidAsn1Error} on bad ASN.1
	*/
	Reader.prototype.readLength = function(offset) {
		if (offset === void 0) offset = this._offset;
		if (offset >= this._size) return null;
		var lenB = this._buf[offset++] & 255;
		if (lenB === null) return null;
		if ((lenB & 128) === 128) {
			lenB &= 127;
			if (lenB === 0) throw newInvalidAsn1Error("Indefinite length not supported");
			if (lenB > 4) throw newInvalidAsn1Error("encoding too long");
			if (this._size - offset < lenB) return null;
			this._len = 0;
			for (var i = 0; i < lenB; i++) this._len = (this._len << 8) + (this._buf[offset++] & 255);
		} else this._len = lenB;
		return offset;
	};
	/**
	* Parses the next sequence in this BER buffer.
	*
	* To get the length of the sequence, call `Reader.length`.
	*
	* @return {Number} the sequence's tag.
	*/
	Reader.prototype.readSequence = function(tag) {
		var seq = this.peek();
		if (seq === null) return null;
		if (tag !== void 0 && tag !== seq) throw newInvalidAsn1Error("Expected 0x" + tag.toString(16) + ": got 0x" + seq.toString(16));
		var o = this.readLength(this._offset + 1);
		if (o === null) return null;
		this._offset = o;
		return seq;
	};
	Reader.prototype.readInt = function() {
		return this._readTag(ASN1.Integer);
	};
	Reader.prototype.readBoolean = function() {
		return this._readTag(ASN1.Boolean) === 0 ? false : true;
	};
	Reader.prototype.readEnumeration = function() {
		return this._readTag(ASN1.Enumeration);
	};
	Reader.prototype.readString = function(tag, retbuf) {
		if (!tag) tag = ASN1.OctetString;
		var b = this.peek();
		if (b === null) return null;
		if (b !== tag) throw newInvalidAsn1Error("Expected 0x" + tag.toString(16) + ": got 0x" + b.toString(16));
		var o = this.readLength(this._offset + 1);
		if (o === null) return null;
		if (this.length > this._size - o) return null;
		this._offset = o;
		if (this.length === 0) return retbuf ? Buffer.alloc(0) : "";
		var str = this._buf.slice(this._offset, this._offset + this.length);
		this._offset += this.length;
		return retbuf ? str : str.toString("utf8");
	};
	Reader.prototype.readOID = function(tag) {
		if (!tag) tag = ASN1.OID;
		var b = this.readString(tag, true);
		if (b === null) return null;
		var values = [];
		var value = 0;
		for (var i = 0; i < b.length; i++) {
			var byte = b[i] & 255;
			value <<= 7;
			value += byte & 127;
			if ((byte & 128) === 0) {
				values.push(value);
				value = 0;
			}
		}
		value = values.shift();
		values.unshift(value % 40);
		values.unshift(value / 40 >> 0);
		return values.join(".");
	};
	Reader.prototype._readTag = function(tag) {
		assert.ok(tag !== void 0);
		var b = this.peek();
		if (b === null) return null;
		if (b !== tag) throw newInvalidAsn1Error("Expected 0x" + tag.toString(16) + ": got 0x" + b.toString(16));
		var o = this.readLength(this._offset + 1);
		if (o === null) return null;
		if (this.length > 4) throw newInvalidAsn1Error("Integer too long: " + this.length);
		if (this.length > this._size - o) return null;
		this._offset = o;
		var fb = this._buf[this._offset];
		var value = 0;
		for (var i = 0; i < this.length; i++) {
			value <<= 8;
			value |= this._buf[this._offset++] & 255;
		}
		if ((fb & 128) === 128 && i !== 4) value -= 1 << i * 8;
		return value >> 0;
	};
	module.exports = Reader;
}));
// node_modules/asn1/lib/ber/writer.js
var require_writer = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var assert = __require("assert");
	var Buffer = require_safer().Buffer;
	var ASN1 = require_types();
	var newInvalidAsn1Error = require_errors().newInvalidAsn1Error;
	var DEFAULT_OPTS = {
		size: 1024,
		growthFactor: 8
	};
	function merge(from, to) {
		assert.ok(from);
		assert.equal(typeof from, "object");
		assert.ok(to);
		assert.equal(typeof to, "object");
		Object.getOwnPropertyNames(from).forEach(function(key) {
			if (to[key]) return;
			var value = Object.getOwnPropertyDescriptor(from, key);
			Object.defineProperty(to, key, value);
		});
		return to;
	}
	function Writer(options) {
		options = merge(DEFAULT_OPTS, options || {});
		this._buf = Buffer.alloc(options.size || 1024);
		this._size = this._buf.length;
		this._offset = 0;
		this._options = options;
		this._seq = [];
	}
	Object.defineProperty(Writer.prototype, "buffer", { get: function() {
		if (this._seq.length) throw newInvalidAsn1Error(this._seq.length + " unended sequence(s)");
		return this._buf.slice(0, this._offset);
	} });
	Writer.prototype.writeByte = function(b) {
		if (typeof b !== "number") throw new TypeError("argument must be a Number");
		this._ensure(1);
		this._buf[this._offset++] = b;
	};
	Writer.prototype.writeInt = function(i, tag) {
		if (typeof i !== "number") throw new TypeError("argument must be a Number");
		if (typeof tag !== "number") tag = ASN1.Integer;
		var sz = 4;
		while (((i & 0xff800000) === 0 || (i & 0xff800000) === -8388608) && sz > 1) {
			sz--;
			i <<= 8;
		}
		if (sz > 4) throw newInvalidAsn1Error("BER ints cannot be > 0xffffffff");
		this._ensure(2 + sz);
		this._buf[this._offset++] = tag;
		this._buf[this._offset++] = sz;
		while (sz-- > 0) {
			this._buf[this._offset++] = (i & 0xff000000) >>> 24;
			i <<= 8;
		}
	};
	Writer.prototype.writeNull = function() {
		this.writeByte(ASN1.Null);
		this.writeByte(0);
	};
	Writer.prototype.writeEnumeration = function(i, tag) {
		if (typeof i !== "number") throw new TypeError("argument must be a Number");
		if (typeof tag !== "number") tag = ASN1.Enumeration;
		return this.writeInt(i, tag);
	};
	Writer.prototype.writeBoolean = function(b, tag) {
		if (typeof b !== "boolean") throw new TypeError("argument must be a Boolean");
		if (typeof tag !== "number") tag = ASN1.Boolean;
		this._ensure(3);
		this._buf[this._offset++] = tag;
		this._buf[this._offset++] = 1;
		this._buf[this._offset++] = b ? 255 : 0;
	};
	Writer.prototype.writeString = function(s, tag) {
		if (typeof s !== "string") throw new TypeError("argument must be a string (was: " + typeof s + ")");
		if (typeof tag !== "number") tag = ASN1.OctetString;
		var len = Buffer.byteLength(s);
		this.writeByte(tag);
		this.writeLength(len);
		if (len) {
			this._ensure(len);
			this._buf.write(s, this._offset);
			this._offset += len;
		}
	};
	Writer.prototype.writeBuffer = function(buf, tag) {
		if (typeof tag !== "number") throw new TypeError("tag must be a number");
		if (!Buffer.isBuffer(buf)) throw new TypeError("argument must be a buffer");
		this.writeByte(tag);
		this.writeLength(buf.length);
		this._ensure(buf.length);
		buf.copy(this._buf, this._offset, 0, buf.length);
		this._offset += buf.length;
	};
	Writer.prototype.writeStringArray = function(strings) {
		if (!strings instanceof Array) throw new TypeError("argument must be an Array[String]");
		var self = this;
		strings.forEach(function(s) {
			self.writeString(s);
		});
	};
	Writer.prototype.writeOID = function(s, tag) {
		if (typeof s !== "string") throw new TypeError("argument must be a string");
		if (typeof tag !== "number") tag = ASN1.OID;
		if (!/^([0-9]+\.){3,}[0-9]+$/.test(s)) throw new Error("argument is not a valid OID string");
		function encodeOctet(bytes, octet) {
			if (octet < 128) bytes.push(octet);
			else if (octet < 16384) {
				bytes.push(octet >>> 7 | 128);
				bytes.push(octet & 127);
			} else if (octet < 2097152) {
				bytes.push(octet >>> 14 | 128);
				bytes.push((octet >>> 7 | 128) & 255);
				bytes.push(octet & 127);
			} else if (octet < 268435456) {
				bytes.push(octet >>> 21 | 128);
				bytes.push((octet >>> 14 | 128) & 255);
				bytes.push((octet >>> 7 | 128) & 255);
				bytes.push(octet & 127);
			} else {
				bytes.push((octet >>> 28 | 128) & 255);
				bytes.push((octet >>> 21 | 128) & 255);
				bytes.push((octet >>> 14 | 128) & 255);
				bytes.push((octet >>> 7 | 128) & 255);
				bytes.push(octet & 127);
			}
		}
		var tmp = s.split(".");
		var bytes = [];
		bytes.push(parseInt(tmp[0], 10) * 40 + parseInt(tmp[1], 10));
		tmp.slice(2).forEach(function(b) {
			encodeOctet(bytes, parseInt(b, 10));
		});
		var self = this;
		this._ensure(2 + bytes.length);
		this.writeByte(tag);
		this.writeLength(bytes.length);
		bytes.forEach(function(b) {
			self.writeByte(b);
		});
	};
	Writer.prototype.writeLength = function(len) {
		if (typeof len !== "number") throw new TypeError("argument must be a Number");
		this._ensure(4);
		if (len <= 127) this._buf[this._offset++] = len;
		else if (len <= 255) {
			this._buf[this._offset++] = 129;
			this._buf[this._offset++] = len;
		} else if (len <= 65535) {
			this._buf[this._offset++] = 130;
			this._buf[this._offset++] = len >> 8;
			this._buf[this._offset++] = len;
		} else if (len <= 0xffffff) {
			this._buf[this._offset++] = 131;
			this._buf[this._offset++] = len >> 16;
			this._buf[this._offset++] = len >> 8;
			this._buf[this._offset++] = len;
		} else throw newInvalidAsn1Error("Length too long (> 4 bytes)");
	};
	Writer.prototype.startSequence = function(tag) {
		if (typeof tag !== "number") tag = ASN1.Sequence | ASN1.Constructor;
		this.writeByte(tag);
		this._seq.push(this._offset);
		this._ensure(3);
		this._offset += 3;
	};
	Writer.prototype.endSequence = function() {
		var seq = this._seq.pop();
		var start = seq + 3;
		var len = this._offset - start;
		if (len <= 127) {
			this._shift(start, len, -2);
			this._buf[seq] = len;
		} else if (len <= 255) {
			this._shift(start, len, -1);
			this._buf[seq] = 129;
			this._buf[seq + 1] = len;
		} else if (len <= 65535) {
			this._buf[seq] = 130;
			this._buf[seq + 1] = len >> 8;
			this._buf[seq + 2] = len;
		} else if (len <= 0xffffff) {
			this._shift(start, len, 1);
			this._buf[seq] = 131;
			this._buf[seq + 1] = len >> 16;
			this._buf[seq + 2] = len >> 8;
			this._buf[seq + 3] = len;
		} else throw newInvalidAsn1Error("Sequence too long");
	};
	Writer.prototype._shift = function(start, len, shift) {
		assert.ok(start !== void 0);
		assert.ok(len !== void 0);
		assert.ok(shift);
		this._buf.copy(this._buf, start + shift, start, start + len);
		this._offset += shift;
	};
	Writer.prototype._ensure = function(len) {
		assert.ok(len);
		if (this._size - this._offset < len) {
			var sz = this._size * this._options.growthFactor;
			if (sz - this._offset < len) sz += len;
			var buf = Buffer.alloc(sz);
			this._buf.copy(buf, 0, 0, this._offset);
			this._buf = buf;
			this._size = sz;
		}
	};
	module.exports = Writer;
}));
// node_modules/asn1/lib/ber/index.js
var require_ber = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var errors = require_errors();
	var types = require_types();
	module.exports = {
		Reader: require_reader(),
		Writer: require_writer()
	};
	for (var t in types) if (types.hasOwnProperty(t)) module.exports[t] = types[t];
	for (var e in errors) if (errors.hasOwnProperty(e)) module.exports[e] = errors[e];
}));
// node_modules/asn1/lib/index.js
var require_lib$2 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var Ber = require_ber();
	module.exports = {
		Ber,
		BerReader: Ber.Reader,
		BerWriter: Ber.Writer
	};
}));
// node_modules/tweetnacl/nacl-fast.js
var require_nacl_fast = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function(nacl) {
		"use strict";
		var gf = function(init) {
			var i, r = /* @__PURE__ */ new Float64Array(16);
			if (init) for (i = 0; i < init.length; i++) r[i] = init[i];
			return r;
		};
		var randombytes = function() {
			throw new Error("no PRNG");
		};
		var _0 = /* @__PURE__ */ new Uint8Array(16);
		var _9 = /* @__PURE__ */ new Uint8Array(32);
		_9[0] = 9;
		var gf0 = gf(), gf1 = gf([1]), _121665 = gf([56129, 1]), D = gf([
			30883,
			4953,
			19914,
			30187,
			55467,
			16705,
			2637,
			112,
			59544,
			30585,
			16505,
			36039,
			65139,
			11119,
			27886,
			20995
		]), D2 = gf([
			61785,
			9906,
			39828,
			60374,
			45398,
			33411,
			5274,
			224,
			53552,
			61171,
			33010,
			6542,
			64743,
			22239,
			55772,
			9222
		]), X = gf([
			54554,
			36645,
			11616,
			51542,
			42930,
			38181,
			51040,
			26924,
			56412,
			64982,
			57905,
			49316,
			21502,
			52590,
			14035,
			8553
		]), Y = gf([
			26200,
			26214,
			26214,
			26214,
			26214,
			26214,
			26214,
			26214,
			26214,
			26214,
			26214,
			26214,
			26214,
			26214,
			26214,
			26214
		]), I = gf([
			41136,
			18958,
			6951,
			50414,
			58488,
			44335,
			6150,
			12099,
			55207,
			15867,
			153,
			11085,
			57099,
			20417,
			9344,
			11139
		]);
		function ts64(x, i, h, l) {
			x[i] = h >> 24 & 255;
			x[i + 1] = h >> 16 & 255;
			x[i + 2] = h >> 8 & 255;
			x[i + 3] = h & 255;
			x[i + 4] = l >> 24 & 255;
			x[i + 5] = l >> 16 & 255;
			x[i + 6] = l >> 8 & 255;
			x[i + 7] = l & 255;
		}
		function vn(x, xi, y, yi, n) {
			var i, d = 0;
			for (i = 0; i < n; i++) d |= x[xi + i] ^ y[yi + i];
			return (1 & d - 1 >>> 8) - 1;
		}
		function crypto_verify_16(x, xi, y, yi) {
			return vn(x, xi, y, yi, 16);
		}
		function crypto_verify_32(x, xi, y, yi) {
			return vn(x, xi, y, yi, 32);
		}
		function core_salsa20(o, p, k, c) {
			var j0 = c[0] & 255 | (c[1] & 255) << 8 | (c[2] & 255) << 16 | (c[3] & 255) << 24, j1 = k[0] & 255 | (k[1] & 255) << 8 | (k[2] & 255) << 16 | (k[3] & 255) << 24, j2 = k[4] & 255 | (k[5] & 255) << 8 | (k[6] & 255) << 16 | (k[7] & 255) << 24, j3 = k[8] & 255 | (k[9] & 255) << 8 | (k[10] & 255) << 16 | (k[11] & 255) << 24, j4 = k[12] & 255 | (k[13] & 255) << 8 | (k[14] & 255) << 16 | (k[15] & 255) << 24, j5 = c[4] & 255 | (c[5] & 255) << 8 | (c[6] & 255) << 16 | (c[7] & 255) << 24, j6 = p[0] & 255 | (p[1] & 255) << 8 | (p[2] & 255) << 16 | (p[3] & 255) << 24, j7 = p[4] & 255 | (p[5] & 255) << 8 | (p[6] & 255) << 16 | (p[7] & 255) << 24, j8 = p[8] & 255 | (p[9] & 255) << 8 | (p[10] & 255) << 16 | (p[11] & 255) << 24, j9 = p[12] & 255 | (p[13] & 255) << 8 | (p[14] & 255) << 16 | (p[15] & 255) << 24, j10 = c[8] & 255 | (c[9] & 255) << 8 | (c[10] & 255) << 16 | (c[11] & 255) << 24, j11 = k[16] & 255 | (k[17] & 255) << 8 | (k[18] & 255) << 16 | (k[19] & 255) << 24, j12 = k[20] & 255 | (k[21] & 255) << 8 | (k[22] & 255) << 16 | (k[23] & 255) << 24, j13 = k[24] & 255 | (k[25] & 255) << 8 | (k[26] & 255) << 16 | (k[27] & 255) << 24, j14 = k[28] & 255 | (k[29] & 255) << 8 | (k[30] & 255) << 16 | (k[31] & 255) << 24, j15 = c[12] & 255 | (c[13] & 255) << 8 | (c[14] & 255) << 16 | (c[15] & 255) << 24;
			var x0 = j0, x1 = j1, x2 = j2, x3 = j3, x4 = j4, x5 = j5, x6 = j6, x7 = j7, x8 = j8, x9 = j9, x10 = j10, x11 = j11, x12 = j12, x13 = j13, x14 = j14, x15 = j15, u;
			for (var i = 0; i < 20; i += 2) {
				u = x0 + x12 | 0;
				x4 ^= u << 7 | u >>> 25;
				u = x4 + x0 | 0;
				x8 ^= u << 9 | u >>> 23;
				u = x8 + x4 | 0;
				x12 ^= u << 13 | u >>> 19;
				u = x12 + x8 | 0;
				x0 ^= u << 18 | u >>> 14;
				u = x5 + x1 | 0;
				x9 ^= u << 7 | u >>> 25;
				u = x9 + x5 | 0;
				x13 ^= u << 9 | u >>> 23;
				u = x13 + x9 | 0;
				x1 ^= u << 13 | u >>> 19;
				u = x1 + x13 | 0;
				x5 ^= u << 18 | u >>> 14;
				u = x10 + x6 | 0;
				x14 ^= u << 7 | u >>> 25;
				u = x14 + x10 | 0;
				x2 ^= u << 9 | u >>> 23;
				u = x2 + x14 | 0;
				x6 ^= u << 13 | u >>> 19;
				u = x6 + x2 | 0;
				x10 ^= u << 18 | u >>> 14;
				u = x15 + x11 | 0;
				x3 ^= u << 7 | u >>> 25;
				u = x3 + x15 | 0;
				x7 ^= u << 9 | u >>> 23;
				u = x7 + x3 | 0;
				x11 ^= u << 13 | u >>> 19;
				u = x11 + x7 | 0;
				x15 ^= u << 18 | u >>> 14;
				u = x0 + x3 | 0;
				x1 ^= u << 7 | u >>> 25;
				u = x1 + x0 | 0;
				x2 ^= u << 9 | u >>> 23;
				u = x2 + x1 | 0;
				x3 ^= u << 13 | u >>> 19;
				u = x3 + x2 | 0;
				x0 ^= u << 18 | u >>> 14;
				u = x5 + x4 | 0;
				x6 ^= u << 7 | u >>> 25;
				u = x6 + x5 | 0;
				x7 ^= u << 9 | u >>> 23;
				u = x7 + x6 | 0;
				x4 ^= u << 13 | u >>> 19;
				u = x4 + x7 | 0;
				x5 ^= u << 18 | u >>> 14;
				u = x10 + x9 | 0;
				x11 ^= u << 7 | u >>> 25;
				u = x11 + x10 | 0;
				x8 ^= u << 9 | u >>> 23;
				u = x8 + x11 | 0;
				x9 ^= u << 13 | u >>> 19;
				u = x9 + x8 | 0;
				x10 ^= u << 18 | u >>> 14;
				u = x15 + x14 | 0;
				x12 ^= u << 7 | u >>> 25;
				u = x12 + x15 | 0;
				x13 ^= u << 9 | u >>> 23;
				u = x13 + x12 | 0;
				x14 ^= u << 13 | u >>> 19;
				u = x14 + x13 | 0;
				x15 ^= u << 18 | u >>> 14;
			}
			x0 = x0 + j0 | 0;
			x1 = x1 + j1 | 0;
			x2 = x2 + j2 | 0;
			x3 = x3 + j3 | 0;
			x4 = x4 + j4 | 0;
			x5 = x5 + j5 | 0;
			x6 = x6 + j6 | 0;
			x7 = x7 + j7 | 0;
			x8 = x8 + j8 | 0;
			x9 = x9 + j9 | 0;
			x10 = x10 + j10 | 0;
			x11 = x11 + j11 | 0;
			x12 = x12 + j12 | 0;
			x13 = x13 + j13 | 0;
			x14 = x14 + j14 | 0;
			x15 = x15 + j15 | 0;
			o[0] = x0 >>> 0 & 255;
			o[1] = x0 >>> 8 & 255;
			o[2] = x0 >>> 16 & 255;
			o[3] = x0 >>> 24 & 255;
			o[4] = x1 >>> 0 & 255;
			o[5] = x1 >>> 8 & 255;
			o[6] = x1 >>> 16 & 255;
			o[7] = x1 >>> 24 & 255;
			o[8] = x2 >>> 0 & 255;
			o[9] = x2 >>> 8 & 255;
			o[10] = x2 >>> 16 & 255;
			o[11] = x2 >>> 24 & 255;
			o[12] = x3 >>> 0 & 255;
			o[13] = x3 >>> 8 & 255;
			o[14] = x3 >>> 16 & 255;
			o[15] = x3 >>> 24 & 255;
			o[16] = x4 >>> 0 & 255;
			o[17] = x4 >>> 8 & 255;
			o[18] = x4 >>> 16 & 255;
			o[19] = x4 >>> 24 & 255;
			o[20] = x5 >>> 0 & 255;
			o[21] = x5 >>> 8 & 255;
			o[22] = x5 >>> 16 & 255;
			o[23] = x5 >>> 24 & 255;
			o[24] = x6 >>> 0 & 255;
			o[25] = x6 >>> 8 & 255;
			o[26] = x6 >>> 16 & 255;
			o[27] = x6 >>> 24 & 255;
			o[28] = x7 >>> 0 & 255;
			o[29] = x7 >>> 8 & 255;
			o[30] = x7 >>> 16 & 255;
			o[31] = x7 >>> 24 & 255;
			o[32] = x8 >>> 0 & 255;
			o[33] = x8 >>> 8 & 255;
			o[34] = x8 >>> 16 & 255;
			o[35] = x8 >>> 24 & 255;
			o[36] = x9 >>> 0 & 255;
			o[37] = x9 >>> 8 & 255;
			o[38] = x9 >>> 16 & 255;
			o[39] = x9 >>> 24 & 255;
			o[40] = x10 >>> 0 & 255;
			o[41] = x10 >>> 8 & 255;
			o[42] = x10 >>> 16 & 255;
			o[43] = x10 >>> 24 & 255;
			o[44] = x11 >>> 0 & 255;
			o[45] = x11 >>> 8 & 255;
			o[46] = x11 >>> 16 & 255;
			o[47] = x11 >>> 24 & 255;
			o[48] = x12 >>> 0 & 255;
			o[49] = x12 >>> 8 & 255;
			o[50] = x12 >>> 16 & 255;
			o[51] = x12 >>> 24 & 255;
			o[52] = x13 >>> 0 & 255;
			o[53] = x13 >>> 8 & 255;
			o[54] = x13 >>> 16 & 255;
			o[55] = x13 >>> 24 & 255;
			o[56] = x14 >>> 0 & 255;
			o[57] = x14 >>> 8 & 255;
			o[58] = x14 >>> 16 & 255;
			o[59] = x14 >>> 24 & 255;
			o[60] = x15 >>> 0 & 255;
			o[61] = x15 >>> 8 & 255;
			o[62] = x15 >>> 16 & 255;
			o[63] = x15 >>> 24 & 255;
		}
		function core_hsalsa20(o, p, k, c) {
			var j0 = c[0] & 255 | (c[1] & 255) << 8 | (c[2] & 255) << 16 | (c[3] & 255) << 24, j1 = k[0] & 255 | (k[1] & 255) << 8 | (k[2] & 255) << 16 | (k[3] & 255) << 24, j2 = k[4] & 255 | (k[5] & 255) << 8 | (k[6] & 255) << 16 | (k[7] & 255) << 24, j3 = k[8] & 255 | (k[9] & 255) << 8 | (k[10] & 255) << 16 | (k[11] & 255) << 24, j4 = k[12] & 255 | (k[13] & 255) << 8 | (k[14] & 255) << 16 | (k[15] & 255) << 24, j5 = c[4] & 255 | (c[5] & 255) << 8 | (c[6] & 255) << 16 | (c[7] & 255) << 24, j6 = p[0] & 255 | (p[1] & 255) << 8 | (p[2] & 255) << 16 | (p[3] & 255) << 24, j7 = p[4] & 255 | (p[5] & 255) << 8 | (p[6] & 255) << 16 | (p[7] & 255) << 24, j8 = p[8] & 255 | (p[9] & 255) << 8 | (p[10] & 255) << 16 | (p[11] & 255) << 24, j9 = p[12] & 255 | (p[13] & 255) << 8 | (p[14] & 255) << 16 | (p[15] & 255) << 24, j10 = c[8] & 255 | (c[9] & 255) << 8 | (c[10] & 255) << 16 | (c[11] & 255) << 24, j11 = k[16] & 255 | (k[17] & 255) << 8 | (k[18] & 255) << 16 | (k[19] & 255) << 24, j12 = k[20] & 255 | (k[21] & 255) << 8 | (k[22] & 255) << 16 | (k[23] & 255) << 24, j13 = k[24] & 255 | (k[25] & 255) << 8 | (k[26] & 255) << 16 | (k[27] & 255) << 24, j14 = k[28] & 255 | (k[29] & 255) << 8 | (k[30] & 255) << 16 | (k[31] & 255) << 24, j15 = c[12] & 255 | (c[13] & 255) << 8 | (c[14] & 255) << 16 | (c[15] & 255) << 24;
			var x0 = j0, x1 = j1, x2 = j2, x3 = j3, x4 = j4, x5 = j5, x6 = j6, x7 = j7, x8 = j8, x9 = j9, x10 = j10, x11 = j11, x12 = j12, x13 = j13, x14 = j14, x15 = j15, u;
			for (var i = 0; i < 20; i += 2) {
				u = x0 + x12 | 0;
				x4 ^= u << 7 | u >>> 25;
				u = x4 + x0 | 0;
				x8 ^= u << 9 | u >>> 23;
				u = x8 + x4 | 0;
				x12 ^= u << 13 | u >>> 19;
				u = x12 + x8 | 0;
				x0 ^= u << 18 | u >>> 14;
				u = x5 + x1 | 0;
				x9 ^= u << 7 | u >>> 25;
				u = x9 + x5 | 0;
				x13 ^= u << 9 | u >>> 23;
				u = x13 + x9 | 0;
				x1 ^= u << 13 | u >>> 19;
				u = x1 + x13 | 0;
				x5 ^= u << 18 | u >>> 14;
				u = x10 + x6 | 0;
				x14 ^= u << 7 | u >>> 25;
				u = x14 + x10 | 0;
				x2 ^= u << 9 | u >>> 23;
				u = x2 + x14 | 0;
				x6 ^= u << 13 | u >>> 19;
				u = x6 + x2 | 0;
				x10 ^= u << 18 | u >>> 14;
				u = x15 + x11 | 0;
				x3 ^= u << 7 | u >>> 25;
				u = x3 + x15 | 0;
				x7 ^= u << 9 | u >>> 23;
				u = x7 + x3 | 0;
				x11 ^= u << 13 | u >>> 19;
				u = x11 + x7 | 0;
				x15 ^= u << 18 | u >>> 14;
				u = x0 + x3 | 0;
				x1 ^= u << 7 | u >>> 25;
				u = x1 + x0 | 0;
				x2 ^= u << 9 | u >>> 23;
				u = x2 + x1 | 0;
				x3 ^= u << 13 | u >>> 19;
				u = x3 + x2 | 0;
				x0 ^= u << 18 | u >>> 14;
				u = x5 + x4 | 0;
				x6 ^= u << 7 | u >>> 25;
				u = x6 + x5 | 0;
				x7 ^= u << 9 | u >>> 23;
				u = x7 + x6 | 0;
				x4 ^= u << 13 | u >>> 19;
				u = x4 + x7 | 0;
				x5 ^= u << 18 | u >>> 14;
				u = x10 + x9 | 0;
				x11 ^= u << 7 | u >>> 25;
				u = x11 + x10 | 0;
				x8 ^= u << 9 | u >>> 23;
				u = x8 + x11 | 0;
				x9 ^= u << 13 | u >>> 19;
				u = x9 + x8 | 0;
				x10 ^= u << 18 | u >>> 14;
				u = x15 + x14 | 0;
				x12 ^= u << 7 | u >>> 25;
				u = x12 + x15 | 0;
				x13 ^= u << 9 | u >>> 23;
				u = x13 + x12 | 0;
				x14 ^= u << 13 | u >>> 19;
				u = x14 + x13 | 0;
				x15 ^= u << 18 | u >>> 14;
			}
			o[0] = x0 >>> 0 & 255;
			o[1] = x0 >>> 8 & 255;
			o[2] = x0 >>> 16 & 255;
			o[3] = x0 >>> 24 & 255;
			o[4] = x5 >>> 0 & 255;
			o[5] = x5 >>> 8 & 255;
			o[6] = x5 >>> 16 & 255;
			o[7] = x5 >>> 24 & 255;
			o[8] = x10 >>> 0 & 255;
			o[9] = x10 >>> 8 & 255;
			o[10] = x10 >>> 16 & 255;
			o[11] = x10 >>> 24 & 255;
			o[12] = x15 >>> 0 & 255;
			o[13] = x15 >>> 8 & 255;
			o[14] = x15 >>> 16 & 255;
			o[15] = x15 >>> 24 & 255;
			o[16] = x6 >>> 0 & 255;
			o[17] = x6 >>> 8 & 255;
			o[18] = x6 >>> 16 & 255;
			o[19] = x6 >>> 24 & 255;
			o[20] = x7 >>> 0 & 255;
			o[21] = x7 >>> 8 & 255;
			o[22] = x7 >>> 16 & 255;
			o[23] = x7 >>> 24 & 255;
			o[24] = x8 >>> 0 & 255;
			o[25] = x8 >>> 8 & 255;
			o[26] = x8 >>> 16 & 255;
			o[27] = x8 >>> 24 & 255;
			o[28] = x9 >>> 0 & 255;
			o[29] = x9 >>> 8 & 255;
			o[30] = x9 >>> 16 & 255;
			o[31] = x9 >>> 24 & 255;
		}
		function crypto_core_salsa20(out, inp, k, c) {
			core_salsa20(out, inp, k, c);
		}
		function crypto_core_hsalsa20(out, inp, k, c) {
			core_hsalsa20(out, inp, k, c);
		}
		var sigma = new Uint8Array([
			101,
			120,
			112,
			97,
			110,
			100,
			32,
			51,
			50,
			45,
			98,
			121,
			116,
			101,
			32,
			107
		]);
		function crypto_stream_salsa20_xor(c, cpos, m, mpos, b, n, k) {
			var z = /* @__PURE__ */ new Uint8Array(16), x = /* @__PURE__ */ new Uint8Array(64);
			var u, i = 0;
			for (; i < 16; i++) z[i] = 0;
			for (i = 0; i < 8; i++) z[i] = n[i];
			while (b >= 64) {
				crypto_core_salsa20(x, z, k, sigma);
				for (i = 0; i < 64; i++) c[cpos + i] = m[mpos + i] ^ x[i];
				u = 1;
				for (i = 8; i < 16; i++) {
					u = u + (z[i] & 255) | 0;
					z[i] = u & 255;
					u >>>= 8;
				}
				b -= 64;
				cpos += 64;
				mpos += 64;
			}
			if (b > 0) {
				crypto_core_salsa20(x, z, k, sigma);
				for (i = 0; i < b; i++) c[cpos + i] = m[mpos + i] ^ x[i];
			}
			return 0;
		}
		function crypto_stream_salsa20(c, cpos, b, n, k) {
			var z = /* @__PURE__ */ new Uint8Array(16), x = /* @__PURE__ */ new Uint8Array(64);
			var u, i = 0;
			for (; i < 16; i++) z[i] = 0;
			for (i = 0; i < 8; i++) z[i] = n[i];
			while (b >= 64) {
				crypto_core_salsa20(x, z, k, sigma);
				for (i = 0; i < 64; i++) c[cpos + i] = x[i];
				u = 1;
				for (i = 8; i < 16; i++) {
					u = u + (z[i] & 255) | 0;
					z[i] = u & 255;
					u >>>= 8;
				}
				b -= 64;
				cpos += 64;
			}
			if (b > 0) {
				crypto_core_salsa20(x, z, k, sigma);
				for (i = 0; i < b; i++) c[cpos + i] = x[i];
			}
			return 0;
		}
		function crypto_stream(c, cpos, d, n, k) {
			var s = /* @__PURE__ */ new Uint8Array(32);
			crypto_core_hsalsa20(s, n, k, sigma);
			var sn = /* @__PURE__ */ new Uint8Array(8);
			for (var i = 0; i < 8; i++) sn[i] = n[i + 16];
			return crypto_stream_salsa20(c, cpos, d, sn, s);
		}
		function crypto_stream_xor(c, cpos, m, mpos, d, n, k) {
			var s = /* @__PURE__ */ new Uint8Array(32);
			crypto_core_hsalsa20(s, n, k, sigma);
			var sn = /* @__PURE__ */ new Uint8Array(8);
			for (var i = 0; i < 8; i++) sn[i] = n[i + 16];
			return crypto_stream_salsa20_xor(c, cpos, m, mpos, d, sn, s);
		}
		var poly1305 = function(key) {
			this.buffer = /* @__PURE__ */ new Uint8Array(16);
			this.r = /* @__PURE__ */ new Uint16Array(10);
			this.h = /* @__PURE__ */ new Uint16Array(10);
			this.pad = /* @__PURE__ */ new Uint16Array(8);
			this.leftover = 0;
			this.fin = 0;
			var t0 = key[0] & 255 | (key[1] & 255) << 8, t1, t2, t3, t4, t5, t6, t7;
			this.r[0] = t0 & 8191;
			t1 = key[2] & 255 | (key[3] & 255) << 8;
			this.r[1] = (t0 >>> 13 | t1 << 3) & 8191;
			t2 = key[4] & 255 | (key[5] & 255) << 8;
			this.r[2] = (t1 >>> 10 | t2 << 6) & 7939;
			t3 = key[6] & 255 | (key[7] & 255) << 8;
			this.r[3] = (t2 >>> 7 | t3 << 9) & 8191;
			t4 = key[8] & 255 | (key[9] & 255) << 8;
			this.r[4] = (t3 >>> 4 | t4 << 12) & 255;
			this.r[5] = t4 >>> 1 & 8190;
			t5 = key[10] & 255 | (key[11] & 255) << 8;
			this.r[6] = (t4 >>> 14 | t5 << 2) & 8191;
			t6 = key[12] & 255 | (key[13] & 255) << 8;
			this.r[7] = (t5 >>> 11 | t6 << 5) & 8065;
			t7 = key[14] & 255 | (key[15] & 255) << 8;
			this.r[8] = (t6 >>> 8 | t7 << 8) & 8191;
			this.r[9] = t7 >>> 5 & 127;
			this.pad[0] = key[16] & 255 | (key[17] & 255) << 8;
			this.pad[1] = key[18] & 255 | (key[19] & 255) << 8;
			this.pad[2] = key[20] & 255 | (key[21] & 255) << 8;
			this.pad[3] = key[22] & 255 | (key[23] & 255) << 8;
			this.pad[4] = key[24] & 255 | (key[25] & 255) << 8;
			this.pad[5] = key[26] & 255 | (key[27] & 255) << 8;
			this.pad[6] = key[28] & 255 | (key[29] & 255) << 8;
			this.pad[7] = key[30] & 255 | (key[31] & 255) << 8;
		};
		poly1305.prototype.blocks = function(m, mpos, bytes) {
			var hibit = this.fin ? 0 : 2048;
			var t0, t1, t2, t3, t4, t5, t6, t7, c;
			var d0, d1, d2, d3, d4, d5, d6, d7, d8, d9;
			var h0 = this.h[0], h1 = this.h[1], h2 = this.h[2], h3 = this.h[3], h4 = this.h[4], h5 = this.h[5], h6 = this.h[6], h7 = this.h[7], h8 = this.h[8], h9 = this.h[9];
			var r0 = this.r[0], r1 = this.r[1], r2 = this.r[2], r3 = this.r[3], r4 = this.r[4], r5 = this.r[5], r6 = this.r[6], r7 = this.r[7], r8 = this.r[8], r9 = this.r[9];
			while (bytes >= 16) {
				t0 = m[mpos + 0] & 255 | (m[mpos + 1] & 255) << 8;
				h0 += t0 & 8191;
				t1 = m[mpos + 2] & 255 | (m[mpos + 3] & 255) << 8;
				h1 += (t0 >>> 13 | t1 << 3) & 8191;
				t2 = m[mpos + 4] & 255 | (m[mpos + 5] & 255) << 8;
				h2 += (t1 >>> 10 | t2 << 6) & 8191;
				t3 = m[mpos + 6] & 255 | (m[mpos + 7] & 255) << 8;
				h3 += (t2 >>> 7 | t3 << 9) & 8191;
				t4 = m[mpos + 8] & 255 | (m[mpos + 9] & 255) << 8;
				h4 += (t3 >>> 4 | t4 << 12) & 8191;
				h5 += t4 >>> 1 & 8191;
				t5 = m[mpos + 10] & 255 | (m[mpos + 11] & 255) << 8;
				h6 += (t4 >>> 14 | t5 << 2) & 8191;
				t6 = m[mpos + 12] & 255 | (m[mpos + 13] & 255) << 8;
				h7 += (t5 >>> 11 | t6 << 5) & 8191;
				t7 = m[mpos + 14] & 255 | (m[mpos + 15] & 255) << 8;
				h8 += (t6 >>> 8 | t7 << 8) & 8191;
				h9 += t7 >>> 5 | hibit;
				c = 0;
				d0 = c;
				d0 += h0 * r0;
				d0 += h1 * (5 * r9);
				d0 += h2 * (5 * r8);
				d0 += h3 * (5 * r7);
				d0 += h4 * (5 * r6);
				c = d0 >>> 13;
				d0 &= 8191;
				d0 += h5 * (5 * r5);
				d0 += h6 * (5 * r4);
				d0 += h7 * (5 * r3);
				d0 += h8 * (5 * r2);
				d0 += h9 * (5 * r1);
				c += d0 >>> 13;
				d0 &= 8191;
				d1 = c;
				d1 += h0 * r1;
				d1 += h1 * r0;
				d1 += h2 * (5 * r9);
				d1 += h3 * (5 * r8);
				d1 += h4 * (5 * r7);
				c = d1 >>> 13;
				d1 &= 8191;
				d1 += h5 * (5 * r6);
				d1 += h6 * (5 * r5);
				d1 += h7 * (5 * r4);
				d1 += h8 * (5 * r3);
				d1 += h9 * (5 * r2);
				c += d1 >>> 13;
				d1 &= 8191;
				d2 = c;
				d2 += h0 * r2;
				d2 += h1 * r1;
				d2 += h2 * r0;
				d2 += h3 * (5 * r9);
				d2 += h4 * (5 * r8);
				c = d2 >>> 13;
				d2 &= 8191;
				d2 += h5 * (5 * r7);
				d2 += h6 * (5 * r6);
				d2 += h7 * (5 * r5);
				d2 += h8 * (5 * r4);
				d2 += h9 * (5 * r3);
				c += d2 >>> 13;
				d2 &= 8191;
				d3 = c;
				d3 += h0 * r3;
				d3 += h1 * r2;
				d3 += h2 * r1;
				d3 += h3 * r0;
				d3 += h4 * (5 * r9);
				c = d3 >>> 13;
				d3 &= 8191;
				d3 += h5 * (5 * r8);
				d3 += h6 * (5 * r7);
				d3 += h7 * (5 * r6);
				d3 += h8 * (5 * r5);
				d3 += h9 * (5 * r4);
				c += d3 >>> 13;
				d3 &= 8191;
				d4 = c;
				d4 += h0 * r4;
				d4 += h1 * r3;
				d4 += h2 * r2;
				d4 += h3 * r1;
				d4 += h4 * r0;
				c = d4 >>> 13;
				d4 &= 8191;
				d4 += h5 * (5 * r9);
				d4 += h6 * (5 * r8);
				d4 += h7 * (5 * r7);
				d4 += h8 * (5 * r6);
				d4 += h9 * (5 * r5);
				c += d4 >>> 13;
				d4 &= 8191;
				d5 = c;
				d5 += h0 * r5;
				d5 += h1 * r4;
				d5 += h2 * r3;
				d5 += h3 * r2;
				d5 += h4 * r1;
				c = d5 >>> 13;
				d5 &= 8191;
				d5 += h5 * r0;
				d5 += h6 * (5 * r9);
				d5 += h7 * (5 * r8);
				d5 += h8 * (5 * r7);
				d5 += h9 * (5 * r6);
				c += d5 >>> 13;
				d5 &= 8191;
				d6 = c;
				d6 += h0 * r6;
				d6 += h1 * r5;
				d6 += h2 * r4;
				d6 += h3 * r3;
				d6 += h4 * r2;
				c = d6 >>> 13;
				d6 &= 8191;
				d6 += h5 * r1;
				d6 += h6 * r0;
				d6 += h7 * (5 * r9);
				d6 += h8 * (5 * r8);
				d6 += h9 * (5 * r7);
				c += d6 >>> 13;
				d6 &= 8191;
				d7 = c;
				d7 += h0 * r7;
				d7 += h1 * r6;
				d7 += h2 * r5;
				d7 += h3 * r4;
				d7 += h4 * r3;
				c = d7 >>> 13;
				d7 &= 8191;
				d7 += h5 * r2;
				d7 += h6 * r1;
				d7 += h7 * r0;
				d7 += h8 * (5 * r9);
				d7 += h9 * (5 * r8);
				c += d7 >>> 13;
				d7 &= 8191;
				d8 = c;
				d8 += h0 * r8;
				d8 += h1 * r7;
				d8 += h2 * r6;
				d8 += h3 * r5;
				d8 += h4 * r4;
				c = d8 >>> 13;
				d8 &= 8191;
				d8 += h5 * r3;
				d8 += h6 * r2;
				d8 += h7 * r1;
				d8 += h8 * r0;
				d8 += h9 * (5 * r9);
				c += d8 >>> 13;
				d8 &= 8191;
				d9 = c;
				d9 += h0 * r9;
				d9 += h1 * r8;
				d9 += h2 * r7;
				d9 += h3 * r6;
				d9 += h4 * r5;
				c = d9 >>> 13;
				d9 &= 8191;
				d9 += h5 * r4;
				d9 += h6 * r3;
				d9 += h7 * r2;
				d9 += h8 * r1;
				d9 += h9 * r0;
				c += d9 >>> 13;
				d9 &= 8191;
				c = (c << 2) + c | 0;
				c = c + d0 | 0;
				d0 = c & 8191;
				c = c >>> 13;
				d1 += c;
				h0 = d0;
				h1 = d1;
				h2 = d2;
				h3 = d3;
				h4 = d4;
				h5 = d5;
				h6 = d6;
				h7 = d7;
				h8 = d8;
				h9 = d9;
				mpos += 16;
				bytes -= 16;
			}
			this.h[0] = h0;
			this.h[1] = h1;
			this.h[2] = h2;
			this.h[3] = h3;
			this.h[4] = h4;
			this.h[5] = h5;
			this.h[6] = h6;
			this.h[7] = h7;
			this.h[8] = h8;
			this.h[9] = h9;
		};
		poly1305.prototype.finish = function(mac, macpos) {
			var g = /* @__PURE__ */ new Uint16Array(10);
			var c, mask, f, i;
			if (this.leftover) {
				i = this.leftover;
				this.buffer[i++] = 1;
				for (; i < 16; i++) this.buffer[i] = 0;
				this.fin = 1;
				this.blocks(this.buffer, 0, 16);
			}
			c = this.h[1] >>> 13;
			this.h[1] &= 8191;
			for (i = 2; i < 10; i++) {
				this.h[i] += c;
				c = this.h[i] >>> 13;
				this.h[i] &= 8191;
			}
			this.h[0] += c * 5;
			c = this.h[0] >>> 13;
			this.h[0] &= 8191;
			this.h[1] += c;
			c = this.h[1] >>> 13;
			this.h[1] &= 8191;
			this.h[2] += c;
			g[0] = this.h[0] + 5;
			c = g[0] >>> 13;
			g[0] &= 8191;
			for (i = 1; i < 10; i++) {
				g[i] = this.h[i] + c;
				c = g[i] >>> 13;
				g[i] &= 8191;
			}
			g[9] -= 8192;
			mask = (c ^ 1) - 1;
			for (i = 0; i < 10; i++) g[i] &= mask;
			mask = ~mask;
			for (i = 0; i < 10; i++) this.h[i] = this.h[i] & mask | g[i];
			this.h[0] = (this.h[0] | this.h[1] << 13) & 65535;
			this.h[1] = (this.h[1] >>> 3 | this.h[2] << 10) & 65535;
			this.h[2] = (this.h[2] >>> 6 | this.h[3] << 7) & 65535;
			this.h[3] = (this.h[3] >>> 9 | this.h[4] << 4) & 65535;
			this.h[4] = (this.h[4] >>> 12 | this.h[5] << 1 | this.h[6] << 14) & 65535;
			this.h[5] = (this.h[6] >>> 2 | this.h[7] << 11) & 65535;
			this.h[6] = (this.h[7] >>> 5 | this.h[8] << 8) & 65535;
			this.h[7] = (this.h[8] >>> 8 | this.h[9] << 5) & 65535;
			f = this.h[0] + this.pad[0];
			this.h[0] = f & 65535;
			for (i = 1; i < 8; i++) {
				f = (this.h[i] + this.pad[i] | 0) + (f >>> 16) | 0;
				this.h[i] = f & 65535;
			}
			mac[macpos + 0] = this.h[0] >>> 0 & 255;
			mac[macpos + 1] = this.h[0] >>> 8 & 255;
			mac[macpos + 2] = this.h[1] >>> 0 & 255;
			mac[macpos + 3] = this.h[1] >>> 8 & 255;
			mac[macpos + 4] = this.h[2] >>> 0 & 255;
			mac[macpos + 5] = this.h[2] >>> 8 & 255;
			mac[macpos + 6] = this.h[3] >>> 0 & 255;
			mac[macpos + 7] = this.h[3] >>> 8 & 255;
			mac[macpos + 8] = this.h[4] >>> 0 & 255;
			mac[macpos + 9] = this.h[4] >>> 8 & 255;
			mac[macpos + 10] = this.h[5] >>> 0 & 255;
			mac[macpos + 11] = this.h[5] >>> 8 & 255;
			mac[macpos + 12] = this.h[6] >>> 0 & 255;
			mac[macpos + 13] = this.h[6] >>> 8 & 255;
			mac[macpos + 14] = this.h[7] >>> 0 & 255;
			mac[macpos + 15] = this.h[7] >>> 8 & 255;
		};
		poly1305.prototype.update = function(m, mpos, bytes) {
			var i, want;
			if (this.leftover) {
				want = 16 - this.leftover;
				if (want > bytes) want = bytes;
				for (i = 0; i < want; i++) this.buffer[this.leftover + i] = m[mpos + i];
				bytes -= want;
				mpos += want;
				this.leftover += want;
				if (this.leftover < 16) return;
				this.blocks(this.buffer, 0, 16);
				this.leftover = 0;
			}
			if (bytes >= 16) {
				want = bytes - bytes % 16;
				this.blocks(m, mpos, want);
				mpos += want;
				bytes -= want;
			}
			if (bytes) {
				for (i = 0; i < bytes; i++) this.buffer[this.leftover + i] = m[mpos + i];
				this.leftover += bytes;
			}
		};
		function crypto_onetimeauth(out, outpos, m, mpos, n, k) {
			var s = new poly1305(k);
			s.update(m, mpos, n);
			s.finish(out, outpos);
			return 0;
		}
		function crypto_onetimeauth_verify(h, hpos, m, mpos, n, k) {
			var x = /* @__PURE__ */ new Uint8Array(16);
			crypto_onetimeauth(x, 0, m, mpos, n, k);
			return crypto_verify_16(h, hpos, x, 0);
		}
		function crypto_secretbox(c, m, d, n, k) {
			var i;
			if (d < 32) return -1;
			crypto_stream_xor(c, 0, m, 0, d, n, k);
			crypto_onetimeauth(c, 16, c, 32, d - 32, c);
			for (i = 0; i < 16; i++) c[i] = 0;
			return 0;
		}
		function crypto_secretbox_open(m, c, d, n, k) {
			var i;
			var x = /* @__PURE__ */ new Uint8Array(32);
			if (d < 32) return -1;
			crypto_stream(x, 0, 32, n, k);
			if (crypto_onetimeauth_verify(c, 16, c, 32, d - 32, x) !== 0) return -1;
			crypto_stream_xor(m, 0, c, 0, d, n, k);
			for (i = 0; i < 32; i++) m[i] = 0;
			return 0;
		}
		function set25519(r, a) {
			var i = 0;
			for (; i < 16; i++) r[i] = a[i] | 0;
		}
		function car25519(o) {
			var i, v, c = 1;
			for (i = 0; i < 16; i++) {
				v = o[i] + c + 65535;
				c = Math.floor(v / 65536);
				o[i] = v - c * 65536;
			}
			o[0] += c - 1 + 37 * (c - 1);
		}
		function sel25519(p, q, b) {
			var t, c = ~(b - 1);
			for (var i = 0; i < 16; i++) {
				t = c & (p[i] ^ q[i]);
				p[i] ^= t;
				q[i] ^= t;
			}
		}
		function pack25519(o, n) {
			var i, j, b;
			var m = gf(), t = gf();
			for (i = 0; i < 16; i++) t[i] = n[i];
			car25519(t);
			car25519(t);
			car25519(t);
			for (j = 0; j < 2; j++) {
				m[0] = t[0] - 65517;
				for (i = 1; i < 15; i++) {
					m[i] = t[i] - 65535 - (m[i - 1] >> 16 & 1);
					m[i - 1] &= 65535;
				}
				m[15] = t[15] - 32767 - (m[14] >> 16 & 1);
				b = m[15] >> 16 & 1;
				m[14] &= 65535;
				sel25519(t, m, 1 - b);
			}
			for (i = 0; i < 16; i++) {
				o[2 * i] = t[i] & 255;
				o[2 * i + 1] = t[i] >> 8;
			}
		}
		function neq25519(a, b) {
			var c = /* @__PURE__ */ new Uint8Array(32), d = /* @__PURE__ */ new Uint8Array(32);
			pack25519(c, a);
			pack25519(d, b);
			return crypto_verify_32(c, 0, d, 0);
		}
		function par25519(a) {
			var d = /* @__PURE__ */ new Uint8Array(32);
			pack25519(d, a);
			return d[0] & 1;
		}
		function unpack25519(o, n) {
			var i = 0;
			for (; i < 16; i++) o[i] = n[2 * i] + (n[2 * i + 1] << 8);
			o[15] &= 32767;
		}
		function A(o, a, b) {
			for (var i = 0; i < 16; i++) o[i] = a[i] + b[i];
		}
		function Z(o, a, b) {
			for (var i = 0; i < 16; i++) o[i] = a[i] - b[i];
		}
		function M(o, a, b) {
			var v, c, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0, t10 = 0, t11 = 0, t12 = 0, t13 = 0, t14 = 0, t15 = 0, t16 = 0, t17 = 0, t18 = 0, t19 = 0, t20 = 0, t21 = 0, t22 = 0, t23 = 0, t24 = 0, t25 = 0, t26 = 0, t27 = 0, t28 = 0, t29 = 0, t30 = 0, b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3], b4 = b[4], b5 = b[5], b6 = b[6], b7 = b[7], b8 = b[8], b9 = b[9], b10 = b[10], b11 = b[11], b12 = b[12], b13 = b[13], b14 = b[14], b15 = b[15];
			v = a[0];
			t0 += v * b0;
			t1 += v * b1;
			t2 += v * b2;
			t3 += v * b3;
			t4 += v * b4;
			t5 += v * b5;
			t6 += v * b6;
			t7 += v * b7;
			t8 += v * b8;
			t9 += v * b9;
			t10 += v * b10;
			t11 += v * b11;
			t12 += v * b12;
			t13 += v * b13;
			t14 += v * b14;
			t15 += v * b15;
			v = a[1];
			t1 += v * b0;
			t2 += v * b1;
			t3 += v * b2;
			t4 += v * b3;
			t5 += v * b4;
			t6 += v * b5;
			t7 += v * b6;
			t8 += v * b7;
			t9 += v * b8;
			t10 += v * b9;
			t11 += v * b10;
			t12 += v * b11;
			t13 += v * b12;
			t14 += v * b13;
			t15 += v * b14;
			t16 += v * b15;
			v = a[2];
			t2 += v * b0;
			t3 += v * b1;
			t4 += v * b2;
			t5 += v * b3;
			t6 += v * b4;
			t7 += v * b5;
			t8 += v * b6;
			t9 += v * b7;
			t10 += v * b8;
			t11 += v * b9;
			t12 += v * b10;
			t13 += v * b11;
			t14 += v * b12;
			t15 += v * b13;
			t16 += v * b14;
			t17 += v * b15;
			v = a[3];
			t3 += v * b0;
			t4 += v * b1;
			t5 += v * b2;
			t6 += v * b3;
			t7 += v * b4;
			t8 += v * b5;
			t9 += v * b6;
			t10 += v * b7;
			t11 += v * b8;
			t12 += v * b9;
			t13 += v * b10;
			t14 += v * b11;
			t15 += v * b12;
			t16 += v * b13;
			t17 += v * b14;
			t18 += v * b15;
			v = a[4];
			t4 += v * b0;
			t5 += v * b1;
			t6 += v * b2;
			t7 += v * b3;
			t8 += v * b4;
			t9 += v * b5;
			t10 += v * b6;
			t11 += v * b7;
			t12 += v * b8;
			t13 += v * b9;
			t14 += v * b10;
			t15 += v * b11;
			t16 += v * b12;
			t17 += v * b13;
			t18 += v * b14;
			t19 += v * b15;
			v = a[5];
			t5 += v * b0;
			t6 += v * b1;
			t7 += v * b2;
			t8 += v * b3;
			t9 += v * b4;
			t10 += v * b5;
			t11 += v * b6;
			t12 += v * b7;
			t13 += v * b8;
			t14 += v * b9;
			t15 += v * b10;
			t16 += v * b11;
			t17 += v * b12;
			t18 += v * b13;
			t19 += v * b14;
			t20 += v * b15;
			v = a[6];
			t6 += v * b0;
			t7 += v * b1;
			t8 += v * b2;
			t9 += v * b3;
			t10 += v * b4;
			t11 += v * b5;
			t12 += v * b6;
			t13 += v * b7;
			t14 += v * b8;
			t15 += v * b9;
			t16 += v * b10;
			t17 += v * b11;
			t18 += v * b12;
			t19 += v * b13;
			t20 += v * b14;
			t21 += v * b15;
			v = a[7];
			t7 += v * b0;
			t8 += v * b1;
			t9 += v * b2;
			t10 += v * b3;
			t11 += v * b4;
			t12 += v * b5;
			t13 += v * b6;
			t14 += v * b7;
			t15 += v * b8;
			t16 += v * b9;
			t17 += v * b10;
			t18 += v * b11;
			t19 += v * b12;
			t20 += v * b13;
			t21 += v * b14;
			t22 += v * b15;
			v = a[8];
			t8 += v * b0;
			t9 += v * b1;
			t10 += v * b2;
			t11 += v * b3;
			t12 += v * b4;
			t13 += v * b5;
			t14 += v * b6;
			t15 += v * b7;
			t16 += v * b8;
			t17 += v * b9;
			t18 += v * b10;
			t19 += v * b11;
			t20 += v * b12;
			t21 += v * b13;
			t22 += v * b14;
			t23 += v * b15;
			v = a[9];
			t9 += v * b0;
			t10 += v * b1;
			t11 += v * b2;
			t12 += v * b3;
			t13 += v * b4;
			t14 += v * b5;
			t15 += v * b6;
			t16 += v * b7;
			t17 += v * b8;
			t18 += v * b9;
			t19 += v * b10;
			t20 += v * b11;
			t21 += v * b12;
			t22 += v * b13;
			t23 += v * b14;
			t24 += v * b15;
			v = a[10];
			t10 += v * b0;
			t11 += v * b1;
			t12 += v * b2;
			t13 += v * b3;
			t14 += v * b4;
			t15 += v * b5;
			t16 += v * b6;
			t17 += v * b7;
			t18 += v * b8;
			t19 += v * b9;
			t20 += v * b10;
			t21 += v * b11;
			t22 += v * b12;
			t23 += v * b13;
			t24 += v * b14;
			t25 += v * b15;
			v = a[11];
			t11 += v * b0;
			t12 += v * b1;
			t13 += v * b2;
			t14 += v * b3;
			t15 += v * b4;
			t16 += v * b5;
			t17 += v * b6;
			t18 += v * b7;
			t19 += v * b8;
			t20 += v * b9;
			t21 += v * b10;
			t22 += v * b11;
			t23 += v * b12;
			t24 += v * b13;
			t25 += v * b14;
			t26 += v * b15;
			v = a[12];
			t12 += v * b0;
			t13 += v * b1;
			t14 += v * b2;
			t15 += v * b3;
			t16 += v * b4;
			t17 += v * b5;
			t18 += v * b6;
			t19 += v * b7;
			t20 += v * b8;
			t21 += v * b9;
			t22 += v * b10;
			t23 += v * b11;
			t24 += v * b12;
			t25 += v * b13;
			t26 += v * b14;
			t27 += v * b15;
			v = a[13];
			t13 += v * b0;
			t14 += v * b1;
			t15 += v * b2;
			t16 += v * b3;
			t17 += v * b4;
			t18 += v * b5;
			t19 += v * b6;
			t20 += v * b7;
			t21 += v * b8;
			t22 += v * b9;
			t23 += v * b10;
			t24 += v * b11;
			t25 += v * b12;
			t26 += v * b13;
			t27 += v * b14;
			t28 += v * b15;
			v = a[14];
			t14 += v * b0;
			t15 += v * b1;
			t16 += v * b2;
			t17 += v * b3;
			t18 += v * b4;
			t19 += v * b5;
			t20 += v * b6;
			t21 += v * b7;
			t22 += v * b8;
			t23 += v * b9;
			t24 += v * b10;
			t25 += v * b11;
			t26 += v * b12;
			t27 += v * b13;
			t28 += v * b14;
			t29 += v * b15;
			v = a[15];
			t15 += v * b0;
			t16 += v * b1;
			t17 += v * b2;
			t18 += v * b3;
			t19 += v * b4;
			t20 += v * b5;
			t21 += v * b6;
			t22 += v * b7;
			t23 += v * b8;
			t24 += v * b9;
			t25 += v * b10;
			t26 += v * b11;
			t27 += v * b12;
			t28 += v * b13;
			t29 += v * b14;
			t30 += v * b15;
			t0 += 38 * t16;
			t1 += 38 * t17;
			t2 += 38 * t18;
			t3 += 38 * t19;
			t4 += 38 * t20;
			t5 += 38 * t21;
			t6 += 38 * t22;
			t7 += 38 * t23;
			t8 += 38 * t24;
			t9 += 38 * t25;
			t10 += 38 * t26;
			t11 += 38 * t27;
			t12 += 38 * t28;
			t13 += 38 * t29;
			t14 += 38 * t30;
			c = 1;
			v = t0 + c + 65535;
			c = Math.floor(v / 65536);
			t0 = v - c * 65536;
			v = t1 + c + 65535;
			c = Math.floor(v / 65536);
			t1 = v - c * 65536;
			v = t2 + c + 65535;
			c = Math.floor(v / 65536);
			t2 = v - c * 65536;
			v = t3 + c + 65535;
			c = Math.floor(v / 65536);
			t3 = v - c * 65536;
			v = t4 + c + 65535;
			c = Math.floor(v / 65536);
			t4 = v - c * 65536;
			v = t5 + c + 65535;
			c = Math.floor(v / 65536);
			t5 = v - c * 65536;
			v = t6 + c + 65535;
			c = Math.floor(v / 65536);
			t6 = v - c * 65536;
			v = t7 + c + 65535;
			c = Math.floor(v / 65536);
			t7 = v - c * 65536;
			v = t8 + c + 65535;
			c = Math.floor(v / 65536);
			t8 = v - c * 65536;
			v = t9 + c + 65535;
			c = Math.floor(v / 65536);
			t9 = v - c * 65536;
			v = t10 + c + 65535;
			c = Math.floor(v / 65536);
			t10 = v - c * 65536;
			v = t11 + c + 65535;
			c = Math.floor(v / 65536);
			t11 = v - c * 65536;
			v = t12 + c + 65535;
			c = Math.floor(v / 65536);
			t12 = v - c * 65536;
			v = t13 + c + 65535;
			c = Math.floor(v / 65536);
			t13 = v - c * 65536;
			v = t14 + c + 65535;
			c = Math.floor(v / 65536);
			t14 = v - c * 65536;
			v = t15 + c + 65535;
			c = Math.floor(v / 65536);
			t15 = v - c * 65536;
			t0 += c - 1 + 37 * (c - 1);
			c = 1;
			v = t0 + c + 65535;
			c = Math.floor(v / 65536);
			t0 = v - c * 65536;
			v = t1 + c + 65535;
			c = Math.floor(v / 65536);
			t1 = v - c * 65536;
			v = t2 + c + 65535;
			c = Math.floor(v / 65536);
			t2 = v - c * 65536;
			v = t3 + c + 65535;
			c = Math.floor(v / 65536);
			t3 = v - c * 65536;
			v = t4 + c + 65535;
			c = Math.floor(v / 65536);
			t4 = v - c * 65536;
			v = t5 + c + 65535;
			c = Math.floor(v / 65536);
			t5 = v - c * 65536;
			v = t6 + c + 65535;
			c = Math.floor(v / 65536);
			t6 = v - c * 65536;
			v = t7 + c + 65535;
			c = Math.floor(v / 65536);
			t7 = v - c * 65536;
			v = t8 + c + 65535;
			c = Math.floor(v / 65536);
			t8 = v - c * 65536;
			v = t9 + c + 65535;
			c = Math.floor(v / 65536);
			t9 = v - c * 65536;
			v = t10 + c + 65535;
			c = Math.floor(v / 65536);
			t10 = v - c * 65536;
			v = t11 + c + 65535;
			c = Math.floor(v / 65536);
			t11 = v - c * 65536;
			v = t12 + c + 65535;
			c = Math.floor(v / 65536);
			t12 = v - c * 65536;
			v = t13 + c + 65535;
			c = Math.floor(v / 65536);
			t13 = v - c * 65536;
			v = t14 + c + 65535;
			c = Math.floor(v / 65536);
			t14 = v - c * 65536;
			v = t15 + c + 65535;
			c = Math.floor(v / 65536);
			t15 = v - c * 65536;
			t0 += c - 1 + 37 * (c - 1);
			o[0] = t0;
			o[1] = t1;
			o[2] = t2;
			o[3] = t3;
			o[4] = t4;
			o[5] = t5;
			o[6] = t6;
			o[7] = t7;
			o[8] = t8;
			o[9] = t9;
			o[10] = t10;
			o[11] = t11;
			o[12] = t12;
			o[13] = t13;
			o[14] = t14;
			o[15] = t15;
		}
		function S(o, a) {
			M(o, a, a);
		}
		function inv25519(o, i) {
			var c = gf();
			var a = 0;
			for (; a < 16; a++) c[a] = i[a];
			for (a = 253; a >= 0; a--) {
				S(c, c);
				if (a !== 2 && a !== 4) M(c, c, i);
			}
			for (a = 0; a < 16; a++) o[a] = c[a];
		}
		function pow2523(o, i) {
			var c = gf();
			var a = 0;
			for (; a < 16; a++) c[a] = i[a];
			for (a = 250; a >= 0; a--) {
				S(c, c);
				if (a !== 1) M(c, c, i);
			}
			for (a = 0; a < 16; a++) o[a] = c[a];
		}
		function crypto_scalarmult(q, n, p) {
			var z = /* @__PURE__ */ new Uint8Array(32);
			var x = /* @__PURE__ */ new Float64Array(80), r, i;
			var a = gf(), b = gf(), c = gf(), d = gf(), e = gf(), f = gf();
			for (i = 0; i < 31; i++) z[i] = n[i];
			z[31] = n[31] & 127 | 64;
			z[0] &= 248;
			unpack25519(x, p);
			for (i = 0; i < 16; i++) {
				b[i] = x[i];
				d[i] = a[i] = c[i] = 0;
			}
			a[0] = d[0] = 1;
			for (i = 254; i >= 0; --i) {
				r = z[i >>> 3] >>> (i & 7) & 1;
				sel25519(a, b, r);
				sel25519(c, d, r);
				A(e, a, c);
				Z(a, a, c);
				A(c, b, d);
				Z(b, b, d);
				S(d, e);
				S(f, a);
				M(a, c, a);
				M(c, b, e);
				A(e, a, c);
				Z(a, a, c);
				S(b, a);
				Z(c, d, f);
				M(a, c, _121665);
				A(a, a, d);
				M(c, c, a);
				M(a, d, f);
				M(d, b, x);
				S(b, e);
				sel25519(a, b, r);
				sel25519(c, d, r);
			}
			for (i = 0; i < 16; i++) {
				x[i + 16] = a[i];
				x[i + 32] = c[i];
				x[i + 48] = b[i];
				x[i + 64] = d[i];
			}
			var x32 = x.subarray(32);
			var x16 = x.subarray(16);
			inv25519(x32, x32);
			M(x16, x16, x32);
			pack25519(q, x16);
			return 0;
		}
		function crypto_scalarmult_base(q, n) {
			return crypto_scalarmult(q, n, _9);
		}
		function crypto_box_keypair(y, x) {
			randombytes(x, 32);
			return crypto_scalarmult_base(y, x);
		}
		function crypto_box_beforenm(k, y, x) {
			var s = /* @__PURE__ */ new Uint8Array(32);
			crypto_scalarmult(s, x, y);
			return crypto_core_hsalsa20(k, _0, s, sigma);
		}
		var crypto_box_afternm = crypto_secretbox;
		var crypto_box_open_afternm = crypto_secretbox_open;
		function crypto_box(c, m, d, n, y, x) {
			var k = /* @__PURE__ */ new Uint8Array(32);
			crypto_box_beforenm(k, y, x);
			return crypto_box_afternm(c, m, d, n, k);
		}
		function crypto_box_open(m, c, d, n, y, x) {
			var k = /* @__PURE__ */ new Uint8Array(32);
			crypto_box_beforenm(k, y, x);
			return crypto_box_open_afternm(m, c, d, n, k);
		}
		var K = [
			0x428a2f98,
			0xd728ae22,
			0x71374491,
			602891725,
			0xb5c0fbcf,
			0xec4d3b2f,
			0xe9b5dba5,
			0x8189dbbc,
			961987163,
			0xf348b538,
			0x59f111f1,
			0xb605d019,
			0x923f82a4,
			0xaf194f9b,
			0xab1c5ed5,
			0xda6d8118,
			0xd807aa98,
			0xa3030242,
			310598401,
			0x45706fbe,
			607225278,
			0x4ee4b28c,
			0x550c7dc3,
			0xd5ffb4e2,
			0x72be5d74,
			0xf27b896f,
			0x80deb1fe,
			991336113,
			0x9bdc06a7,
			633803317,
			0xc19bf174,
			0xcf692694,
			0xe49b69c1,
			0x9ef14ad2,
			0xefbe4786,
			944711139,
			0xfc19dc6,
			0x8b8cd5b5,
			604807628,
			0x77ac9c65,
			770255983,
			0x592b0275,
			0x4a7484aa,
			0x6ea6e483,
			0x5cb0a9dc,
			0xbd41fbd4,
			0x76f988da,
			0x831153b5,
			0x983e5152,
			0xee66dfab,
			0xa831c66d,
			766784016,
			0xb00327c8,
			0x98fb213f,
			0xbf597fc7,
			0xbeef0ee4,
			0xc6e00bf3,
			0x3da88fc2,
			0xd5a79147,
			0x930aa725,
			0x6ca6351,
			0xe003826f,
			338241895,
			0xa0e6e70,
			666307205,
			0x46d22ffc,
			773529912,
			0x5c26c926,
			0x4d2c6dfc,
			0x5ac42aed,
			0x53380d13,
			0x9d95b3df,
			0x650a7354,
			0x8baf63de,
			0x766a0abb,
			0x3c77b2a8,
			0x81c2c92e,
			0x47edaee6,
			0x92722c85,
			344077627,
			0xa2bfe8a1,
			0x4cf10364,
			0xa81a664b,
			0xbc423001,
			0xc24b8b70,
			0xd0f89791,
			0xc76c51a3,
			0x654be30,
			0xd192e819,
			0xd6ef5218,
			0xd6990624,
			0x5565a910,
			0xf40e3585,
			0x5771202a,
			275423344,
			851169720,
			430227734,
			0xb8d2d0c8,
			506948616,
			0x5141ab53,
			659060556,
			0xdf8eeb99,
			883997877,
			0xe19b48a8,
			958139571,
			0xc5c95a63,
			0x4ed8aa4a,
			0xe3418acb,
			0x5b9cca4f,
			0x7763e373,
			0x682e6ff3,
			0xd6b2b8a3,
			0x748f82ee,
			0x5defb2fc,
			0x78a5636f,
			0x43172f60,
			0x84c87814,
			0xa1f0ab72,
			0x8cc70208,
			442776044,
			0x90befffa,
			593698344,
			0xa4506ceb,
			0xde82bde9,
			0xbef9a3f7,
			0xb2c67915,
			0xc67178f2,
			0xe372532b,
			0xca273ece,
			0xea26619c,
			0xd186b8c7,
			566280711,
			0xeada7dd6,
			0xcde0eb1e,
			0xf57d4f7f,
			0xee6ed178,
			0x6f067aa,
			0x72176fba,
			0xa637dc5,
			0xa2c898a6,
			289380356,
			0xbef90dae,
			460393269,
			320620315,
			685471733,
			587496836,
			852142971,
			0x40c72493,
			0x3c9ebe0a,
			365543100,
			0x431d67c4,
			0x9c100d4c,
			0x4cc5d4be,
			0xcb3e42b6,
			0x597f299c,
			0xfc657e2a,
			0x5fcb6fab,
			987167468,
			0x6c44198c,
			0x4a475817
		];
		function crypto_hashblocks_hl(hh, hl, m, n) {
			var wh = /* @__PURE__ */ new Int32Array(16), wl = /* @__PURE__ */ new Int32Array(16), bh0, bh1, bh2, bh3, bh4, bh5, bh6, bh7, bl0, bl1, bl2, bl3, bl4, bl5, bl6, bl7, th, tl, i, j, h, l, a, b, c, d;
			var ah0 = hh[0], ah1 = hh[1], ah2 = hh[2], ah3 = hh[3], ah4 = hh[4], ah5 = hh[5], ah6 = hh[6], ah7 = hh[7], al0 = hl[0], al1 = hl[1], al2 = hl[2], al3 = hl[3], al4 = hl[4], al5 = hl[5], al6 = hl[6], al7 = hl[7];
			var pos = 0;
			while (n >= 128) {
				for (i = 0; i < 16; i++) {
					j = 8 * i + pos;
					wh[i] = m[j + 0] << 24 | m[j + 1] << 16 | m[j + 2] << 8 | m[j + 3];
					wl[i] = m[j + 4] << 24 | m[j + 5] << 16 | m[j + 6] << 8 | m[j + 7];
				}
				for (i = 0; i < 80; i++) {
					bh0 = ah0;
					bh1 = ah1;
					bh2 = ah2;
					bh3 = ah3;
					bh4 = ah4;
					bh5 = ah5;
					bh6 = ah6;
					bh7 = ah7;
					bl0 = al0;
					bl1 = al1;
					bl2 = al2;
					bl3 = al3;
					bl4 = al4;
					bl5 = al5;
					bl6 = al6;
					bl7 = al7;
					h = ah7;
					l = al7;
					a = l & 65535;
					b = l >>> 16;
					c = h & 65535;
					d = h >>> 16;
					h = (ah4 >>> 14 | al4 << 18) ^ (ah4 >>> 18 | al4 << 14) ^ (al4 >>> 9 | ah4 << 23);
					l = (al4 >>> 14 | ah4 << 18) ^ (al4 >>> 18 | ah4 << 14) ^ (ah4 >>> 9 | al4 << 23);
					a += l & 65535;
					b += l >>> 16;
					c += h & 65535;
					d += h >>> 16;
					h = ah4 & ah5 ^ ~ah4 & ah6;
					l = al4 & al5 ^ ~al4 & al6;
					a += l & 65535;
					b += l >>> 16;
					c += h & 65535;
					d += h >>> 16;
					h = K[i * 2];
					l = K[i * 2 + 1];
					a += l & 65535;
					b += l >>> 16;
					c += h & 65535;
					d += h >>> 16;
					h = wh[i % 16];
					l = wl[i % 16];
					a += l & 65535;
					b += l >>> 16;
					c += h & 65535;
					d += h >>> 16;
					b += a >>> 16;
					c += b >>> 16;
					d += c >>> 16;
					th = c & 65535 | d << 16;
					tl = a & 65535 | b << 16;
					h = th;
					l = tl;
					a = l & 65535;
					b = l >>> 16;
					c = h & 65535;
					d = h >>> 16;
					h = (ah0 >>> 28 | al0 << 4) ^ (al0 >>> 2 | ah0 << 30) ^ (al0 >>> 7 | ah0 << 25);
					l = (al0 >>> 28 | ah0 << 4) ^ (ah0 >>> 2 | al0 << 30) ^ (ah0 >>> 7 | al0 << 25);
					a += l & 65535;
					b += l >>> 16;
					c += h & 65535;
					d += h >>> 16;
					h = ah0 & ah1 ^ ah0 & ah2 ^ ah1 & ah2;
					l = al0 & al1 ^ al0 & al2 ^ al1 & al2;
					a += l & 65535;
					b += l >>> 16;
					c += h & 65535;
					d += h >>> 16;
					b += a >>> 16;
					c += b >>> 16;
					d += c >>> 16;
					bh7 = c & 65535 | d << 16;
					bl7 = a & 65535 | b << 16;
					h = bh3;
					l = bl3;
					a = l & 65535;
					b = l >>> 16;
					c = h & 65535;
					d = h >>> 16;
					h = th;
					l = tl;
					a += l & 65535;
					b += l >>> 16;
					c += h & 65535;
					d += h >>> 16;
					b += a >>> 16;
					c += b >>> 16;
					d += c >>> 16;
					bh3 = c & 65535 | d << 16;
					bl3 = a & 65535 | b << 16;
					ah1 = bh0;
					ah2 = bh1;
					ah3 = bh2;
					ah4 = bh3;
					ah5 = bh4;
					ah6 = bh5;
					ah7 = bh6;
					ah0 = bh7;
					al1 = bl0;
					al2 = bl1;
					al3 = bl2;
					al4 = bl3;
					al5 = bl4;
					al6 = bl5;
					al7 = bl6;
					al0 = bl7;
					if (i % 16 === 15) for (j = 0; j < 16; j++) {
						h = wh[j];
						l = wl[j];
						a = l & 65535;
						b = l >>> 16;
						c = h & 65535;
						d = h >>> 16;
						h = wh[(j + 9) % 16];
						l = wl[(j + 9) % 16];
						a += l & 65535;
						b += l >>> 16;
						c += h & 65535;
						d += h >>> 16;
						th = wh[(j + 1) % 16];
						tl = wl[(j + 1) % 16];
						h = (th >>> 1 | tl << 31) ^ (th >>> 8 | tl << 24) ^ th >>> 7;
						l = (tl >>> 1 | th << 31) ^ (tl >>> 8 | th << 24) ^ (tl >>> 7 | th << 25);
						a += l & 65535;
						b += l >>> 16;
						c += h & 65535;
						d += h >>> 16;
						th = wh[(j + 14) % 16];
						tl = wl[(j + 14) % 16];
						h = (th >>> 19 | tl << 13) ^ (tl >>> 29 | th << 3) ^ th >>> 6;
						l = (tl >>> 19 | th << 13) ^ (th >>> 29 | tl << 3) ^ (tl >>> 6 | th << 26);
						a += l & 65535;
						b += l >>> 16;
						c += h & 65535;
						d += h >>> 16;
						b += a >>> 16;
						c += b >>> 16;
						d += c >>> 16;
						wh[j] = c & 65535 | d << 16;
						wl[j] = a & 65535 | b << 16;
					}
				}
				h = ah0;
				l = al0;
				a = l & 65535;
				b = l >>> 16;
				c = h & 65535;
				d = h >>> 16;
				h = hh[0];
				l = hl[0];
				a += l & 65535;
				b += l >>> 16;
				c += h & 65535;
				d += h >>> 16;
				b += a >>> 16;
				c += b >>> 16;
				d += c >>> 16;
				hh[0] = ah0 = c & 65535 | d << 16;
				hl[0] = al0 = a & 65535 | b << 16;
				h = ah1;
				l = al1;
				a = l & 65535;
				b = l >>> 16;
				c = h & 65535;
				d = h >>> 16;
				h = hh[1];
				l = hl[1];
				a += l & 65535;
				b += l >>> 16;
				c += h & 65535;
				d += h >>> 16;
				b += a >>> 16;
				c += b >>> 16;
				d += c >>> 16;
				hh[1] = ah1 = c & 65535 | d << 16;
				hl[1] = al1 = a & 65535 | b << 16;
				h = ah2;
				l = al2;
				a = l & 65535;
				b = l >>> 16;
				c = h & 65535;
				d = h >>> 16;
				h = hh[2];
				l = hl[2];
				a += l & 65535;
				b += l >>> 16;
				c += h & 65535;
				d += h >>> 16;
				b += a >>> 16;
				c += b >>> 16;
				d += c >>> 16;
				hh[2] = ah2 = c & 65535 | d << 16;
				hl[2] = al2 = a & 65535 | b << 16;
				h = ah3;
				l = al3;
				a = l & 65535;
				b = l >>> 16;
				c = h & 65535;
				d = h >>> 16;
				h = hh[3];
				l = hl[3];
				a += l & 65535;
				b += l >>> 16;
				c += h & 65535;
				d += h >>> 16;
				b += a >>> 16;
				c += b >>> 16;
				d += c >>> 16;
				hh[3] = ah3 = c & 65535 | d << 16;
				hl[3] = al3 = a & 65535 | b << 16;
				h = ah4;
				l = al4;
				a = l & 65535;
				b = l >>> 16;
				c = h & 65535;
				d = h >>> 16;
				h = hh[4];
				l = hl[4];
				a += l & 65535;
				b += l >>> 16;
				c += h & 65535;
				d += h >>> 16;
				b += a >>> 16;
				c += b >>> 16;
				d += c >>> 16;
				hh[4] = ah4 = c & 65535 | d << 16;
				hl[4] = al4 = a & 65535 | b << 16;
				h = ah5;
				l = al5;
				a = l & 65535;
				b = l >>> 16;
				c = h & 65535;
				d = h >>> 16;
				h = hh[5];
				l = hl[5];
				a += l & 65535;
				b += l >>> 16;
				c += h & 65535;
				d += h >>> 16;
				b += a >>> 16;
				c += b >>> 16;
				d += c >>> 16;
				hh[5] = ah5 = c & 65535 | d << 16;
				hl[5] = al5 = a & 65535 | b << 16;
				h = ah6;
				l = al6;
				a = l & 65535;
				b = l >>> 16;
				c = h & 65535;
				d = h >>> 16;
				h = hh[6];
				l = hl[6];
				a += l & 65535;
				b += l >>> 16;
				c += h & 65535;
				d += h >>> 16;
				b += a >>> 16;
				c += b >>> 16;
				d += c >>> 16;
				hh[6] = ah6 = c & 65535 | d << 16;
				hl[6] = al6 = a & 65535 | b << 16;
				h = ah7;
				l = al7;
				a = l & 65535;
				b = l >>> 16;
				c = h & 65535;
				d = h >>> 16;
				h = hh[7];
				l = hl[7];
				a += l & 65535;
				b += l >>> 16;
				c += h & 65535;
				d += h >>> 16;
				b += a >>> 16;
				c += b >>> 16;
				d += c >>> 16;
				hh[7] = ah7 = c & 65535 | d << 16;
				hl[7] = al7 = a & 65535 | b << 16;
				pos += 128;
				n -= 128;
			}
			return n;
		}
		function crypto_hash(out, m, n) {
			var hh = /* @__PURE__ */ new Int32Array(8), hl = /* @__PURE__ */ new Int32Array(8), x = /* @__PURE__ */ new Uint8Array(256), i, b = n;
			hh[0] = 0x6a09e667;
			hh[1] = 0xbb67ae85;
			hh[2] = 0x3c6ef372;
			hh[3] = 0xa54ff53a;
			hh[4] = 0x510e527f;
			hh[5] = 0x9b05688c;
			hh[6] = 528734635;
			hh[7] = 0x5be0cd19;
			hl[0] = 0xf3bcc908;
			hl[1] = 0x84caa73b;
			hl[2] = 0xfe94f82b;
			hl[3] = 0x5f1d36f1;
			hl[4] = 0xade682d1;
			hl[5] = 725511199;
			hl[6] = 0xfb41bd6b;
			hl[7] = 327033209;
			crypto_hashblocks_hl(hh, hl, m, n);
			n %= 128;
			for (i = 0; i < n; i++) x[i] = m[b - n + i];
			x[n] = 128;
			n = 256 - 128 * (n < 112 ? 1 : 0);
			x[n - 9] = 0;
			ts64(x, n - 8, b / 536870912 | 0, b << 3);
			crypto_hashblocks_hl(hh, hl, x, n);
			for (i = 0; i < 8; i++) ts64(out, 8 * i, hh[i], hl[i]);
			return 0;
		}
		function add(p, q) {
			var a = gf(), b = gf(), c = gf(), d = gf(), e = gf(), f = gf(), g = gf(), h = gf(), t = gf();
			Z(a, p[1], p[0]);
			Z(t, q[1], q[0]);
			M(a, a, t);
			A(b, p[0], p[1]);
			A(t, q[0], q[1]);
			M(b, b, t);
			M(c, p[3], q[3]);
			M(c, c, D2);
			M(d, p[2], q[2]);
			A(d, d, d);
			Z(e, b, a);
			Z(f, d, c);
			A(g, d, c);
			A(h, b, a);
			M(p[0], e, f);
			M(p[1], h, g);
			M(p[2], g, f);
			M(p[3], e, h);
		}
		function cswap(p, q, b) {
			var i = 0;
			for (; i < 4; i++) sel25519(p[i], q[i], b);
		}
		function pack(r, p) {
			var tx = gf(), ty = gf(), zi = gf();
			inv25519(zi, p[2]);
			M(tx, p[0], zi);
			M(ty, p[1], zi);
			pack25519(r, ty);
			r[31] ^= par25519(tx) << 7;
		}
		function scalarmult(p, q, s) {
			var b, i;
			set25519(p[0], gf0);
			set25519(p[1], gf1);
			set25519(p[2], gf1);
			set25519(p[3], gf0);
			for (i = 255; i >= 0; --i) {
				b = s[i / 8 | 0] >> (i & 7) & 1;
				cswap(p, q, b);
				add(q, p);
				add(p, p);
				cswap(p, q, b);
			}
		}
		function scalarbase(p, s) {
			var q = [
				gf(),
				gf(),
				gf(),
				gf()
			];
			set25519(q[0], X);
			set25519(q[1], Y);
			set25519(q[2], gf1);
			M(q[3], X, Y);
			scalarmult(p, q, s);
		}
		function crypto_sign_keypair(pk, sk, seeded) {
			var d = /* @__PURE__ */ new Uint8Array(64);
			var p = [
				gf(),
				gf(),
				gf(),
				gf()
			];
			var i;
			if (!seeded) randombytes(sk, 32);
			crypto_hash(d, sk, 32);
			d[0] &= 248;
			d[31] &= 127;
			d[31] |= 64;
			scalarbase(p, d);
			pack(pk, p);
			for (i = 0; i < 32; i++) sk[i + 32] = pk[i];
			return 0;
		}
		var L = new Float64Array([
			237,
			211,
			245,
			92,
			26,
			99,
			18,
			88,
			214,
			156,
			247,
			162,
			222,
			249,
			222,
			20,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			16
		]);
		function modL(r, x) {
			var carry, i = 63, j, k;
			for (; i >= 32; --i) {
				carry = 0;
				for (j = i - 32, k = i - 12; j < k; ++j) {
					x[j] += carry - 16 * x[i] * L[j - (i - 32)];
					carry = x[j] + 128 >> 8;
					x[j] -= carry * 256;
				}
				x[j] += carry;
				x[i] = 0;
			}
			carry = 0;
			for (j = 0; j < 32; j++) {
				x[j] += carry - (x[31] >> 4) * L[j];
				carry = x[j] >> 8;
				x[j] &= 255;
			}
			for (j = 0; j < 32; j++) x[j] -= carry * L[j];
			for (i = 0; i < 32; i++) {
				x[i + 1] += x[i] >> 8;
				r[i] = x[i] & 255;
			}
		}
		function reduce(r) {
			var x = /* @__PURE__ */ new Float64Array(64), i = 0;
			for (; i < 64; i++) x[i] = r[i];
			for (i = 0; i < 64; i++) r[i] = 0;
			modL(r, x);
		}
		function crypto_sign(sm, m, n, sk) {
			var d = /* @__PURE__ */ new Uint8Array(64), h = /* @__PURE__ */ new Uint8Array(64), r = /* @__PURE__ */ new Uint8Array(64);
			var i, j, x = /* @__PURE__ */ new Float64Array(64);
			var p = [
				gf(),
				gf(),
				gf(),
				gf()
			];
			crypto_hash(d, sk, 32);
			d[0] &= 248;
			d[31] &= 127;
			d[31] |= 64;
			var smlen = n + 64;
			for (i = 0; i < n; i++) sm[64 + i] = m[i];
			for (i = 0; i < 32; i++) sm[32 + i] = d[32 + i];
			crypto_hash(r, sm.subarray(32), n + 32);
			reduce(r);
			scalarbase(p, r);
			pack(sm, p);
			for (i = 32; i < 64; i++) sm[i] = sk[i];
			crypto_hash(h, sm, n + 64);
			reduce(h);
			for (i = 0; i < 64; i++) x[i] = 0;
			for (i = 0; i < 32; i++) x[i] = r[i];
			for (i = 0; i < 32; i++) for (j = 0; j < 32; j++) x[i + j] += h[i] * d[j];
			modL(sm.subarray(32), x);
			return smlen;
		}
		function unpackneg(r, p) {
			var t = gf(), chk = gf(), num = gf(), den = gf(), den2 = gf(), den4 = gf(), den6 = gf();
			set25519(r[2], gf1);
			unpack25519(r[1], p);
			S(num, r[1]);
			M(den, num, D);
			Z(num, num, r[2]);
			A(den, r[2], den);
			S(den2, den);
			S(den4, den2);
			M(den6, den4, den2);
			M(t, den6, num);
			M(t, t, den);
			pow2523(t, t);
			M(t, t, num);
			M(t, t, den);
			M(t, t, den);
			M(r[0], t, den);
			S(chk, r[0]);
			M(chk, chk, den);
			if (neq25519(chk, num)) M(r[0], r[0], I);
			S(chk, r[0]);
			M(chk, chk, den);
			if (neq25519(chk, num)) return -1;
			if (par25519(r[0]) === p[31] >> 7) Z(r[0], gf0, r[0]);
			M(r[3], r[0], r[1]);
			return 0;
		}
		function crypto_sign_open(m, sm, n, pk) {
			var i, mlen;
			var t = /* @__PURE__ */ new Uint8Array(32), h = /* @__PURE__ */ new Uint8Array(64);
			var p = [
				gf(),
				gf(),
				gf(),
				gf()
			], q = [
				gf(),
				gf(),
				gf(),
				gf()
			];
			mlen = -1;
			if (n < 64) return -1;
			if (unpackneg(q, pk)) return -1;
			for (i = 0; i < n; i++) m[i] = sm[i];
			for (i = 0; i < 32; i++) m[i + 32] = pk[i];
			crypto_hash(h, m, n);
			reduce(h);
			scalarmult(p, q, h);
			scalarbase(q, sm.subarray(32));
			add(p, q);
			pack(t, p);
			n -= 64;
			if (crypto_verify_32(sm, 0, t, 0)) {
				for (i = 0; i < n; i++) m[i] = 0;
				return -1;
			}
			for (i = 0; i < n; i++) m[i] = sm[i + 64];
			mlen = n;
			return mlen;
		}
		var crypto_secretbox_KEYBYTES = 32, crypto_secretbox_NONCEBYTES = 24, crypto_secretbox_ZEROBYTES = 32, crypto_secretbox_BOXZEROBYTES = 16, crypto_scalarmult_BYTES = 32, crypto_scalarmult_SCALARBYTES = 32, crypto_box_PUBLICKEYBYTES = 32, crypto_box_SECRETKEYBYTES = 32, crypto_box_BEFORENMBYTES = 32, crypto_box_NONCEBYTES = crypto_secretbox_NONCEBYTES, crypto_box_ZEROBYTES = crypto_secretbox_ZEROBYTES, crypto_box_BOXZEROBYTES = crypto_secretbox_BOXZEROBYTES, crypto_sign_BYTES = 64, crypto_sign_PUBLICKEYBYTES = 32, crypto_sign_SECRETKEYBYTES = 64, crypto_sign_SEEDBYTES = 32, crypto_hash_BYTES = 64;
		nacl.lowlevel = {
			crypto_core_hsalsa20,
			crypto_stream_xor,
			crypto_stream,
			crypto_stream_salsa20_xor,
			crypto_stream_salsa20,
			crypto_onetimeauth,
			crypto_onetimeauth_verify,
			crypto_verify_16,
			crypto_verify_32,
			crypto_secretbox,
			crypto_secretbox_open,
			crypto_scalarmult,
			crypto_scalarmult_base,
			crypto_box_beforenm,
			crypto_box_afternm,
			crypto_box,
			crypto_box_open,
			crypto_box_keypair,
			crypto_hash,
			crypto_sign,
			crypto_sign_keypair,
			crypto_sign_open,
			crypto_secretbox_KEYBYTES,
			crypto_secretbox_NONCEBYTES,
			crypto_secretbox_ZEROBYTES,
			crypto_secretbox_BOXZEROBYTES,
			crypto_scalarmult_BYTES,
			crypto_scalarmult_SCALARBYTES,
			crypto_box_PUBLICKEYBYTES,
			crypto_box_SECRETKEYBYTES,
			crypto_box_BEFORENMBYTES,
			crypto_box_NONCEBYTES,
			crypto_box_ZEROBYTES,
			crypto_box_BOXZEROBYTES,
			crypto_sign_BYTES,
			crypto_sign_PUBLICKEYBYTES,
			crypto_sign_SECRETKEYBYTES,
			crypto_sign_SEEDBYTES,
			crypto_hash_BYTES
		};
		function checkLengths(k, n) {
			if (k.length !== crypto_secretbox_KEYBYTES) throw new Error("bad key size");
			if (n.length !== crypto_secretbox_NONCEBYTES) throw new Error("bad nonce size");
		}
		function checkBoxLengths(pk, sk) {
			if (pk.length !== crypto_box_PUBLICKEYBYTES) throw new Error("bad public key size");
			if (sk.length !== crypto_box_SECRETKEYBYTES) throw new Error("bad secret key size");
		}
		function checkArrayTypes() {
			var t, i = 0;
			for (; i < arguments.length; i++) if ((t = Object.prototype.toString.call(arguments[i])) !== "[object Uint8Array]") throw new TypeError("unexpected type " + t + ", use Uint8Array");
		}
		function cleanup(arr) {
			for (var i = 0; i < arr.length; i++) arr[i] = 0;
		}
		if (!nacl.util) {
			nacl.util = {};
			nacl.util.decodeUTF8 = nacl.util.encodeUTF8 = nacl.util.encodeBase64 = nacl.util.decodeBase64 = function() {
				throw new Error("nacl.util moved into separate package: https://github.com/dchest/tweetnacl-util-js");
			};
		}
		nacl.randomBytes = function(n) {
			var b = new Uint8Array(n);
			randombytes(b, n);
			return b;
		};
		nacl.secretbox = function(msg, nonce, key) {
			checkArrayTypes(msg, nonce, key);
			checkLengths(key, nonce);
			var m = new Uint8Array(crypto_secretbox_ZEROBYTES + msg.length);
			var c = new Uint8Array(m.length);
			for (var i = 0; i < msg.length; i++) m[i + crypto_secretbox_ZEROBYTES] = msg[i];
			crypto_secretbox(c, m, m.length, nonce, key);
			return c.subarray(crypto_secretbox_BOXZEROBYTES);
		};
		nacl.secretbox.open = function(box, nonce, key) {
			checkArrayTypes(box, nonce, key);
			checkLengths(key, nonce);
			var c = new Uint8Array(crypto_secretbox_BOXZEROBYTES + box.length);
			var m = new Uint8Array(c.length);
			for (var i = 0; i < box.length; i++) c[i + crypto_secretbox_BOXZEROBYTES] = box[i];
			if (c.length < 32) return false;
			if (crypto_secretbox_open(m, c, c.length, nonce, key) !== 0) return false;
			return m.subarray(crypto_secretbox_ZEROBYTES);
		};
		nacl.secretbox.keyLength = crypto_secretbox_KEYBYTES;
		nacl.secretbox.nonceLength = crypto_secretbox_NONCEBYTES;
		nacl.secretbox.overheadLength = crypto_secretbox_BOXZEROBYTES;
		nacl.scalarMult = function(n, p) {
			checkArrayTypes(n, p);
			if (n.length !== crypto_scalarmult_SCALARBYTES) throw new Error("bad n size");
			if (p.length !== crypto_scalarmult_BYTES) throw new Error("bad p size");
			var q = new Uint8Array(crypto_scalarmult_BYTES);
			crypto_scalarmult(q, n, p);
			return q;
		};
		nacl.scalarMult.base = function(n) {
			checkArrayTypes(n);
			if (n.length !== crypto_scalarmult_SCALARBYTES) throw new Error("bad n size");
			var q = new Uint8Array(crypto_scalarmult_BYTES);
			crypto_scalarmult_base(q, n);
			return q;
		};
		nacl.scalarMult.scalarLength = crypto_scalarmult_SCALARBYTES;
		nacl.scalarMult.groupElementLength = crypto_scalarmult_BYTES;
		nacl.box = function(msg, nonce, publicKey, secretKey) {
			var k = nacl.box.before(publicKey, secretKey);
			return nacl.secretbox(msg, nonce, k);
		};
		nacl.box.before = function(publicKey, secretKey) {
			checkArrayTypes(publicKey, secretKey);
			checkBoxLengths(publicKey, secretKey);
			var k = new Uint8Array(crypto_box_BEFORENMBYTES);
			crypto_box_beforenm(k, publicKey, secretKey);
			return k;
		};
		nacl.box.after = nacl.secretbox;
		nacl.box.open = function(msg, nonce, publicKey, secretKey) {
			var k = nacl.box.before(publicKey, secretKey);
			return nacl.secretbox.open(msg, nonce, k);
		};
		nacl.box.open.after = nacl.secretbox.open;
		nacl.box.keyPair = function() {
			var pk = new Uint8Array(crypto_box_PUBLICKEYBYTES);
			var sk = new Uint8Array(crypto_box_SECRETKEYBYTES);
			crypto_box_keypair(pk, sk);
			return {
				publicKey: pk,
				secretKey: sk
			};
		};
		nacl.box.keyPair.fromSecretKey = function(secretKey) {
			checkArrayTypes(secretKey);
			if (secretKey.length !== crypto_box_SECRETKEYBYTES) throw new Error("bad secret key size");
			var pk = new Uint8Array(crypto_box_PUBLICKEYBYTES);
			crypto_scalarmult_base(pk, secretKey);
			return {
				publicKey: pk,
				secretKey: new Uint8Array(secretKey)
			};
		};
		nacl.box.publicKeyLength = crypto_box_PUBLICKEYBYTES;
		nacl.box.secretKeyLength = crypto_box_SECRETKEYBYTES;
		nacl.box.sharedKeyLength = crypto_box_BEFORENMBYTES;
		nacl.box.nonceLength = crypto_box_NONCEBYTES;
		nacl.box.overheadLength = nacl.secretbox.overheadLength;
		nacl.sign = function(msg, secretKey) {
			checkArrayTypes(msg, secretKey);
			if (secretKey.length !== crypto_sign_SECRETKEYBYTES) throw new Error("bad secret key size");
			var signedMsg = new Uint8Array(crypto_sign_BYTES + msg.length);
			crypto_sign(signedMsg, msg, msg.length, secretKey);
			return signedMsg;
		};
		nacl.sign.open = function(signedMsg, publicKey) {
			if (arguments.length !== 2) throw new Error("nacl.sign.open accepts 2 arguments; did you mean to use nacl.sign.detached.verify?");
			checkArrayTypes(signedMsg, publicKey);
			if (publicKey.length !== crypto_sign_PUBLICKEYBYTES) throw new Error("bad public key size");
			var tmp = new Uint8Array(signedMsg.length);
			var mlen = crypto_sign_open(tmp, signedMsg, signedMsg.length, publicKey);
			if (mlen < 0) return null;
			var m = new Uint8Array(mlen);
			for (var i = 0; i < m.length; i++) m[i] = tmp[i];
			return m;
		};
		nacl.sign.detached = function(msg, secretKey) {
			var signedMsg = nacl.sign(msg, secretKey);
			var sig = new Uint8Array(crypto_sign_BYTES);
			for (var i = 0; i < sig.length; i++) sig[i] = signedMsg[i];
			return sig;
		};
		nacl.sign.detached.verify = function(msg, sig, publicKey) {
			checkArrayTypes(msg, sig, publicKey);
			if (sig.length !== crypto_sign_BYTES) throw new Error("bad signature size");
			if (publicKey.length !== crypto_sign_PUBLICKEYBYTES) throw new Error("bad public key size");
			var sm = new Uint8Array(crypto_sign_BYTES + msg.length);
			var m = new Uint8Array(crypto_sign_BYTES + msg.length);
			var i = 0;
			for (; i < crypto_sign_BYTES; i++) sm[i] = sig[i];
			for (i = 0; i < msg.length; i++) sm[i + crypto_sign_BYTES] = msg[i];
			return crypto_sign_open(m, sm, sm.length, publicKey) >= 0;
		};
		nacl.sign.keyPair = function() {
			var pk = new Uint8Array(crypto_sign_PUBLICKEYBYTES);
			var sk = new Uint8Array(crypto_sign_SECRETKEYBYTES);
			crypto_sign_keypair(pk, sk);
			return {
				publicKey: pk,
				secretKey: sk
			};
		};
		nacl.sign.keyPair.fromSecretKey = function(secretKey) {
			checkArrayTypes(secretKey);
			if (secretKey.length !== crypto_sign_SECRETKEYBYTES) throw new Error("bad secret key size");
			var pk = new Uint8Array(crypto_sign_PUBLICKEYBYTES);
			for (var i = 0; i < pk.length; i++) pk[i] = secretKey[32 + i];
			return {
				publicKey: pk,
				secretKey: new Uint8Array(secretKey)
			};
		};
		nacl.sign.keyPair.fromSeed = function(seed) {
			checkArrayTypes(seed);
			if (seed.length !== crypto_sign_SEEDBYTES) throw new Error("bad seed size");
			var pk = new Uint8Array(crypto_sign_PUBLICKEYBYTES);
			var sk = new Uint8Array(crypto_sign_SECRETKEYBYTES);
			for (var i = 0; i < 32; i++) sk[i] = seed[i];
			crypto_sign_keypair(pk, sk, true);
			return {
				publicKey: pk,
				secretKey: sk
			};
		};
		nacl.sign.publicKeyLength = crypto_sign_PUBLICKEYBYTES;
		nacl.sign.secretKeyLength = crypto_sign_SECRETKEYBYTES;
		nacl.sign.seedLength = crypto_sign_SEEDBYTES;
		nacl.sign.signatureLength = crypto_sign_BYTES;
		nacl.hash = function(msg) {
			checkArrayTypes(msg);
			var h = new Uint8Array(crypto_hash_BYTES);
			crypto_hash(h, msg, msg.length);
			return h;
		};
		nacl.hash.hashLength = crypto_hash_BYTES;
		nacl.verify = function(x, y) {
			checkArrayTypes(x, y);
			if (x.length === 0 || y.length === 0) return false;
			if (x.length !== y.length) return false;
			return vn(x, 0, y, 0, x.length) === 0 ? true : false;
		};
		nacl.setPRNG = function(fn) {
			randombytes = fn;
		};
		(function() {
			var crypto = typeof self !== "undefined" ? self.crypto || self.msCrypto : null;
			if (crypto && crypto.getRandomValues) {
				var QUOTA = 65536;
				nacl.setPRNG(function(x, n) {
					var i, v = new Uint8Array(n);
					for (i = 0; i < n; i += QUOTA) crypto.getRandomValues(v.subarray(i, i + Math.min(n - i, QUOTA)));
					for (i = 0; i < n; i++) x[i] = v[i];
					cleanup(v);
				});
			} else if (typeof __require !== "undefined") {
				crypto = __require("crypto");
				if (crypto && crypto.randomBytes) nacl.setPRNG(function(x, n) {
					var i, v = crypto.randomBytes(n);
					for (i = 0; i < n; i++) x[i] = v[i];
					cleanup(v);
				});
			}
		})();
	})(typeof module !== "undefined" && module.exports ? module.exports : self.nacl = self.nacl || {});
}));
// node_modules/bcrypt-pbkdf/index.js
var require_bcrypt_pbkdf = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var crypto_hash_sha512 = require_nacl_fast().lowlevel.crypto_hash;
	var BLF_J = 0;
	var Blowfish = function() {
		this.S = [
			new Uint32Array([
				0xd1310ba6,
				0x98dfb5ac,
				805139163,
				0xd01adfb7,
				0xb8e1afed,
				0x6a267e96,
				0xba7c9045,
				0xf12c7f99,
				614570311,
				0xb3916cf7,
				0x801f2e2,
				0x858efc16,
				0x636920d8,
				0x71574e69,
				0xa458fea3,
				0xf4933d7e,
				0xd95748f,
				0x728eb658,
				0x718bcd58,
				0x82154aee,
				0x7b54a41d,
				0xc25a59b5,
				0x9c30d539,
				720527379,
				0xc5d1b023,
				677414384,
				0xca417918,
				0xb8db38ef,
				0x8e79dcb0,
				0x603a180e,
				0x6c9e0e8b,
				0xb01e8a3e,
				0xd71577c1,
				0xbd314b27,
				0x78af2fda,
				0x55605c60,
				0xe65525f3,
				0xaa55ab94,
				0x57489862,
				0x63e81440,
				0x55ca396a,
				715854006,
				0xb4cc5c34,
				289532110,
				0xa15486af,
				0x7c72e993,
				0xb3ee1411,
				0x636fbc2a,
				732546397,
				0x741831f6,
				0xce5c3e16,
				0x9b87931e,
				0xafd6ba33,
				0x6c24cf5c,
				0x7a325381,
				680887927,
				999245976,
				0x6b4bb9af,
				0xc4bfe81b,
				0x66282193,
				0x61d809cc,
				0xfb21a991,
				0x487cac60,
				0x5dec8032,
				0xef845d5d,
				0xe98575b1,
				0xdc262302,
				0xeb651b88,
				596196993,
				0xd396acc5,
				0xf6d6ff3,
				0x83f44239,
				772490370,
				0xa4842004,
				0x69c8f04a,
				0x9e1f9b5e,
				566650946,
				0xf6e96c9a,
				0x670c9c61,
				0xabd388f0,
				0x6a51a0d2,
				0xd8542f68,
				0x960fa728,
				0xab5133a3,
				0x6eef0b6c,
				326777828,
				0xba3bf050,
				0x7efb2a98,
				0xa1f1651d,
				967770486,
				0x66ca593e,
				0x82430e88,
				0x8cee8619,
				0x456f9fb4,
				0x7d84a5c3,
				998989502,
				0xe06f75d8,
				0x85c12073,
				0x401a449f,
				0x56c16aa6,
				0x4ed3aa62,
				910128902,
				469688178,
				0x429b023d,
				936433444,
				0xd00a1248,
				0xdb0fead3,
				0x49f1c09b,
				0x75372c9,
				0x80991b7b,
				634681816,
				0xf6e8def7,
				0xe3fe501a,
				0xb6794c3b,
				0x976ce0bd,
				79693498,
				0xc1a94fb6,
				0x409f60c4,
				0x5e5c9ec2,
				426386531,
				0x68fb6faf,
				0x3e6c53b5,
				322548459,
				995290223,
				0x6dfc511f,
				0x9b30952c,
				0xcc814544,
				0xaf5ebd09,
				0xbee3d004,
				0xde334afd,
				0x660f2807,
				422464435,
				0xc0cba857,
				0x45c8740f,
				0xd20b5f39,
				0xb9d3fbdb,
				0x5579c0bd,
				442511882,
				0xd6a100c6,
				0x402c7279,
				0x679f25fe,
				0xfb1fa3cc,
				0x8ea5e9f8,
				0xdb3222f8,
				0x3c7516df,
				0xfd616b15,
				793779912,
				0xad0552ab,
				842905082,
				0xfd238760,
				0x53317b48,
				0x3e00df82,
				0x9e5c57bb,
				0xca6f8ca0,
				445077038,
				0xdf1769db,
				0xd542a8f6,
				679411651,
				0xac6732c6,
				0x8c4f5573,
				0x695b27b0,
				0xbbca58c8,
				0xe1ffa35d,
				0xb8f011a0,
				284835224,
				0xfd2183b8,
				0x4afcb56c,
				768725851,
				0x9a53e479,
				0xb6f84565,
				0xd28e49bc,
				0x4bfb9790,
				0xe1ddf2da,
				0xa4cb7e33,
				0x62fb1341,
				0xcee4c6e8,
				0xef20cada,
				913787905,
				0xd07e9efe,
				737222580,
				0x95dbda4d,
				0xae909198,
				0xeaad8e71,
				0x6b93d5a0,
				0xd08ed1d0,
				0xafc725e0,
				0x8e3c5b2f,
				0x8e7594b7,
				0x8ff6e2fb,
				0xf2122b64,
				0x8888b812,
				0x900df01c,
				0x4fad5ea0,
				0x688fc31c,
				0xd1cff191,
				0xb3a8c1ad,
				791618072,
				0xbe0e1777,
				0xea752dfe,
				0x8b021fa1,
				0xe5a0cc0f,
				0xb56f74e8,
				413987798,
				0xce89e299,
				0xb4a84fe0,
				0xfd13e0b7,
				0x7cc43b81,
				0xd2ada8d9,
				375366246,
				0x80957705,
				0x93cc7314,
				555357303,
				0xe6ad2065,
				0x77b5fa86,
				0xc75442f5,
				0xfb9d35cf,
				0xebcdaf0c,
				0x7b3e89a0,
				0xd6411bd3,
				0xae1e7e49,
				2428461,
				544322398,
				577241275,
				0x57b8e0af,
				610547355,
				0xf009b91e,
				0x5563911d,
				0x59dfa6aa,
				0x78c14389,
				0xd95a537f,
				545086370,
				48609733,
				0x83260376,
				0x6295cfa9,
				298326376,
				0x4e734a41,
				0xb3472dca,
				0x7b14a94a,
				458293330,
				0x9a532915,
				0xd60f573f,
				0xbc9bc6e4,
				727753846,
				0x81e67400,
				0x8ba6fb5,
				0x571be91f,
				0xf296ec6b,
				705550613,
				0xb6636521,
				0xe7b9f9b6,
				0xff34052e,
				0xc5855664,
				0x53b02d5d,
				0xa99f8fa1,
				0x8ba4799,
				0x6e85076a
			]),
			new Uint32Array([
				0x4b7a70e9,
				0xb5b32944,
				0xdb75092e,
				0xc4192623,
				290971e4,
				0x49a7df7d,
				0x9cee60b8,
				0x8fedb266,
				0xecaa8c71,
				0x699a17ff,
				0x5664526c,
				0xc2b19ee1,
				422970021,
				0x75094c29,
				0xa0591340,
				0xe4183a3e,
				0x3f54989a,
				0x5b429d65,
				0x6b8fe4d6,
				0x99f73fd6,
				0xa1d29c07,
				0xefe830f5,
				0x4d2d38e6,
				0xf0255dc1,
				0x4cdd2086,
				0x8470eb26,
				0x6382e9c6,
				35572830,
				0x9686b3f,
				0x3ebaefc9,
				0x3c971814,
				0x6b6a70a1,
				0x687f3584,
				0x52a0e286,
				0xb79c5305,
				0xaa500737,
				0x3e07841c,
				0x7fdeae5c,
				0x8e7d44ec,
				0x5716f2b8,
				0xb03ada37,
				0xf0500c0d,
				0xf01c1f04,
				33600511,
				0xae0cf51a,
				0x3cb574b2,
				629373528,
				0xdc0921bd,
				0xd19113f9,
				0x7ca92ff6,
				0x94324773,
				586499841,
				988145025,
				935516892,
				0xc8b57634,
				0x9af3dda7,
				0xa9446146,
				0xfd0030e,
				0xecc8c73e,
				0xa4751e41,
				0xe238cd99,
				0x3bea0e2f,
				847297441,
				406762289,
				0x4e548b38,
				0x4f6db908,
				0x6f420d03,
				0xf60a04bf,
				750260880,
				613907577,
				0x5679b072,
				0xbcaf89af,
				0xde9a771f,
				0xd9930810,
				0xb38bae12,
				0xdccf3f2e,
				0x5512721f,
				778793252,
				0x501adde6,
				0x9f84cd87,
				0x7a584718,
				0x7408da17,
				0xbc9f9abc,
				0xe94b7d8c,
				0xec7aec3a,
				0xdb851dfa,
				0x63094366,
				0xc464c3d2,
				0xef1c1847,
				840292616,
				0xdd433b37,
				616741398,
				312560963,
				711312465,
				0x50940002,
				322626781,
				0x71dff89e,
				271666773,
				0x81ac77d6,
				0x5f11199b,
				70604529,
				0xd7a3c76b,
				0x3c11183b,
				0x5924a509,
				0xf28fe6ed,
				0x97f1fbfa,
				0x9ebabf2c,
				504708206,
				0x86e34570,
				0xeae96fb1,
				0x860e5e0a,
				0x5a3e2ab3,
				0x771fe71c,
				0x4e3d06fa,
				694541497,
				0x99e71d0f,
				0x803e89d6,
				0x5266c825,
				776784248,
				0x9c10b36a,
				0xc6150eba,
				0x94e2ea78,
				0xa5fc3c53,
				503983604,
				0xf2f74ea7,
				907881277,
				423175695,
				432175456,
				0x5223a708,
				0xf71312b6,
				0xebadfe6e,
				0xeac31f66,
				0xe3bc4595,
				0xa67bc883,
				0xb17f37d1,
				26017576,
				0xc332ddef,
				0xbe6c5aa5,
				0x65582185,
				0x68ab9802,
				0xeecea50f,
				0xdb2f953b,
				720338349,
				0x5b6e2f84,
				354530856,
				688349552,
				0xecdd4775,
				0x619f1510,
				332179504,
				0xeb61bd96,
				53804574,
				0xaa0363cf,
				0xb5735c90,
				0x4c70a239,
				0xd59e9e0b,
				0xcbaade14,
				0xeecc86bc,
				0x60622ca7,
				0x9cab5cab,
				0xb2f3846e,
				0x648b1eaf,
				431878346,
				0xa02369b9,
				0x655abb50,
				0x40685a32,
				0x3c2ab4b3,
				832498133,
				0xc021b8f7,
				0x9b540b19,
				0x875fa099,
				0x95f7997e,
				0x623d7da8,
				0xf837889a,
				0x97e32d77,
				300782431,
				375919233,
				0xe358829,
				0xc7e61fd6,
				0x96dedfa1,
				0x7858ba99,
				0x57f584a5,
				455242339,
				0x9b83c3ff,
				448939670,
				0xcdb30aeb,
				0x532e3054,
				0x8fd948e4,
				0x6dbc3128,
				0x58ebf2ef,
				885456874,
				0xfe28ed61,
				0xee7c3c73,
				0x5d4a14d9,
				0xe864b7e3,
				0x42105d14,
				540939232,
				0x45eee2b6,
				0xa3aaabea,
				0xdb6c4f15,
				0xfacb4fd0,
				0xc742f442,
				0xef6abbb5,
				0x654f3b1d,
				0x41cd2105,
				0xd81e799e,
				0x86854dc7,
				0xe44b476a,
				0x3d816250,
				0xcf62a1f2,
				0x5b8d2646,
				0xfc8883a0,
				0xc1c7b6a3,
				0x7f1524c3,
				0x69cb7492,
				0x47848a0b,
				0x5692b285,
				0x95bbf00,
				0xad19489d,
				342012276,
				595725824,
				0x58428d2a,
				0xc55f5ea,
				497939518,
				591360097,
				863170706,
				0x8d937e41,
				0xd65fecf1,
				0x6c223bdb,
				0x7cde3759,
				0xcbee7460,
				0x4085f2a7,
				0xce77326e,
				0xa6078084,
				435703966,
				0xe8efd855,
				0x61d99735,
				0xa969a7aa,
				0xc50c06c2,
				0x5a04abfc,
				0x800bcadc,
				0x9e447a2e,
				0xc3453484,
				0xfdd56705,
				0xe1e9ec9,
				0xdb73dbd3,
				274041037,
				0x675fda79,
				0xe3674340,
				0xc5c43465,
				0x713e38d8,
				0x3d28f89e,
				0xf16dff20,
				356393447,
				0x8fb03d4a,
				0xe6e39f2b,
				0xdb83adf7
			]),
			new Uint32Array([
				0xe93d5a68,
				0x948140f7,
				0xf64c261c,
				0x94692934,
				0x411520f7,
				0x7602d4f7,
				0xbcf46b2e,
				0xd4a20068,
				0xd4082471,
				857797738,
				0x43b7d4b7,
				0x500061af,
				507115054,
				0x97244546,
				337727348,
				0xbf8b8840,
				0x4d95fc1d,
				0x96b591af,
				0x70f4ddd3,
				0x66a02f45,
				0xbfbc09ec,
				62756741,
				0x7fac6dd0,
				835421444,
				0x96eb27b3,
				0x55fd3941,
				0xda2547e6,
				0xabca0a9a,
				676362277,
				0x530429f4,
				0xa2c86da,
				0xe9b66dfb,
				0x68dc1462,
				0xd7486900,
				0x680ec0a4,
				664899054,
				0x4f3ffea2,
				0xe887ad8c,
				0xb58ce006,
				0x7af4d6b6,
				0xaace1e7c,
				0xd3375fec,
				0xce78a399,
				0x406b2a42,
				553557557,
				0xd9f385b9,
				0xee39d7ab,
				991055499,
				499776247,
				0x4b6d1856,
				648242737,
				0xeae397b2,
				980351604,
				0xdd5b4332,
				0x6841e7f7,
				0xca7820fb,
				0xfb0af54e,
				0xd8feb397,
				0x454056ac,
				0xba489527,
				0x55533a3a,
				545492359,
				0xfe6ba9b7,
				0xd096954b,
				0x55a867bc,
				0xa1159a58,
				0xcca92963,
				0x99e1db33,
				0xa62a4a56,
				0x3f3125f9,
				0x5ef47e1c,
				0x9029317c,
				0xfdf8e802,
				69676912,
				0x80bb155c,
				86519011,
				0x95c11548,
				0xe4c66d22,
				0x48c1133f,
				0xc70f86dc,
				0x7f9c9ee,
				0x41041f0f,
				0x404779a4,
				0x5d886e17,
				845107691,
				0xd59bc0d1,
				0xf2bcc18f,
				0x41113564,
				628848692,
				0x602a9c60,
				0xdff8e8a3,
				526609435,
				0xe12b4c2,
				48312990,
				0xaf664fd1,
				0xcad18115,
				0x6b2395e0,
				859738849,
				992217954,
				0xeebeb922,
				0x85b2a20e,
				0xe6ba0d99,
				0xde720c8c,
				765654824,
				0xd0127845,
				0x95b794fd,
				0x647d0862,
				0xe7ccf5f0,
				0x5449a36f,
				0x877d48fa,
				0xc39dfd27,
				0xf33e8d1e,
				0xa476341,
				0x992eff74,
				980381355,
				0xf4f8fd37,
				0xa812dc60,
				0xa1ebddf8,
				0x991be14c,
				0xdb6e6b0d,
				0xc67b5510,
				0x6d672c37,
				660984891,
				0xdcd0e804,
				0xf1290dc7,
				0xcc00ffa3,
				0xb5390f92,
				0x690fed0b,
				0x667b9ffb,
				0xcedb7d9c,
				0xa091cf0b,
				0xd9155ea3,
				0xbb132f88,
				0x515bad24,
				0x7b9479bf,
				0x763bd6eb,
				926494387,
				0xcc115979,
				0x8026e297,
				0xf42e312d,
				0x6842ada7,
				0xc66a2b3b,
				309677260,
				0x782ef11c,
				0x6a124237,
				0xb79251e7,
				0x6a1bbe6,
				0x4bfb6350,
				443224088,
				298511866,
				0x3d25bdd8,
				0xe2e1c3c9,
				0x44421659,
				0xa121386,
				0xd90cec6e,
				0xd5abea2a,
				0x64af674e,
				0xda86a85f,
				0xbebfe988,
				0x64e4c3fe,
				0x9dbc8057,
				0xf0f7c086,
				0x60787bf8,
				0x6003604d,
				0xd1fd8346,
				0xf6381fb0,
				0x7745ae04,
				0xd736fccc,
				0x83426b33,
				0xf01eab71,
				0xb0804187,
				0x3c005e5f,
				0x77a057be,
				0xbde8ae24,
				0x55464299,
				0xbf582e61,
				0x4e58f48f,
				0xf2ddfda2,
				0xf474ef38,
				0x8789bdc2,
				0x5366f9c3,
				0xc8b38e74,
				0xb475f255,
				0x46fcd9b9,
				0x7aeb2661,
				0x8b1ddf84,
				0x846a0e79,
				0x915f95e2,
				0x466e598e,
				548689776,
				0x8cd55591,
				0xc902de4c,
				0xb90bace1,
				0xbb8205d0,
				296247880,
				0x7574a99e,
				0xb77f19b6,
				0xe0a9dc09,
				0x662d09a1,
				0xc4324633,
				0xe85a1f02,
				0x9f0be8c,
				0x4a99a025,
				493813264,
				448347421,
				0xba5a4df,
				0xa186f20f,
				677966185,
				0xdcb7da83,
				0x573906fe,
				0xa1e2ce9b,
				0x4fcd7f52,
				0x50115e01,
				0xa70683fa,
				0xa002b5c4,
				0xde6d027,
				0x9af88c27,
				0x773f8641,
				0xc3604c06,
				0x61a806b5,
				0xf0177a28,
				0xc0f586e0,
				6314154,
				819756386,
				300326615,
				590932579,
				0x53c2dd94,
				0xc2c21634,
				0xbbcbee56,
				0x90bcb6de,
				0xebfc7da1,
				0xce591d76,
				0x6f05e409,
				0x4b7c0188,
				963775037,
				0x7c927c24,
				0x86e3725f,
				0x724d9db9,
				448879540,
				0xd39eb8fc,
				0xed545578,
				0x8fca5b5,
				0xd83d7cd3,
				0x4dad0fc4,
				508620638,
				0xb161e6f8,
				0xa28514d9,
				0x6c51133c,
				0x6fd5c7e7,
				0x56e14ec4,
				908771278,
				0xddc6c837,
				0xd79a3234,
				0x92638212,
				0x670efa8e,
				0x406000e0
			]),
			new Uint32Array([
				976866871,
				0xd3faf5cf,
				0xabc27737,
				0x5ac52d1b,
				0x5cb0679e,
				0x4fa33742,
				0xd3822740,
				0x99bc9bbe,
				0xd5118e9d,
				0xbf0f7315,
				0xd62d1c7e,
				0xc700c47b,
				0xb78c1b6b,
				564236357,
				0xb26eb1be,
				0x6a366eb4,
				0x5748ab2f,
				0xbc946e79,
				0xc6a376d2,
				0x6549c2c8,
				0x530ff8ee,
				0x468dde7d,
				0xd5730a1d,
				0x4cd04dc6,
				691649499,
				0xa9ba4650,
				0xac9526e8,
				0xbe5ee304,
				0xa1fad5f0,
				0x6a2d519a,
				0x63ef8ce2,
				0x9a86ee22,
				0xc089c2b8,
				0x43242ef6,
				0xa51e03aa,
				0x9cf2d0a4,
				0x83c061ba,
				0x9be96a4d,
				0x8fe51550,
				0xba645bd6,
				673620729,
				0xa73a3ae1,
				0x4ba99586,
				0xef5562e9,
				0xc72fefd3,
				0xf752f7da,
				0x3f046f69,
				0x77fa0a59,
				0x80e4a915,
				0x87b08601,
				0x9b09e6ad,
				993977747,
				0xe990fd5a,
				0x9e34d797,
				753973209,
				36408145,
				0x96d5ac3a,
				25011837,
				0xd1cf3ed6,
				0x7c7d2d28,
				530523599,
				0xadf2b89b,
				0x5ad6b472,
				0x5a88f54c,
				0xe029ac71,
				0xe019a5e6,
				0x47b0acfd,
				0xed93fa9b,
				0xe8d3c48d,
				674977740,
				0xf8d56629,
				0x79132e28,
				0x785f0191,
				0xed756055,
				0xf7960e44,
				0xe3d35e8c,
				352677332,
				0x88f46dba,
				60907813,
				90501309,
				0xc3eb9e15,
				0x3c9057a2,
				0x97271aec,
				0xa93a072a,
				457141659,
				509813237,
				0xf59c66fb,
				652014361,
				0x7533d928,
				0xb155fdf5,
				55981186,
				0x8aba3cbb,
				676427537,
				0xc20ad9f8,
				0xabcc5167,
				0xccad925f,
				0x4de81751,
				942726286,
				933058658,
				0x9320f991,
				0xea7a90c2,
				0xfb3e7bce,
				0x5121ce64,
				0x774fbe32,
				0xa8b6e37e,
				0xc3293d46,
				0x48de5369,
				0x6413e680,
				0xa2ae0810,
				0xdd6db224,
				0x69852dfd,
				0x9072166,
				0xb39a460a,
				0x6445c0dd,
				0x586cdecf,
				471910574,
				0x5bbef7dd,
				458788160,
				0xccd2017f,
				0x6bb4e3bb,
				0xdda26a7e,
				978976581,
				0x3e350a44,
				0xbcb4cdd5,
				0x72eacea8,
				0xfa6484bb,
				0x8d6612ae,
				0xbf3c6f47,
				0xd29be463,
				0x542f5d9e,
				0xaec2771b,
				0xf64e6370,
				0x740e0d8d,
				0xe75b1357,
				0xf8721671,
				0xaf537d5d,
				0x4040cb08,
				0x4eb4e2cc,
				886195818,
				18198404,
				3786409e3,
				0x95983a1d,
				0x6b89fb4,
				0xce6ea048,
				0x6f3f3b82,
				891333506,
				18488651,
				661792760,
				0x611560b1,
				0xe7933fdc,
				0xbb3a792b,
				876946877,
				0xa08839e1,
				0x51ce794b,
				791857591,
				0xa01fbac9,
				0xe01cc87e,
				0xbcc7d1f6,
				0xcf0111c3,
				0xa1e8aac7,
				445679433,
				0xd44fbd9a,
				0xd0dadecb,
				0xd50ada38,
				54117162,
				0xc6913667,
				0x8df9317c,
				0xe0b12b4f,
				0xf79e59b7,
				0x43f5bb3a,
				0xf2d519ff,
				668550556,
				0xbf97222c,
				367459370,
				0xf91fc71,
				0x9b941525,
				0xfae59361,
				0xceb69ceb,
				0xc2a86459,
				314222801,
				0xb6c1075e,
				0xe3056a0c,
				282218597,
				0xcb03a442,
				0xe0ec6e0e,
				379116347,
				0x4c98a0be,
				846784868,
				0x9f1f9532,
				0xe0d392df,
				0xd3a0342b,
				0x8971f21e,
				453669953,
				0x4ba3348c,
				0xc5be7120,
				0xc37632d8,
				0xdf359f8d,
				0x9b992f2e,
				0xe60b6f47,
				0xfe3f11d,
				0xe54cda54,
				517658769,
				0xce6279cf,
				0xcd3e7e6f,
				370717030,
				0xfd2c1d05,
				0x848fd2c5,
				0xf6fb2299,
				0xf523f357,
				0xa6327623,
				0x93a83531,
				0x56cccd02,
				0xacf08162,
				0x5a75ebb5,
				0x6e163697,
				0x88d273cc,
				0xde966292,
				0x81b949d0,
				0x4c50901b,
				0x71c65614,
				0xe6c6c7bd,
				846861322,
				0x45e1d006,
				0xc3f27b9a,
				0xc9aa53fd,
				0x62a80f00,
				0xbb25bfe2,
				901632758,
				0x71126905,
				0xb2040222,
				0xb6cbcf7c,
				0xcd769c2b,
				0x53113ec0,
				373351379,
				950779232,
				625454576,
				0xba38209c,
				0xf746ce76,
				0x77afa1c5,
				544563296,
				0x85cbfe4e,
				0x8ae88dd8,
				0x7aaaf9b0,
				0x4cf9aa7e,
				424198748,
				50039436,
				29584100,
				0xd6ebe1f9,
				0x90d4f869,
				0xa65cdea0,
				0x3f09252d,
				0xc208e69f,
				0xb74e6132,
				0xce77e25b,
				0x578fdfe3,
				985887462
			])
		];
		this.P = new Uint32Array([
			608135816,
			0x85a308d3,
			320440878,
			57701188,
			0xa4093822,
			698298832,
			0x82efa98,
			0xec4e6c89,
			0x452821e6,
			953160567,
			0xbe5466cf,
			887688300,
			0xc0ac29b7,
			0xc97c50dd,
			0x3f84d5b5,
			0xb5470917,
			0x9216d5d9,
			0x8979fb1b
		]);
	};
	function F(S, x8, i) {
		return (S[0][x8[i + 3]] + S[1][x8[i + 2]] ^ S[2][x8[i + 1]]) + S[3][x8[i]];
	}
	Blowfish.prototype.encipher = function(x, x8) {
		if (x8 === void 0) {
			x8 = new Uint8Array(x.buffer);
			if (x.byteOffset !== 0) x8 = x8.subarray(x.byteOffset);
		}
		x[0] ^= this.P[0];
		for (var i = 1; i < 16; i += 2) {
			x[1] ^= F(this.S, x8, 0) ^ this.P[i];
			x[0] ^= F(this.S, x8, 4) ^ this.P[i + 1];
		}
		var t = x[0];
		x[0] = x[1] ^ this.P[17];
		x[1] = t;
	};
	Blowfish.prototype.decipher = function(x) {
		var x8 = new Uint8Array(x.buffer);
		if (x.byteOffset !== 0) x8 = x8.subarray(x.byteOffset);
		x[0] ^= this.P[17];
		for (var i = 16; i > 0; i -= 2) {
			x[1] ^= F(this.S, x8, 0) ^ this.P[i];
			x[0] ^= F(this.S, x8, 4) ^ this.P[i - 1];
		}
		var t = x[0];
		x[0] = x[1] ^ this.P[0];
		x[1] = t;
	};
	function stream2word(data, databytes) {
		var i, temp = 0;
		for (i = 0; i < 4; i++, BLF_J++) {
			if (BLF_J >= databytes) BLF_J = 0;
			temp = temp << 8 | data[BLF_J];
		}
		return temp;
	}
	Blowfish.prototype.expand0state = function(key, keybytes) {
		var d = /* @__PURE__ */ new Uint32Array(2), i, k;
		var d8 = new Uint8Array(d.buffer);
		for (i = 0, BLF_J = 0; i < 18; i++) this.P[i] ^= stream2word(key, keybytes);
		BLF_J = 0;
		for (i = 0; i < 18; i += 2) {
			this.encipher(d, d8);
			this.P[i] = d[0];
			this.P[i + 1] = d[1];
		}
		for (i = 0; i < 4; i++) for (k = 0; k < 256; k += 2) {
			this.encipher(d, d8);
			this.S[i][k] = d[0];
			this.S[i][k + 1] = d[1];
		}
	};
	Blowfish.prototype.expandstate = function(data, databytes, key, keybytes) {
		var d = /* @__PURE__ */ new Uint32Array(2), i = 0, k;
		for (BLF_J = 0; i < 18; i++) this.P[i] ^= stream2word(key, keybytes);
		for (i = 0, BLF_J = 0; i < 18; i += 2) {
			d[0] ^= stream2word(data, databytes);
			d[1] ^= stream2word(data, databytes);
			this.encipher(d);
			this.P[i] = d[0];
			this.P[i + 1] = d[1];
		}
		for (i = 0; i < 4; i++) for (k = 0; k < 256; k += 2) {
			d[0] ^= stream2word(data, databytes);
			d[1] ^= stream2word(data, databytes);
			this.encipher(d);
			this.S[i][k] = d[0];
			this.S[i][k + 1] = d[1];
		}
		BLF_J = 0;
	};
	Blowfish.prototype.enc = function(data, blocks) {
		for (var i = 0; i < blocks; i++) this.encipher(data.subarray(i * 2));
	};
	Blowfish.prototype.dec = function(data, blocks) {
		for (var i = 0; i < blocks; i++) this.decipher(data.subarray(i * 2));
	};
	var BCRYPT_BLOCKS = 8;
	var BCRYPT_HASHSIZE = 32;
	function bcrypt_hash(sha2pass, sha2salt, out) {
		var state = new Blowfish(), cdata = new Uint32Array(BCRYPT_BLOCKS), i, ciphertext = new Uint8Array([
			79,
			120,
			121,
			99,
			104,
			114,
			111,
			109,
			97,
			116,
			105,
			99,
			66,
			108,
			111,
			119,
			102,
			105,
			115,
			104,
			83,
			119,
			97,
			116,
			68,
			121,
			110,
			97,
			109,
			105,
			116,
			101
		]);
		state.expandstate(sha2salt, 64, sha2pass, 64);
		for (i = 0; i < 64; i++) {
			state.expand0state(sha2salt, 64);
			state.expand0state(sha2pass, 64);
		}
		for (i = 0; i < BCRYPT_BLOCKS; i++) cdata[i] = stream2word(ciphertext, ciphertext.byteLength);
		for (i = 0; i < 64; i++) state.enc(cdata, cdata.byteLength / 8);
		for (i = 0; i < BCRYPT_BLOCKS; i++) {
			out[4 * i + 3] = cdata[i] >>> 24;
			out[4 * i + 2] = cdata[i] >>> 16;
			out[4 * i + 1] = cdata[i] >>> 8;
			out[4 * i + 0] = cdata[i];
		}
	}
	function bcrypt_pbkdf(pass, passlen, salt, saltlen, key, keylen, rounds) {
		var sha2pass = /* @__PURE__ */ new Uint8Array(64), sha2salt = /* @__PURE__ */ new Uint8Array(64), out = new Uint8Array(BCRYPT_HASHSIZE), tmpout = new Uint8Array(BCRYPT_HASHSIZE), countsalt = new Uint8Array(saltlen + 4), i, j, amt, stride, dest, count, origkeylen = keylen;
		if (rounds < 1) return -1;
		if (passlen === 0 || saltlen === 0 || keylen === 0 || keylen > out.byteLength * out.byteLength || saltlen > 1 << 20) return -1;
		stride = Math.floor((keylen + out.byteLength - 1) / out.byteLength);
		amt = Math.floor((keylen + stride - 1) / stride);
		for (i = 0; i < saltlen; i++) countsalt[i] = salt[i];
		crypto_hash_sha512(sha2pass, pass, passlen);
		for (count = 1; keylen > 0; count++) {
			countsalt[saltlen + 0] = count >>> 24;
			countsalt[saltlen + 1] = count >>> 16;
			countsalt[saltlen + 2] = count >>> 8;
			countsalt[saltlen + 3] = count;
			crypto_hash_sha512(sha2salt, countsalt, saltlen + 4);
			bcrypt_hash(sha2pass, sha2salt, tmpout);
			for (i = out.byteLength; i--;) out[i] = tmpout[i];
			for (i = 1; i < rounds; i++) {
				crypto_hash_sha512(sha2salt, tmpout, tmpout.byteLength);
				bcrypt_hash(sha2pass, sha2salt, tmpout);
				for (j = 0; j < out.byteLength; j++) out[j] ^= tmpout[j];
			}
			amt = Math.min(amt, keylen);
			for (i = 0; i < amt; i++) {
				dest = i * stride + (count - 1);
				if (dest >= origkeylen) break;
				key[dest] = out[i];
			}
			keylen -= i;
		}
		return 0;
	}
	module.exports = {
		BLOCKS: BCRYPT_BLOCKS,
		HASHSIZE: BCRYPT_HASHSIZE,
		hash: bcrypt_hash,
		pbkdf: bcrypt_pbkdf
	};
}));
// node_modules/cpu-features/lib/index.js
var require_lib$1 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = __require("../node_modules/cpu-features/build/Release/cpufeatures.node").getCPUInfo;
}));
// node_modules/ssh2/lib/protocol/constants.js
var require_constants = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const crypto = __require("crypto");
	let cpuInfo;
	try {
		cpuInfo = require_lib$1()();
	} catch {}
	const { bindingAvailable, CIPHER_INFO, MAC_INFO } = require_crypto();
	const eddsaSupported = (() => {
		if (typeof crypto.sign === "function" && typeof crypto.verify === "function") {
			const key = "-----BEGIN PRIVATE KEY-----\r\nMC4CAQAwBQYDK2VwBCIEIHKj+sVa9WcD/q2DJUJaf43Kptc8xYuUQA4bOFj9vC8T\r\n-----END PRIVATE KEY-----";
			const data = Buffer.from("a");
			let sig;
			let verified;
			try {
				sig = crypto.sign(null, data, key);
				verified = crypto.verify(null, data, key, sig);
			} catch {}
			return Buffer.isBuffer(sig) && sig.length === 64 && verified === true;
		}
		return false;
	})();
	const curve25519Supported = typeof crypto.diffieHellman === "function" && typeof crypto.generateKeyPairSync === "function" && typeof crypto.createPublicKey === "function";
	const DEFAULT_KEX = [
		"ecdh-sha2-nistp256",
		"ecdh-sha2-nistp384",
		"ecdh-sha2-nistp521",
		"diffie-hellman-group-exchange-sha256",
		"diffie-hellman-group14-sha256",
		"diffie-hellman-group15-sha512",
		"diffie-hellman-group16-sha512",
		"diffie-hellman-group17-sha512",
		"diffie-hellman-group18-sha512"
	];
	if (curve25519Supported) {
		DEFAULT_KEX.unshift("curve25519-sha256");
		DEFAULT_KEX.unshift("curve25519-sha256@libssh.org");
	}
	const SUPPORTED_KEX = DEFAULT_KEX.concat([
		"diffie-hellman-group-exchange-sha1",
		"diffie-hellman-group14-sha1",
		"diffie-hellman-group1-sha1"
	]);
	const DEFAULT_SERVER_HOST_KEY = [
		"ecdsa-sha2-nistp256",
		"ecdsa-sha2-nistp384",
		"ecdsa-sha2-nistp521",
		"rsa-sha2-512",
		"rsa-sha2-256",
		"ssh-rsa"
	];
	if (eddsaSupported) DEFAULT_SERVER_HOST_KEY.unshift("ssh-ed25519");
	const SUPPORTED_SERVER_HOST_KEY = DEFAULT_SERVER_HOST_KEY.concat(["ssh-dss"]);
	const canUseCipher = (() => {
		const ciphers = crypto.getCiphers();
		return (name) => ciphers.includes(CIPHER_INFO[name].sslName);
	})();
	let DEFAULT_CIPHER = [
		"aes128-gcm@openssh.com",
		"aes256-gcm@openssh.com",
		"aes128-ctr",
		"aes192-ctr",
		"aes256-ctr"
	];
	if (cpuInfo && cpuInfo.flags && !cpuInfo.flags.aes) {
		if (bindingAvailable) DEFAULT_CIPHER.unshift("chacha20-poly1305@openssh.com");
		else DEFAULT_CIPHER.push("chacha20-poly1305@openssh.com");
	} else if (bindingAvailable && cpuInfo && cpuInfo.arch === "x86") DEFAULT_CIPHER.splice(4, 0, "chacha20-poly1305@openssh.com");
	else DEFAULT_CIPHER.push("chacha20-poly1305@openssh.com");
	DEFAULT_CIPHER = DEFAULT_CIPHER.filter(canUseCipher);
	const SUPPORTED_CIPHER = DEFAULT_CIPHER.concat([
		"aes256-cbc",
		"aes192-cbc",
		"aes128-cbc",
		"blowfish-cbc",
		"3des-cbc",
		"aes128-gcm",
		"aes256-gcm",
		"arcfour256",
		"arcfour128",
		"cast128-cbc",
		"arcfour"
	].filter(canUseCipher));
	const canUseMAC = (() => {
		const hashes = crypto.getHashes();
		return (name) => hashes.includes(MAC_INFO[name].sslName);
	})();
	const DEFAULT_MAC = [
		"hmac-sha2-256-etm@openssh.com",
		"hmac-sha2-512-etm@openssh.com",
		"hmac-sha1-etm@openssh.com",
		"hmac-sha2-256",
		"hmac-sha2-512",
		"hmac-sha1"
	].filter(canUseMAC);
	const SUPPORTED_MAC = DEFAULT_MAC.concat([
		"hmac-md5",
		"hmac-sha2-256-96",
		"hmac-sha2-512-96",
		"hmac-ripemd160",
		"hmac-sha1-96",
		"hmac-md5-96"
	].filter(canUseMAC));
	const DEFAULT_COMPRESSION = [
		"none",
		"zlib@openssh.com",
		"zlib"
	];
	const SUPPORTED_COMPRESSION = DEFAULT_COMPRESSION.concat([]);
	const COMPAT = {
		BAD_DHGEX: 1,
		OLD_EXIT: 2,
		DYN_RPORT_BUG: 4,
		BUG_DHGEX_LARGE: 8,
		IMPLY_RSA_SHA2_SIGALGS: 16
	};
	module.exports = {
		MESSAGE: {
			DISCONNECT: 1,
			IGNORE: 2,
			UNIMPLEMENTED: 3,
			DEBUG: 4,
			SERVICE_REQUEST: 5,
			SERVICE_ACCEPT: 6,
			EXT_INFO: 7,
			KEXINIT: 20,
			NEWKEYS: 21,
			KEXDH_INIT: 30,
			KEXDH_REPLY: 31,
			KEXDH_GEX_GROUP: 31,
			KEXDH_GEX_INIT: 32,
			KEXDH_GEX_REPLY: 33,
			KEXDH_GEX_REQUEST: 34,
			KEXECDH_INIT: 30,
			KEXECDH_REPLY: 31,
			USERAUTH_REQUEST: 50,
			USERAUTH_FAILURE: 51,
			USERAUTH_SUCCESS: 52,
			USERAUTH_BANNER: 53,
			USERAUTH_PASSWD_CHANGEREQ: 60,
			USERAUTH_PK_OK: 60,
			USERAUTH_INFO_REQUEST: 60,
			USERAUTH_INFO_RESPONSE: 61,
			GLOBAL_REQUEST: 80,
			REQUEST_SUCCESS: 81,
			REQUEST_FAILURE: 82,
			CHANNEL_OPEN: 90,
			CHANNEL_OPEN_CONFIRMATION: 91,
			CHANNEL_OPEN_FAILURE: 92,
			CHANNEL_WINDOW_ADJUST: 93,
			CHANNEL_DATA: 94,
			CHANNEL_EXTENDED_DATA: 95,
			CHANNEL_EOF: 96,
			CHANNEL_CLOSE: 97,
			CHANNEL_REQUEST: 98,
			CHANNEL_SUCCESS: 99,
			CHANNEL_FAILURE: 100
		},
		DISCONNECT_REASON: {
			HOST_NOT_ALLOWED_TO_CONNECT: 1,
			PROTOCOL_ERROR: 2,
			KEY_EXCHANGE_FAILED: 3,
			RESERVED: 4,
			MAC_ERROR: 5,
			COMPRESSION_ERROR: 6,
			SERVICE_NOT_AVAILABLE: 7,
			PROTOCOL_VERSION_NOT_SUPPORTED: 8,
			HOST_KEY_NOT_VERIFIABLE: 9,
			CONNECTION_LOST: 10,
			BY_APPLICATION: 11,
			TOO_MANY_CONNECTIONS: 12,
			AUTH_CANCELED_BY_USER: 13,
			NO_MORE_AUTH_METHODS_AVAILABLE: 14,
			ILLEGAL_USER_NAME: 15
		},
		DISCONNECT_REASON_STR: void 0,
		CHANNEL_OPEN_FAILURE: {
			ADMINISTRATIVELY_PROHIBITED: 1,
			CONNECT_FAILED: 2,
			UNKNOWN_CHANNEL_TYPE: 3,
			RESOURCE_SHORTAGE: 4
		},
		TERMINAL_MODE: {
			TTY_OP_END: 0,
			VINTR: 1,
			VQUIT: 2,
			VERASE: 3,
			VKILL: 4,
			VEOF: 5,
			VEOL: 6,
			VEOL2: 7,
			VSTART: 8,
			VSTOP: 9,
			VSUSP: 10,
			VDSUSP: 11,
			VREPRINT: 12,
			VWERASE: 13,
			VLNEXT: 14,
			VFLUSH: 15,
			VSWTCH: 16,
			VSTATUS: 17,
			VDISCARD: 18,
			IGNPAR: 30,
			PARMRK: 31,
			INPCK: 32,
			ISTRIP: 33,
			INLCR: 34,
			IGNCR: 35,
			ICRNL: 36,
			IUCLC: 37,
			IXON: 38,
			IXANY: 39,
			IXOFF: 40,
			IMAXBEL: 41,
			ISIG: 50,
			ICANON: 51,
			XCASE: 52,
			ECHO: 53,
			ECHOE: 54,
			ECHOK: 55,
			ECHONL: 56,
			NOFLSH: 57,
			TOSTOP: 58,
			IEXTEN: 59,
			ECHOCTL: 60,
			ECHOKE: 61,
			PENDIN: 62,
			OPOST: 70,
			OLCUC: 71,
			ONLCR: 72,
			OCRNL: 73,
			ONOCR: 74,
			ONLRET: 75,
			CS7: 90,
			CS8: 91,
			PARENB: 92,
			PARODD: 93,
			TTY_OP_ISPEED: 128,
			TTY_OP_OSPEED: 129
		},
		CHANNEL_EXTENDED_DATATYPE: { STDERR: 1 },
		SIGNALS: [
			"ABRT",
			"ALRM",
			"FPE",
			"HUP",
			"ILL",
			"INT",
			"QUIT",
			"SEGV",
			"TERM",
			"USR1",
			"USR2",
			"KILL",
			"PIPE"
		].reduce((cur, val) => ({
			...cur,
			[val]: 1
		}), {}),
		COMPAT,
		COMPAT_CHECKS: [
			["Cisco-1.25", COMPAT.BAD_DHGEX],
			[/^Cisco-1[.]/, COMPAT.BUG_DHGEX_LARGE],
			[/^[0-9.]+$/, COMPAT.OLD_EXIT],
			[/^OpenSSH_5[.][0-9]+/, COMPAT.DYN_RPORT_BUG],
			[/^OpenSSH_7[.]4/, COMPAT.IMPLY_RSA_SHA2_SIGALGS]
		],
		DEFAULT_KEX,
		SUPPORTED_KEX,
		DEFAULT_SERVER_HOST_KEY,
		SUPPORTED_SERVER_HOST_KEY,
		DEFAULT_CIPHER,
		SUPPORTED_CIPHER,
		DEFAULT_MAC,
		SUPPORTED_MAC,
		DEFAULT_COMPRESSION,
		SUPPORTED_COMPRESSION,
		curve25519Supported,
		eddsaSupported
	};
	module.exports.DISCONNECT_REASON_BY_VALUE = Array.from(Object.entries(module.exports.DISCONNECT_REASON)).reduce((obj, [key, value]) => ({
		...obj,
		[value]: key
	}), {});
}));
// node_modules/ssh2/lib/protocol/utils.js
var require_utils$1 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const Ber = require_lib$2().Ber;
	let DISCONNECT_REASON;
	const FastBuffer = Buffer[Symbol.species];
	const TypedArrayFill = Object.getPrototypeOf(Uint8Array.prototype).fill;
	function readUInt32BE(buf, offset) {
		return buf[offset++] * 16777216 + buf[offset++] * 65536 + buf[offset++] * 256 + buf[offset];
	}
	function bufferCopy(src, dest, srcStart, srcEnd, destStart) {
		if (!destStart) destStart = 0;
		if (srcEnd > src.length) srcEnd = src.length;
		let nb = srcEnd - srcStart;
		const destLeft = dest.length - destStart;
		if (nb > destLeft) nb = destLeft;
		dest.set(new Uint8Array(src.buffer, src.byteOffset + srcStart, nb), destStart);
		return nb;
	}
	function bufferSlice(buf, start, end) {
		if (end === void 0) end = buf.length;
		return new FastBuffer(buf.buffer, buf.byteOffset + start, end - start);
	}
	function makeBufferParser() {
		let pos = 0;
		let buffer;
		const self = {
			init: (buf, start) => {
				buffer = buf;
				pos = typeof start === "number" ? start : 0;
			},
			pos: () => pos,
			length: () => buffer ? buffer.length : 0,
			avail: () => buffer && pos < buffer.length ? buffer.length - pos : 0,
			clear: () => {
				buffer = void 0;
			},
			readUInt32BE: () => {
				if (!buffer || pos + 3 >= buffer.length) return;
				return buffer[pos++] * 16777216 + buffer[pos++] * 65536 + buffer[pos++] * 256 + buffer[pos++];
			},
			readUInt64BE: (behavior) => {
				if (!buffer || pos + 7 >= buffer.length) return;
				switch (behavior) {
					case "always": return BigInt(`0x${buffer.hexSlice(pos, pos += 8)}`);
					case "maybe": if (buffer[pos] > 31) return BigInt(`0x${buffer.hexSlice(pos, pos += 8)}`);
					default: return buffer[pos++] * 0x100000000000000 + buffer[pos++] * 0x1000000000000 + buffer[pos++] * 0x10000000000 + buffer[pos++] * 4294967296 + buffer[pos++] * 16777216 + buffer[pos++] * 65536 + buffer[pos++] * 256 + buffer[pos++];
				}
			},
			skip: (n) => {
				if (buffer && n > 0) pos += n;
			},
			skipString: () => {
				const len = self.readUInt32BE();
				if (len === void 0) return;
				pos += len;
				return pos <= buffer.length ? len : void 0;
			},
			readByte: () => {
				if (buffer && pos < buffer.length) return buffer[pos++];
			},
			readBool: () => {
				if (buffer && pos < buffer.length) return !!buffer[pos++];
			},
			readList: () => {
				const list = self.readString(true);
				if (list === void 0) return;
				return list ? list.split(",") : [];
			},
			readString: (dest, maxLen) => {
				if (typeof dest === "number") {
					maxLen = dest;
					dest = void 0;
				}
				const len = self.readUInt32BE();
				if (len === void 0) return;
				if (buffer.length - pos < len || typeof maxLen === "number" && len > maxLen) return;
				if (dest) {
					if (Buffer.isBuffer(dest)) return bufferCopy(buffer, dest, pos, pos += len);
					return buffer.utf8Slice(pos, pos += len);
				}
				return bufferSlice(buffer, pos, pos += len);
			},
			readRaw: (len) => {
				if (!buffer) return;
				if (typeof len !== "number") return bufferSlice(buffer, pos, pos += buffer.length - pos);
				if (buffer.length - pos >= len) return bufferSlice(buffer, pos, pos += len);
			}
		};
		return self;
	}
	function makeError(msg, level, fatal) {
		const err = new Error(msg);
		if (typeof level === "boolean") {
			fatal = level;
			err.level = "protocol";
		} else err.level = level || "protocol";
		err.fatal = !!fatal;
		return err;
	}
	function writeUInt32BE(buf, value, offset) {
		buf[offset++] = value >>> 24;
		buf[offset++] = value >>> 16;
		buf[offset++] = value >>> 8;
		buf[offset++] = value;
		return offset;
	}
	const utilBufferParser = makeBufferParser();
	module.exports = {
		bufferCopy,
		bufferSlice,
		FastBuffer,
		bufferFill: (buf, value, start, end) => {
			return TypedArrayFill.call(buf, value, start, end);
		},
		makeError,
		doFatalError: (protocol, msg, level, reason) => {
			let err;
			if (DISCONNECT_REASON === void 0) ({DISCONNECT_REASON} = require_constants());
			if (msg instanceof Error) {
				err = msg;
				if (typeof level !== "number") reason = DISCONNECT_REASON.PROTOCOL_ERROR;
				else reason = level;
			} else err = makeError(msg, level, true);
			if (typeof reason !== "number") reason = DISCONNECT_REASON.PROTOCOL_ERROR;
			protocol.disconnect(reason);
			protocol._destruct();
			protocol._onError(err);
			return 1e400;
		},
		readUInt32BE,
		writeUInt32BE,
		writeUInt32LE: (buf, value, offset) => {
			buf[offset++] = value;
			buf[offset++] = value >>> 8;
			buf[offset++] = value >>> 16;
			buf[offset++] = value >>> 24;
			return offset;
		},
		makeBufferParser,
		bufferParser: makeBufferParser(),
		readString: (buffer, start, dest, maxLen) => {
			if (typeof dest === "number") {
				maxLen = dest;
				dest = void 0;
			}
			if (start === void 0) start = 0;
			const left = buffer.length - start;
			if (start < 0 || start >= buffer.length || left < 4) return;
			const len = readUInt32BE(buffer, start);
			if (left < 4 + len || typeof maxLen === "number" && len > maxLen) return;
			start += 4;
			const end = start + len;
			buffer._pos = end;
			if (dest) {
				if (Buffer.isBuffer(dest)) return bufferCopy(buffer, dest, start, end);
				return buffer.utf8Slice(start, end);
			}
			return bufferSlice(buffer, start, end);
		},
		sigSSHToASN1: (sig, type) => {
			switch (type) {
				case "ssh-dss": {
					if (sig.length > 40) return sig;
					const asnWriter = new Ber.Writer();
					asnWriter.startSequence();
					let r = sig.slice(0, 20);
					let s = sig.slice(20);
					if (r[0] & 128) {
						const rNew = Buffer.allocUnsafe(21);
						rNew[0] = 0;
						r.copy(rNew, 1);
						r = rNew;
					} else if (r[0] === 0 && !(r[1] & 128)) r = r.slice(1);
					if (s[0] & 128) {
						const sNew = Buffer.allocUnsafe(21);
						sNew[0] = 0;
						s.copy(sNew, 1);
						s = sNew;
					} else if (s[0] === 0 && !(s[1] & 128)) s = s.slice(1);
					asnWriter.writeBuffer(r, Ber.Integer);
					asnWriter.writeBuffer(s, Ber.Integer);
					asnWriter.endSequence();
					return asnWriter.buffer;
				}
				case "ecdsa-sha2-nistp256":
				case "ecdsa-sha2-nistp384":
				case "ecdsa-sha2-nistp521": {
					utilBufferParser.init(sig, 0);
					const r = utilBufferParser.readString();
					const s = utilBufferParser.readString();
					utilBufferParser.clear();
					if (r === void 0 || s === void 0) return;
					const asnWriter = new Ber.Writer();
					asnWriter.startSequence();
					asnWriter.writeBuffer(r, Ber.Integer);
					asnWriter.writeBuffer(s, Ber.Integer);
					asnWriter.endSequence();
					return asnWriter.buffer;
				}
				default: return sig;
			}
		},
		convertSignature: (signature, keyType) => {
			switch (keyType) {
				case "ssh-dss": {
					if (signature.length <= 40) return signature;
					const asnReader = new Ber.Reader(signature);
					asnReader.readSequence();
					let r = asnReader.readString(Ber.Integer, true);
					let s = asnReader.readString(Ber.Integer, true);
					let rOffset = 0;
					let sOffset = 0;
					if (r.length < 20) {
						const rNew = Buffer.allocUnsafe(20);
						rNew.set(r, 1);
						r = rNew;
						r[0] = 0;
					}
					if (s.length < 20) {
						const sNew = Buffer.allocUnsafe(20);
						sNew.set(s, 1);
						s = sNew;
						s[0] = 0;
					}
					if (r.length > 20 && r[0] === 0) rOffset = 1;
					if (s.length > 20 && s[0] === 0) sOffset = 1;
					const newSig = Buffer.allocUnsafe(r.length - rOffset + (s.length - sOffset));
					bufferCopy(r, newSig, rOffset, r.length, 0);
					bufferCopy(s, newSig, sOffset, s.length, r.length - rOffset);
					return newSig;
				}
				case "ecdsa-sha2-nistp256":
				case "ecdsa-sha2-nistp384":
				case "ecdsa-sha2-nistp521": {
					if (signature[0] === 0) return signature;
					const asnReader = new Ber.Reader(signature);
					asnReader.readSequence();
					const r = asnReader.readString(Ber.Integer, true);
					const s = asnReader.readString(Ber.Integer, true);
					if (r === null || s === null) return;
					const newSig = Buffer.allocUnsafe(4 + r.length + 4 + s.length);
					writeUInt32BE(newSig, r.length, 0);
					newSig.set(r, 4);
					writeUInt32BE(newSig, s.length, 4 + r.length);
					newSig.set(s, 8 + r.length);
					return newSig;
				}
			}
			return signature;
		},
		sendPacket: (proto, packet, bypass) => {
			if (!bypass && proto._kexinit !== void 0) {
				if (proto._queue === void 0) proto._queue = [];
				proto._queue.push(packet);
				proto._debug && proto._debug("Outbound: ... packet queued");
				return false;
			}
			proto._cipher.encrypt(packet);
			return true;
		}
	};
}));
// node_modules/ssh2/lib/protocol/crypto/poly1305.js
var require_poly1305 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var define;
	var __dirname = import.meta.dirname;
	var __filename = import.meta.filename;
	var createPoly1305 = (function() {
		var _scriptDir = typeof document !== "undefined" && document.currentScript ? document.currentScript.src : void 0;
		if (typeof __filename !== "undefined") _scriptDir = _scriptDir || __filename;
		return (function(createPoly1305) {
			createPoly1305 = createPoly1305 || {};
			var b;
			b || (b = typeof createPoly1305 !== "undefined" ? createPoly1305 : {});
			var q, r;
			b.ready = new Promise(function(a, c) {
				q = a;
				r = c;
			});
			var u = {}, w;
			for (w in b) b.hasOwnProperty(w) && (u[w] = b[w]);
			var x = "object" === typeof window, y = "function" === typeof importScripts, z = "object" === typeof process && "object" === typeof process.versions && "string" === typeof process.versions.node, B = "", C, D, E, F, G;
			if (z) B = y ? __require("path").dirname(B) + "/" : __dirname + "/", C = function(a, c) {
				var d = H(a);
				if (d) return c ? d : d.toString();
				F || (F = __require("fs"));
				G || (G = __require("path"));
				a = G.normalize(a);
				return F.readFileSync(a, c ? null : "utf8");
			}, E = function(a) {
				a = C(a, !0);
				a.buffer || (a = new Uint8Array(a));
				assert(a.buffer);
				return a;
			}, D = function(a, c, d) {
				var e = H(a);
				e && c(e);
				F || (F = __require("fs"));
				G || (G = __require("path"));
				a = G.normalize(a);
				F.readFile(a, function(f, l) {
					f ? d(f) : c(l.buffer);
				});
			}, 1 < process.argv.length && process.argv[1].replace(/\\/g, "/"), process.argv.slice(2), b.inspect = function() {
				return "[Emscripten Module object]";
			};
			else if (x || y) y ? B = self.location.href : "undefined" !== typeof document && document.currentScript && (B = document.currentScript.src), _scriptDir && (B = _scriptDir), 0 !== B.indexOf("blob:") ? B = B.substr(0, B.lastIndexOf("/") + 1) : B = "", C = function(a) {
				try {
					var c = new XMLHttpRequest();
					c.open("GET", a, !1);
					c.send(null);
					return c.responseText;
				} catch (f) {
					if (a = H(a)) {
						c = [];
						for (var d = 0; d < a.length; d++) {
							var e = a[d];
							255 < e && (ba && assert(!1, "Character code " + e + " (" + String.fromCharCode(e) + ")  at offset " + d + " not in 0x00-0xFF."), e &= 255);
							c.push(String.fromCharCode(e));
						}
						return c.join("");
					}
					throw f;
				}
			}, y && (E = function(a) {
				try {
					var c = new XMLHttpRequest();
					c.open("GET", a, !1);
					c.responseType = "arraybuffer";
					c.send(null);
					return new Uint8Array(c.response);
				} catch (d) {
					if (a = H(a)) return a;
					throw d;
				}
			}), D = function(a, c, d) {
				var e = new XMLHttpRequest();
				e.open("GET", a, !0);
				e.responseType = "arraybuffer";
				e.onload = function() {
					if (200 == e.status || 0 == e.status && e.response) c(e.response);
					else {
						var f = H(a);
						f ? c(f.buffer) : d();
					}
				};
				e.onerror = d;
				e.send(null);
			};
			b.print || console.log.bind(console);
			var I = b.printErr || console.warn.bind(console);
			for (w in u) u.hasOwnProperty(w) && (b[w] = u[w]);
			u = null;
			var J;
			b.wasmBinary && (J = b.wasmBinary);
			b.noExitRuntime;
			"object" !== typeof WebAssembly && K("no native wasm support detected");
			var L, M = !1;
			function assert(a, c) {
				a || K("Assertion failed: " + c);
			}
			function N(a) {
				var c = b["_" + a];
				assert(c, "Cannot call unknown function " + a + ", make sure it is exported");
				return c;
			}
			function ca(a, c, d, e) {
				var f = {
					string: function(g) {
						var p = 0;
						if (null !== g && void 0 !== g && 0 !== g) {
							var n = (g.length << 2) + 1;
							p = O(n);
							var k = p, h = P;
							if (0 < n) {
								n = k + n - 1;
								for (var v = 0; v < g.length; ++v) {
									var m = g.charCodeAt(v);
									if (55296 <= m && 57343 >= m) {
										var oa = g.charCodeAt(++v);
										m = 65536 + ((m & 1023) << 10) | oa & 1023;
									}
									if (127 >= m) {
										if (k >= n) break;
										h[k++] = m;
									} else {
										if (2047 >= m) {
											if (k + 1 >= n) break;
											h[k++] = 192 | m >> 6;
										} else {
											if (65535 >= m) {
												if (k + 2 >= n) break;
												h[k++] = 224 | m >> 12;
											} else {
												if (k + 3 >= n) break;
												h[k++] = 240 | m >> 18;
												h[k++] = 128 | m >> 12 & 63;
											}
											h[k++] = 128 | m >> 6 & 63;
										}
										h[k++] = 128 | m & 63;
									}
								}
								h[k] = 0;
							}
						}
						return p;
					},
					array: function(g) {
						var p = O(g.length);
						Q.set(g, p);
						return p;
					}
				}, l = N(a), A = [];
				a = 0;
				if (e) for (var t = 0; t < e.length; t++) {
					var aa = f[d[t]];
					aa ? (0 === a && (a = da()), A[t] = aa(e[t])) : A[t] = e[t];
				}
				d = l.apply(null, A);
				d = function(g) {
					if ("string" === c) if (g) {
						for (var p = P, n = g + NaN, k = g; p[k] && !(k >= n);) ++k;
						if (16 < k - g && p.subarray && ea) g = ea.decode(p.subarray(g, k));
						else {
							for (n = ""; g < k;) {
								var h = p[g++];
								if (h & 128) {
									var v = p[g++] & 63;
									if (192 == (h & 224)) n += String.fromCharCode((h & 31) << 6 | v);
									else {
										var m = p[g++] & 63;
										h = 224 == (h & 240) ? (h & 15) << 12 | v << 6 | m : (h & 7) << 18 | v << 12 | m << 6 | p[g++] & 63;
										65536 > h ? n += String.fromCharCode(h) : (h -= 65536, n += String.fromCharCode(55296 | h >> 10, 56320 | h & 1023));
									}
								} else n += String.fromCharCode(h);
							}
							g = n;
						}
					} else g = "";
					else g = "boolean" === c ? !!g : g;
					return g;
				}(d);
				0 !== a && fa(a);
				return d;
			}
			var ea = "undefined" !== typeof TextDecoder ? new TextDecoder("utf8") : void 0, ha, Q, P;
			function ia() {
				var a = L.buffer;
				ha = a;
				b.HEAP8 = Q = new Int8Array(a);
				b.HEAP16 = new Int16Array(a);
				b.HEAP32 = new Int32Array(a);
				b.HEAPU8 = P = new Uint8Array(a);
				b.HEAPU16 = new Uint16Array(a);
				b.HEAPU32 = new Uint32Array(a);
				b.HEAPF32 = new Float32Array(a);
				b.HEAPF64 = new Float64Array(a);
			}
			var R, ja = [], ka = [], la = [];
			function ma() {
				var a = b.preRun.shift();
				ja.unshift(a);
			}
			var S = 0, T = null, U = null;
			b.preloadedImages = {};
			b.preloadedAudios = {};
			function K(a) {
				if (b.onAbort) b.onAbort(a);
				I(a);
				M = !0;
				a = new WebAssembly.RuntimeError("abort(" + a + "). Build with -s ASSERTIONS=1 for more info.");
				r(a);
				throw a;
			}
			var V = "data:application/octet-stream;base64,", W = "data:application/octet-stream;base64,AGFzbQEAAAABIAZgAX8Bf2ADf39/AGABfwBgAABgAAF/YAZ/f39/f38AAgcBAWEBYQAAAwsKAAEDAQAAAgQFAgQFAXABAQEFBwEBgAKAgAIGCQF/AUGAjMACCwclCQFiAgABYwADAWQACQFlAAgBZgAHAWcABgFoAAUBaQAKAWoBAAqGTQpPAQJ/QYAIKAIAIgEgAEEDakF8cSICaiEAAkAgAkEAIAAgAU0bDQAgAD8AQRB0SwRAIAAQAEUNAQtBgAggADYCACABDwtBhAhBMDYCAEF/C4wFAg5+Cn8gACgCJCEUIAAoAiAhFSAAKAIcIREgACgCGCESIAAoAhQhEyACQRBPBEAgAC0ATEVBGHQhFyAAKAIEIhZBBWytIQ8gACgCCCIYQQVsrSENIAAoAgwiGUEFbK0hCyAAKAIQIhpBBWytIQkgADUCACEIIBqtIRAgGa0hDiAYrSEMIBatIQoDQCASIAEtAAMiEiABLQAEQQh0ciABLQAFQRB0ciABLQAGIhZBGHRyQQJ2Qf///x9xaq0iAyAOfiABLwAAIAEtAAJBEHRyIBNqIBJBGHRBgICAGHFqrSIEIBB+fCARIAEtAAdBCHQgFnIgAS0ACEEQdHIgAS0ACSIRQRh0ckEEdkH///8fcWqtIgUgDH58IAEtAApBCHQgEXIgAS0AC0EQdHIgAS0ADEEYdHJBBnYgFWqtIgYgCn58IBQgF2ogAS8ADSABLQAPQRB0cmqtIgcgCH58IAMgDH4gBCAOfnwgBSAKfnwgBiAIfnwgByAJfnwgAyAKfiAEIAx+fCAFIAh+fCAGIAl+fCAHIAt+fCADIAh+IAQgCn58IAUgCX58IAYgC358IAcgDX58IAMgCX4gBCAIfnwgBSALfnwgBiANfnwgByAPfnwiA0IaiEL/////D4N8IgRCGohC/////w+DfCIFQhqIQv////8Pg3wiBkIaiEL/////D4N8IgdCGoinQQVsIAOnQf///x9xaiITQRp2IASnQf///x9xaiESIAWnQf///x9xIREgBqdB////H3EhFSAHp0H///8fcSEUIBNB////H3EhEyABQRBqIQEgAkEQayICQQ9LDQALCyAAIBQ2AiQgACAVNgIgIAAgETYCHCAAIBI2AhggACATNgIUCwMAAQu2BAEGfwJAIAAoAjgiBARAIABBPGohBQJAIAJBECAEayIDIAIgA0kbIgZFDQAgBkEDcSEHAkAgBkEBa0EDSQRAQQAhAwwBCyAGQXxxIQhBACEDA0AgBSADIARqaiABIANqLQAAOgAAIAUgA0EBciIEIAAoAjhqaiABIARqLQAAOgAAIAUgA0ECciIEIAAoAjhqaiABIARqLQAAOgAAIAUgA0EDciIEIAAoAjhqaiABIARqLQAAOgAAIANBBGohAyAAKAI4IQQgCEEEayIIDQALCyAHRQ0AA0AgBSADIARqaiABIANqLQAAOgAAIANBAWohAyAAKAI4IQQgB0EBayIHDQALCyAAIAQgBmoiAzYCOCADQRBJDQEgACAFQRAQAiAAQQA2AjggAiAGayECIAEgBmohAQsgAkEQTwRAIAAgASACQXBxIgMQAiACQQ9xIQIgASADaiEBCyACRQ0AIAJBA3EhBCAAQTxqIQVBACEDIAJBAWtBA08EQCACQXxxIQcDQCAFIAAoAjggA2pqIAEgA2otAAA6AAAgBSADQQFyIgYgACgCOGpqIAEgBmotAAA6AAAgBSADQQJyIgYgACgCOGpqIAEgBmotAAA6AAAgBSADQQNyIgYgACgCOGpqIAEgBmotAAA6AAAgA0EEaiEDIAdBBGsiBw0ACwsgBARAA0AgBSAAKAI4IANqaiABIANqLQAAOgAAIANBAWohAyAEQQFrIgQNAAsLIAAgACgCOCACajYCOAsLoS0BDH8jAEEQayIMJAACQAJAAkACQAJAAkACQAJAAkACQAJAAkAgAEH0AU0EQEGICCgCACIFQRAgAEELakF4cSAAQQtJGyIIQQN2IgJ2IgFBA3EEQCABQX9zQQFxIAJqIgNBA3QiAUG4CGooAgAiBEEIaiEAAkAgBCgCCCICIAFBsAhqIgFGBEBBiAggBUF+IAN3cTYCAAwBCyACIAE2AgwgASACNgIICyAEIANBA3QiAUEDcjYCBCABIARqIgEgASgCBEEBcjYCBAwNCyAIQZAIKAIAIgpNDQEgAQRAAkBBAiACdCIAQQAgAGtyIAEgAnRxIgBBACAAa3FBAWsiACAAQQx2QRBxIgJ2IgFBBXZBCHEiACACciABIAB2IgFBAnZBBHEiAHIgASAAdiIBQQF2QQJxIgByIAEgAHYiAUEBdkEBcSIAciABIAB2aiIDQQN0IgBBuAhqKAIAIgQoAggiASAAQbAIaiIARgRAQYgIIAVBfiADd3EiBTYCAAwBCyABIAA2AgwgACABNgIICyAEQQhqIQAgBCAIQQNyNgIEIAQgCGoiAiADQQN0IgEgCGsiA0EBcjYCBCABIARqIAM2AgAgCgRAIApBA3YiAUEDdEGwCGohB0GcCCgCACEEAn8gBUEBIAF0IgFxRQRAQYgIIAEgBXI2AgAgBwwBCyAHKAIICyEBIAcgBDYCCCABIAQ2AgwgBCAHNgIMIAQgATYCCAtBnAggAjYCAEGQCCADNgIADA0LQYwIKAIAIgZFDQEgBkEAIAZrcUEBayIAIABBDHZBEHEiAnYiAUEFdkEIcSIAIAJyIAEgAHYiAUECdkEEcSIAciABIAB2IgFBAXZBAnEiAHIgASAAdiIBQQF2QQFxIgByIAEgAHZqQQJ0QbgKaigCACIBKAIEQXhxIAhrIQMgASECA0ACQCACKAIQIgBFBEAgAigCFCIARQ0BCyAAKAIEQXhxIAhrIgIgAyACIANJIgIbIQMgACABIAIbIQEgACECDAELCyABIAhqIgkgAU0NAiABKAIYIQsgASABKAIMIgRHBEAgASgCCCIAQZgIKAIASRogACAENgIMIAQgADYCCAwMCyABQRRqIgIoAgAiAEUEQCABKAIQIgBFDQQgAUEQaiECCwNAIAIhByAAIgRBFGoiAigCACIADQAgBEEQaiECIAQoAhAiAA0ACyAHQQA2AgAMCwtBfyEIIABBv39LDQAgAEELaiIAQXhxIQhBjAgoAgAiCUUNAEEAIAhrIQMCQAJAAkACf0EAIAhBgAJJDQAaQR8gCEH///8HSw0AGiAAQQh2IgAgAEGA/j9qQRB2QQhxIgJ0IgAgAEGA4B9qQRB2QQRxIgF0IgAgAEGAgA9qQRB2QQJxIgB0QQ92IAEgAnIgAHJrIgBBAXQgCCAAQRVqdkEBcXJBHGoLIgVBAnRBuApqKAIAIgJFBEBBACEADAELQQAhACAIQQBBGSAFQQF2ayAFQR9GG3QhAQNAAkAgAigCBEF4cSAIayIHIANPDQAgAiEEIAciAw0AQQAhAyACIQAMAwsgACACKAIUIgcgByACIAFBHXZBBHFqKAIQIgJGGyAAIAcbIQAgAUEBdCEBIAINAAsLIAAgBHJFBEBBACEEQQIgBXQiAEEAIABrciAJcSIARQ0DIABBACAAa3FBAWsiACAAQQx2QRBxIgJ2IgFBBXZBCHEiACACciABIAB2IgFBAnZBBHEiAHIgASAAdiIBQQF2QQJxIgByIAEgAHYiAUEBdkEBcSIAciABIAB2akECdEG4CmooAgAhAAsgAEUNAQsDQCAAKAIEQXhxIAhrIgEgA0khAiABIAMgAhshAyAAIAQgAhshBCAAKAIQIgEEfyABBSAAKAIUCyIADQALCyAERQ0AIANBkAgoAgAgCGtPDQAgBCAIaiIGIARNDQEgBCgCGCEFIAQgBCgCDCIBRwRAIAQoAggiAEGYCCgCAEkaIAAgATYCDCABIAA2AggMCgsgBEEUaiICKAIAIgBFBEAgBCgCECIARQ0EIARBEGohAgsDQCACIQcgACIBQRRqIgIoAgAiAA0AIAFBEGohAiABKAIQIgANAAsgB0EANgIADAkLIAhBkAgoAgAiAk0EQEGcCCgCACEDAkAgAiAIayIBQRBPBEBBkAggATYCAEGcCCADIAhqIgA2AgAgACABQQFyNgIEIAIgA2ogATYCACADIAhBA3I2AgQMAQtBnAhBADYCAEGQCEEANgIAIAMgAkEDcjYCBCACIANqIgAgACgCBEEBcjYCBAsgA0EIaiEADAsLIAhBlAgoAgAiBkkEQEGUCCAGIAhrIgE2AgBBoAhBoAgoAgAiAiAIaiIANgIAIAAgAUEBcjYCBCACIAhBA3I2AgQgAkEIaiEADAsLQQAhACAIQS9qIgkCf0HgCygCAARAQegLKAIADAELQewLQn83AgBB5AtCgKCAgICABDcCAEHgCyAMQQxqQXBxQdiq1aoFczYCAEH0C0EANgIAQcQLQQA2AgBBgCALIgFqIgVBACABayIHcSICIAhNDQpBwAsoAgAiBARAQbgLKAIAIgMgAmoiASADTQ0LIAEgBEsNCwtBxAstAABBBHENBQJAAkBBoAgoAgAiAwRAQcgLIQADQCADIAAoAgAiAU8EQCABIAAoAgRqIANLDQMLIAAoAggiAA0ACwtBABABIgFBf0YNBiACIQVB5AsoAgAiA0EBayIAIAFxBEAgAiABayAAIAFqQQAgA2txaiEFCyAFIAhNDQYgBUH+////B0sNBkHACygCACIEBEBBuAsoAgAiAyAFaiIAIANNDQcgACAESw0HCyAFEAEiACABRw0BDAgLIAUgBmsgB3EiBUH+////B0sNBSAFEAEiASAAKAIAIAAoAgRqRg0EIAEhAAsCQCAAQX9GDQAgCEEwaiAFTQ0AQegLKAIAIgEgCSAFa2pBACABa3EiAUH+////B0sEQCAAIQEMCAsgARABQX9HBEAgASAFaiEFIAAhAQwIC0EAIAVrEAEaDAULIAAiAUF/Rw0GDAQLAAtBACEEDAcLQQAhAQwFCyABQX9HDQILQcQLQcQLKAIAQQRyNgIACyACQf7///8HSw0BIAIQASEBQQAQASEAIAFBf0YNASAAQX9GDQEgACABTQ0BIAAgAWsiBSAIQShqTQ0BC0G4C0G4CygCACAFaiIANgIAQbwLKAIAIABJBEBBvAsgADYCAAsCQAJAAkBBoAgoAgAiBwRAQcgLIQADQCABIAAoAgAiAyAAKAIEIgJqRg0CIAAoAggiAA0ACwwCC0GYCCgCACIAQQAgACABTRtFBEBBmAggATYCAAtBACEAQcwLIAU2AgBByAsgATYCAEGoCEF/NgIAQawIQeALKAIANgIAQdQLQQA2AgADQCAAQQN0IgNBuAhqIANBsAhqIgI2AgAgA0G8CGogAjYCACAAQQFqIgBBIEcNAAtBlAggBUEoayIDQXggAWtBB3FBACABQQhqQQdxGyIAayICNgIAQaAIIAAgAWoiADYCACAAIAJBAXI2AgQgASADakEoNgIEQaQIQfALKAIANgIADAILIAAtAAxBCHENACADIAdLDQAgASAHTQ0AIAAgAiAFajYCBEGgCCAHQXggB2tBB3FBACAHQQhqQQdxGyIAaiICNgIAQZQIQZQIKAIAIAVqIgEgAGsiADYCACACIABBAXI2AgQgASAHakEoNgIEQaQIQfALKAIANgIADAELQZgIKAIAIAFLBEBBmAggATYCAAsgASAFaiECQcgLIQACQAJAAkACQAJAAkADQCACIAAoAgBHBEAgACgCCCIADQEMAgsLIAAtAAxBCHFFDQELQcgLIQADQCAHIAAoAgAiAk8EQCACIAAoAgRqIgQgB0sNAwsgACgCCCEADAALAAsgACABNgIAIAAgACgCBCAFajYCBCABQXggAWtBB3FBACABQQhqQQdxG2oiCSAIQQNyNgIEIAJBeCACa0EHcUEAIAJBCGpBB3EbaiIFIAggCWoiBmshAiAFIAdGBEBBoAggBjYCAEGUCEGUCCgCACACaiIANgIAIAYgAEEBcjYCBAwDCyAFQZwIKAIARgRAQZwIIAY2AgBBkAhBkAgoAgAgAmoiADYCACAGIABBAXI2AgQgACAGaiAANgIADAMLIAUoAgQiAEEDcUEBRgRAIABBeHEhBwJAIABB/wFNBEAgBSgCCCIDIABBA3YiAEEDdEGwCGpGGiADIAUoAgwiAUYEQEGICEGICCgCAEF+IAB3cTYCAAwCCyADIAE2AgwgASADNgIIDAELIAUoAhghCAJAIAUgBSgCDCIBRwRAIAUoAggiACABNgIMIAEgADYCCAwBCwJAIAVBFGoiACgCACIDDQAgBUEQaiIAKAIAIgMNAEEAIQEMAQsDQCAAIQQgAyIBQRRqIgAoAgAiAw0AIAFBEGohACABKAIQIgMNAAsgBEEANgIACyAIRQ0AAkAgBSAFKAIcIgNBAnRBuApqIgAoAgBGBEAgACABNgIAIAENAUGMCEGMCCgCAEF+IAN3cTYCAAwCCyAIQRBBFCAIKAIQIAVGG2ogATYCACABRQ0BCyABIAg2AhggBSgCECIABEAgASAANgIQIAAgATYCGAsgBSgCFCIARQ0AIAEgADYCFCAAIAE2AhgLIAUgB2ohBSACIAdqIQILIAUgBSgCBEF+cTYCBCAGIAJBAXI2AgQgAiAGaiACNgIAIAJB/wFNBEAgAkEDdiIAQQN0QbAIaiECAn9BiAgoAgAiAUEBIAB0IgBxRQRAQYgIIAAgAXI2AgAgAgwBCyACKAIICyEAIAIgBjYCCCAAIAY2AgwgBiACNgIMIAYgADYCCAwDC0EfIQAgAkH///8HTQRAIAJBCHYiACAAQYD+P2pBEHZBCHEiA3QiACAAQYDgH2pBEHZBBHEiAXQiACAAQYCAD2pBEHZBAnEiAHRBD3YgASADciAAcmsiAEEBdCACIABBFWp2QQFxckEcaiEACyAGIAA2AhwgBkIANwIQIABBAnRBuApqIQQCQEGMCCgCACIDQQEgAHQiAXFFBEBBjAggASADcjYCACAEIAY2AgAgBiAENgIYDAELIAJBAEEZIABBAXZrIABBH0YbdCEAIAQoAgAhAQNAIAEiAygCBEF4cSACRg0DIABBHXYhASAAQQF0IQAgAyABQQRxaiIEKAIQIgENAAsgBCAGNgIQIAYgAzYCGAsgBiAGNgIMIAYgBjYCCAwCC0GUCCAFQShrIgNBeCABa0EHcUEAIAFBCGpBB3EbIgBrIgI2AgBBoAggACABaiIANgIAIAAgAkEBcjYCBCABIANqQSg2AgRBpAhB8AsoAgA2AgAgByAEQScgBGtBB3FBACAEQSdrQQdxG2pBL2siACAAIAdBEGpJGyICQRs2AgQgAkHQCykCADcCECACQcgLKQIANwIIQdALIAJBCGo2AgBBzAsgBTYCAEHICyABNgIAQdQLQQA2AgAgAkEYaiEAA0AgAEEHNgIEIABBCGohASAAQQRqIQAgASAESQ0ACyACIAdGDQMgAiACKAIEQX5xNgIEIAcgAiAHayIEQQFyNgIEIAIgBDYCACAEQf8BTQRAIARBA3YiAEEDdEGwCGohAgJ/QYgIKAIAIgFBASAAdCIAcUUEQEGICCAAIAFyNgIAIAIMAQsgAigCCAshACACIAc2AgggACAHNgIMIAcgAjYCDCAHIAA2AggMBAtBHyEAIAdCADcCECAEQf///wdNBEAgBEEIdiIAIABBgP4/akEQdkEIcSICdCIAIABBgOAfakEQdkEEcSIBdCIAIABBgIAPakEQdkECcSIAdEEPdiABIAJyIAByayIAQQF0IAQgAEEVanZBAXFyQRxqIQALIAcgADYCHCAAQQJ0QbgKaiEDAkBBjAgoAgAiAkEBIAB0IgFxRQRAQYwIIAEgAnI2AgAgAyAHNgIAIAcgAzYCGAwBCyAEQQBBGSAAQQF2ayAAQR9GG3QhACADKAIAIQEDQCABIgIoAgRBeHEgBEYNBCAAQR12IQEgAEEBdCEAIAIgAUEEcWoiAygCECIBDQALIAMgBzYCECAHIAI2AhgLIAcgBzYCDCAHIAc2AggMAwsgAygCCCIAIAY2AgwgAyAGNgIIIAZBADYCGCAGIAM2AgwgBiAANgIICyAJQQhqIQAMBQsgAigCCCIAIAc2AgwgAiAHNgIIIAdBADYCGCAHIAI2AgwgByAANgIIC0GUCCgCACIAIAhNDQBBlAggACAIayIBNgIAQaAIQaAIKAIAIgIgCGoiADYCACAAIAFBAXI2AgQgAiAIQQNyNgIEIAJBCGohAAwDC0GECEEwNgIAQQAhAAwCCwJAIAVFDQACQCAEKAIcIgJBAnRBuApqIgAoAgAgBEYEQCAAIAE2AgAgAQ0BQYwIIAlBfiACd3EiCTYCAAwCCyAFQRBBFCAFKAIQIARGG2ogATYCACABRQ0BCyABIAU2AhggBCgCECIABEAgASAANgIQIAAgATYCGAsgBCgCFCIARQ0AIAEgADYCFCAAIAE2AhgLAkAgA0EPTQRAIAQgAyAIaiIAQQNyNgIEIAAgBGoiACAAKAIEQQFyNgIEDAELIAQgCEEDcjYCBCAGIANBAXI2AgQgAyAGaiADNgIAIANB/wFNBEAgA0EDdiIAQQN0QbAIaiECAn9BiAgoAgAiAUEBIAB0IgBxRQRAQYgIIAAgAXI2AgAgAgwBCyACKAIICyEAIAIgBjYCCCAAIAY2AgwgBiACNgIMIAYgADYCCAwBC0EfIQAgA0H///8HTQRAIANBCHYiACAAQYD+P2pBEHZBCHEiAnQiACAAQYDgH2pBEHZBBHEiAXQiACAAQYCAD2pBEHZBAnEiAHRBD3YgASACciAAcmsiAEEBdCADIABBFWp2QQFxckEcaiEACyAGIAA2AhwgBkIANwIQIABBAnRBuApqIQICQAJAIAlBASAAdCIBcUUEQEGMCCABIAlyNgIAIAIgBjYCACAGIAI2AhgMAQsgA0EAQRkgAEEBdmsgAEEfRht0IQAgAigCACEIA0AgCCIBKAIEQXhxIANGDQIgAEEddiECIABBAXQhACABIAJBBHFqIgIoAhAiCA0ACyACIAY2AhAgBiABNgIYCyAGIAY2AgwgBiAGNgIIDAELIAEoAggiACAGNgIMIAEgBjYCCCAGQQA2AhggBiABNgIMIAYgADYCCAsgBEEIaiEADAELAkAgC0UNAAJAIAEoAhwiAkECdEG4CmoiACgCACABRgRAIAAgBDYCACAEDQFBjAggBkF+IAJ3cTYCAAwCCyALQRBBFCALKAIQIAFGG2ogBDYCACAERQ0BCyAEIAs2AhggASgCECIABEAgBCAANgIQIAAgBDYCGAsgASgCFCIARQ0AIAQgADYCFCAAIAQ2AhgLAkAgA0EPTQRAIAEgAyAIaiIAQQNyNgIEIAAgAWoiACAAKAIEQQFyNgIEDAELIAEgCEEDcjYCBCAJIANBAXI2AgQgAyAJaiADNgIAIAoEQCAKQQN2IgBBA3RBsAhqIQRBnAgoAgAhAgJ/QQEgAHQiACAFcUUEQEGICCAAIAVyNgIAIAQMAQsgBCgCCAshACAEIAI2AgggACACNgIMIAIgBDYCDCACIAA2AggLQZwIIAk2AgBBkAggAzYCAAsgAUEIaiEACyAMQRBqJAAgAAsQACMAIABrQXBxIgAkACAACwYAIAAkAAsEACMAC4AJAgh/BH4jAEGQAWsiBiQAIAYgBS0AA0EYdEGAgIAYcSAFLwAAIAUtAAJBEHRycjYCACAGIAUoAANBAnZBg/7/H3E2AgQgBiAFKAAGQQR2Qf+B/x9xNgIIIAYgBSgACUEGdkH//8AfcTYCDCAFLwANIQggBS0ADyEJIAZCADcCFCAGQgA3AhwgBkEANgIkIAYgCCAJQRB0QYCAPHFyNgIQIAYgBSgAEDYCKCAGIAUoABQ2AiwgBiAFKAAYNgIwIAUoABwhBSAGQQA6AEwgBkEANgI4IAYgBTYCNCAGIAEgAhAEIAQEQCAGIAMgBBAECyAGKAI4IgEEQCAGQTxqIgIgAWpBAToAACABQQFqQQ9NBEAgASAGakE9aiEEAkBBDyABayIDRQ0AIAMgBGoiAUEBa0EAOgAAIARBADoAACADQQNJDQAgAUECa0EAOgAAIARBADoAASABQQNrQQA6AAAgBEEAOgACIANBB0kNACABQQRrQQA6AAAgBEEAOgADIANBCUkNACAEQQAgBGtBA3EiAWoiBEEANgIAIAQgAyABa0F8cSIBaiIDQQRrQQA2AgAgAUEJSQ0AIARBADYCCCAEQQA2AgQgA0EIa0EANgIAIANBDGtBADYCACABQRlJDQAgBEEANgIYIARBADYCFCAEQQA2AhAgBEEANgIMIANBEGtBADYCACADQRRrQQA2AgAgA0EYa0EANgIAIANBHGtBADYCACABIARBBHFBGHIiAWsiA0EgSQ0AIAEgBGohAQNAIAFCADcDGCABQgA3AxAgAUIANwMIIAFCADcDACABQSBqIQEgA0EgayIDQR9LDQALCwsgBkEBOgBMIAYgAkEQEAILIAY1AjQhECAGNQIwIREgBjUCLCEOIAAgBjUCKCAGKAIkIAYoAiAgBigCHCAGKAIYIgNBGnZqIgJBGnZqIgFBGnZqIgtBgICAYHIgAUH///8fcSINIAJB////H3EiCCAGKAIUIAtBGnZBBWxqIgFB////H3EiCUEFaiIFQRp2IANB////H3EgAUEadmoiA2oiAUEadmoiAkEadmoiBEEadmoiDEEfdSIHIANxIAEgDEEfdkEBayIDQf///x9xIgpxciIBQRp0IAUgCnEgByAJcXJyrXwiDzwAACAAIA9CGIg8AAMgACAPQhCIPAACIAAgD0IIiDwAASAAIA4gByAIcSACIApxciICQRR0IAFBBnZyrXwgD0IgiHwiDjwABCAAIA5CGIg8AAcgACAOQhCIPAAGIAAgDkIIiDwABSAAIBEgByANcSAEIApxciIBQQ50IAJBDHZyrXwgDkIgiHwiDjwACCAAIA5CGIg8AAsgACAOQhCIPAAKIAAgDkIIiDwACSAAIBAgAyAMcSAHIAtxckEIdCABQRJ2cq18IA5CIIh8Ig48AAwgACAOQhiIPAAPIAAgDkIQiDwADiAAIA5CCIg8AA0gBkIANwIwIAZCADcCKCAGQgA3AiAgBkIANwIYIAZCADcCECAGQgA3AgggBkIANwIAIAZBkAFqJAALpwwBB38CQCAARQ0AIABBCGsiAyAAQQRrKAIAIgFBeHEiAGohBQJAIAFBAXENACABQQNxRQ0BIAMgAygCACIBayIDQZgIKAIASQ0BIAAgAWohACADQZwIKAIARwRAIAFB/wFNBEAgAygCCCICIAFBA3YiBEEDdEGwCGpGGiACIAMoAgwiAUYEQEGICEGICCgCAEF+IAR3cTYCAAwDCyACIAE2AgwgASACNgIIDAILIAMoAhghBgJAIAMgAygCDCIBRwRAIAMoAggiAiABNgIMIAEgAjYCCAwBCwJAIANBFGoiAigCACIEDQAgA0EQaiICKAIAIgQNAEEAIQEMAQsDQCACIQcgBCIBQRRqIgIoAgAiBA0AIAFBEGohAiABKAIQIgQNAAsgB0EANgIACyAGRQ0BAkAgAyADKAIcIgJBAnRBuApqIgQoAgBGBEAgBCABNgIAIAENAUGMCEGMCCgCAEF+IAJ3cTYCAAwDCyAGQRBBFCAGKAIQIANGG2ogATYCACABRQ0CCyABIAY2AhggAygCECICBEAgASACNgIQIAIgATYCGAsgAygCFCICRQ0BIAEgAjYCFCACIAE2AhgMAQsgBSgCBCIBQQNxQQNHDQBBkAggADYCACAFIAFBfnE2AgQgAyAAQQFyNgIEIAAgA2ogADYCAA8LIAMgBU8NACAFKAIEIgFBAXFFDQACQCABQQJxRQRAIAVBoAgoAgBGBEBBoAggAzYCAEGUCEGUCCgCACAAaiIANgIAIAMgAEEBcjYCBCADQZwIKAIARw0DQZAIQQA2AgBBnAhBADYCAA8LIAVBnAgoAgBGBEBBnAggAzYCAEGQCEGQCCgCACAAaiIANgIAIAMgAEEBcjYCBCAAIANqIAA2AgAPCyABQXhxIABqIQACQCABQf8BTQRAIAUoAggiAiABQQN2IgRBA3RBsAhqRhogAiAFKAIMIgFGBEBBiAhBiAgoAgBBfiAEd3E2AgAMAgsgAiABNgIMIAEgAjYCCAwBCyAFKAIYIQYCQCAFIAUoAgwiAUcEQCAFKAIIIgJBmAgoAgBJGiACIAE2AgwgASACNgIIDAELAkAgBUEUaiICKAIAIgQNACAFQRBqIgIoAgAiBA0AQQAhAQwBCwNAIAIhByAEIgFBFGoiAigCACIEDQAgAUEQaiECIAEoAhAiBA0ACyAHQQA2AgALIAZFDQACQCAFIAUoAhwiAkECdEG4CmoiBCgCAEYEQCAEIAE2AgAgAQ0BQYwIQYwIKAIAQX4gAndxNgIADAILIAZBEEEUIAYoAhAgBUYbaiABNgIAIAFFDQELIAEgBjYCGCAFKAIQIgIEQCABIAI2AhAgAiABNgIYCyAFKAIUIgJFDQAgASACNgIUIAIgATYCGAsgAyAAQQFyNgIEIAAgA2ogADYCACADQZwIKAIARw0BQZAIIAA2AgAPCyAFIAFBfnE2AgQgAyAAQQFyNgIEIAAgA2ogADYCAAsgAEH/AU0EQCAAQQN2IgFBA3RBsAhqIQACf0GICCgCACICQQEgAXQiAXFFBEBBiAggASACcjYCACAADAELIAAoAggLIQIgACADNgIIIAIgAzYCDCADIAA2AgwgAyACNgIIDwtBHyECIANCADcCECAAQf///wdNBEAgAEEIdiIBIAFBgP4/akEQdkEIcSIBdCICIAJBgOAfakEQdkEEcSICdCIEIARBgIAPakEQdkECcSIEdEEPdiABIAJyIARyayIBQQF0IAAgAUEVanZBAXFyQRxqIQILIAMgAjYCHCACQQJ0QbgKaiEBAkACQAJAQYwIKAIAIgRBASACdCIHcUUEQEGMCCAEIAdyNgIAIAEgAzYCACADIAE2AhgMAQsgAEEAQRkgAkEBdmsgAkEfRht0IQIgASgCACEBA0AgASIEKAIEQXhxIABGDQIgAkEddiEBIAJBAXQhAiAEIAFBBHFqIgdBEGooAgAiAQ0ACyAHIAM2AhAgAyAENgIYCyADIAM2AgwgAyADNgIIDAELIAQoAggiACADNgIMIAQgAzYCCCADQQA2AhggAyAENgIMIAMgADYCCAtBqAhBqAgoAgBBAWsiAEF/IAAbNgIACwsLCQEAQYEICwIGUA==";
			if (!W.startsWith(V)) {
				var na = W;
				W = b.locateFile ? b.locateFile(na, B) : B + na;
			}
			function pa() {
				var a = W;
				try {
					if (a == W && J) return new Uint8Array(J);
					var c = H(a);
					if (c) return c;
					if (E) return E(a);
					throw "both async and sync fetching of the wasm failed";
				} catch (d) {
					K(d);
				}
			}
			function qa() {
				if (!J && (x || y)) {
					if ("function" === typeof fetch && !W.startsWith("file://")) return fetch(W, { credentials: "same-origin" }).then(function(a) {
						if (!a.ok) throw "failed to load wasm binary file at '" + W + "'";
						return a.arrayBuffer();
					}).catch(function() {
						return pa();
					});
					if (D) return new Promise(function(a, c) {
						D(W, function(d) {
							a(new Uint8Array(d));
						}, c);
					});
				}
				return Promise.resolve().then(function() {
					return pa();
				});
			}
			function X(a) {
				for (; 0 < a.length;) {
					var c = a.shift();
					if ("function" == typeof c) c(b);
					else {
						var d = c.m;
						"number" === typeof d ? void 0 === c.l ? R.get(d)() : R.get(d)(c.l) : d(void 0 === c.l ? null : c.l);
					}
				}
			}
			var ba = !1, ra = "function" === typeof atob ? atob : function(a) {
				var c = "", d = 0;
				a = a.replace(/[^A-Za-z0-9\+\/=]/g, "");
				do {
					var e = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".indexOf(a.charAt(d++));
					var f = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".indexOf(a.charAt(d++));
					var l = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".indexOf(a.charAt(d++));
					var A = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".indexOf(a.charAt(d++));
					e = e << 2 | f >> 4;
					f = (f & 15) << 4 | l >> 2;
					var t = (l & 3) << 6 | A;
					c += String.fromCharCode(e);
					64 !== l && (c += String.fromCharCode(f));
					64 !== A && (c += String.fromCharCode(t));
				} while (d < a.length);
				return c;
			};
			function H(a) {
				if (a.startsWith(V)) {
					a = a.slice(V.length);
					if ("boolean" === typeof z && z) {
						var c = Buffer.from(a, "base64");
						c = new Uint8Array(c.buffer, c.byteOffset, c.byteLength);
					} else try {
						var d = ra(a), e = new Uint8Array(d.length);
						for (a = 0; a < d.length; ++a) e[a] = d.charCodeAt(a);
						c = e;
					} catch (f) {
						throw Error("Converting base64 string to bytes failed.");
					}
					return c;
				}
			}
			var sa = { a: function(a) {
				var c = P.length;
				a >>>= 0;
				if (0x80000000 < a) return !1;
				for (var d = 1; 4 >= d; d *= 2) {
					var e = c * (1 + .2 / d);
					e = Math.min(e, a + 0x6000000);
					e = Math.max(a, e);
					0 < e % 65536 && (e += 65536 - e % 65536);
					a: {
						try {
							L.grow(Math.min(0x80000000, e) - ha.byteLength + 65535 >>> 16);
							ia();
							var f = 1;
							break a;
						} catch (l) {}
						f = void 0;
					}
					if (f) return !0;
				}
				return !1;
			} };
			(function() {
				function a(f) {
					b.asm = f.exports;
					L = b.asm.b;
					ia();
					R = b.asm.j;
					ka.unshift(b.asm.c);
					S--;
					b.monitorRunDependencies && b.monitorRunDependencies(S);
					0 == S && (null !== T && (clearInterval(T), T = null), U && (f = U, U = null, f()));
				}
				function c(f) {
					a(f.instance);
				}
				function d(f) {
					return qa().then(function(l) {
						return WebAssembly.instantiate(l, e);
					}).then(f, function(l) {
						I("failed to asynchronously prepare wasm: " + l);
						K(l);
					});
				}
				var e = { a: sa };
				S++;
				b.monitorRunDependencies && b.monitorRunDependencies(S);
				if (b.instantiateWasm) try {
					return b.instantiateWasm(e, a);
				} catch (f) {
					return I("Module.instantiateWasm callback failed with error: " + f), !1;
				}
				(function() {
					return J || "function" !== typeof WebAssembly.instantiateStreaming || W.startsWith(V) || W.startsWith("file://") || "function" !== typeof fetch ? d(c) : fetch(W, { credentials: "same-origin" }).then(function(f) {
						return WebAssembly.instantiateStreaming(f, e).then(c, function(l) {
							I("wasm streaming compile failed: " + l);
							I("falling back to ArrayBuffer instantiation");
							return d(c);
						});
					});
				})().catch(r);
				return {};
			})();
			b.___wasm_call_ctors = function() {
				return (b.___wasm_call_ctors = b.asm.c).apply(null, arguments);
			};
			b._poly1305_auth = function() {
				return (b._poly1305_auth = b.asm.d).apply(null, arguments);
			};
			var da = b.stackSave = function() {
				return (da = b.stackSave = b.asm.e).apply(null, arguments);
			}, fa = b.stackRestore = function() {
				return (fa = b.stackRestore = b.asm.f).apply(null, arguments);
			}, O = b.stackAlloc = function() {
				return (O = b.stackAlloc = b.asm.g).apply(null, arguments);
			};
			b._malloc = function() {
				return (b._malloc = b.asm.h).apply(null, arguments);
			};
			b._free = function() {
				return (b._free = b.asm.i).apply(null, arguments);
			};
			b.cwrap = function(a, c, d, e) {
				d = d || [];
				var f = d.every(function(l) {
					return "number" === l;
				});
				return "string" !== c && f && !e ? N(a) : function() {
					return ca(a, c, d, arguments);
				};
			};
			var Y;
			U = function ta() {
				Y || Z();
				Y || (U = ta);
			};
			function Z() {
				function a() {
					if (!Y && (Y = !0, b.calledRun = !0, !M)) {
						X(ka);
						q(b);
						if (b.onRuntimeInitialized) b.onRuntimeInitialized();
						if (b.postRun) for ("function" == typeof b.postRun && (b.postRun = [b.postRun]); b.postRun.length;) {
							var c = b.postRun.shift();
							la.unshift(c);
						}
						X(la);
					}
				}
				if (!(0 < S)) {
					if (b.preRun) for ("function" == typeof b.preRun && (b.preRun = [b.preRun]); b.preRun.length;) ma();
					X(ja);
					0 < S || (b.setStatus ? (b.setStatus("Running..."), setTimeout(function() {
						setTimeout(function() {
							b.setStatus("");
						}, 1);
						a();
					}, 1)) : a());
				}
			}
			b.run = Z;
			if (b.preInit) for ("function" == typeof b.preInit && (b.preInit = [b.preInit]); 0 < b.preInit.length;) b.preInit.pop()();
			Z();
			return createPoly1305.ready;
		});
	})();
	if (typeof exports === "object" && typeof module === "object") module.exports = createPoly1305;
	else if (typeof define === "function" && define["amd"]) define([], function() {
		return createPoly1305;
	});
	else if (typeof exports === "object") exports["createPoly1305"] = createPoly1305;
}));
// node_modules/ssh2/lib/protocol/crypto.js
var require_crypto = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const { createCipheriv, createDecipheriv, createHmac, randomFillSync, timingSafeEqual } = __require("crypto");
	const { readUInt32BE, writeUInt32BE } = require_utils$1();
	const FastBuffer = Buffer[Symbol.species];
	const MAX_SEQNO = 2 ** 32 - 1;
	const EMPTY_BUFFER = Buffer.alloc(0);
	const BUF_INT = Buffer.alloc(4);
	const DISCARD_CACHE = /* @__PURE__ */ new Map();
	const MAX_PACKET_SIZE = 35e3;
	let binding;
	let AESGCMCipher;
	let ChaChaPolyCipher;
	let GenericCipher;
	let AESGCMDecipher;
	let ChaChaPolyDecipher;
	let GenericDecipher;
	try {
		binding = __require("../node_modules/ssh2/lib/protocol/crypto/build/Release/sshcrypto.node");
		({AESGCMCipher, ChaChaPolyCipher, GenericCipher, AESGCMDecipher, ChaChaPolyDecipher, GenericDecipher} = binding);
	} catch {}
	const CIPHER_STREAM = 1;
	const CIPHER_INFO = (() => {
		function info(sslName, blockLen, keyLen, ivLen, authLen, discardLen, flags) {
			return {
				sslName,
				blockLen,
				keyLen,
				ivLen: ivLen !== 0 || flags & CIPHER_STREAM ? ivLen : blockLen,
				authLen,
				discardLen,
				stream: !!(flags & CIPHER_STREAM)
			};
		}
		return {
			"chacha20-poly1305@openssh.com": info("chacha20", 8, 64, 0, 16, 0, CIPHER_STREAM),
			"aes128-gcm": info("aes-128-gcm", 16, 16, 12, 16, 0, CIPHER_STREAM),
			"aes256-gcm": info("aes-256-gcm", 16, 32, 12, 16, 0, CIPHER_STREAM),
			"aes128-gcm@openssh.com": info("aes-128-gcm", 16, 16, 12, 16, 0, CIPHER_STREAM),
			"aes256-gcm@openssh.com": info("aes-256-gcm", 16, 32, 12, 16, 0, CIPHER_STREAM),
			"aes128-cbc": info("aes-128-cbc", 16, 16, 0, 0, 0, 0),
			"aes192-cbc": info("aes-192-cbc", 16, 24, 0, 0, 0, 0),
			"aes256-cbc": info("aes-256-cbc", 16, 32, 0, 0, 0, 0),
			"rijndael-cbc@lysator.liu.se": info("aes-256-cbc", 16, 32, 0, 0, 0, 0),
			"3des-cbc": info("des-ede3-cbc", 8, 24, 0, 0, 0, 0),
			"blowfish-cbc": info("bf-cbc", 8, 16, 0, 0, 0, 0),
			"idea-cbc": info("idea-cbc", 8, 16, 0, 0, 0, 0),
			"cast128-cbc": info("cast-cbc", 8, 16, 0, 0, 0, 0),
			"aes128-ctr": info("aes-128-ctr", 16, 16, 16, 0, 0, CIPHER_STREAM),
			"aes192-ctr": info("aes-192-ctr", 16, 24, 16, 0, 0, CIPHER_STREAM),
			"aes256-ctr": info("aes-256-ctr", 16, 32, 16, 0, 0, CIPHER_STREAM),
			"3des-ctr": info("des-ede3", 8, 24, 8, 0, 0, CIPHER_STREAM),
			"blowfish-ctr": info("bf-ecb", 8, 16, 8, 0, 0, CIPHER_STREAM),
			"cast128-ctr": info("cast5-ecb", 8, 16, 8, 0, 0, CIPHER_STREAM),
			"arcfour": info("rc4", 8, 16, 0, 0, 1536, CIPHER_STREAM),
			"arcfour128": info("rc4", 8, 16, 0, 0, 1536, CIPHER_STREAM),
			"arcfour256": info("rc4", 8, 32, 0, 0, 1536, CIPHER_STREAM),
			"arcfour512": info("rc4", 8, 64, 0, 0, 1536, CIPHER_STREAM)
		};
	})();
	const MAC_INFO = (() => {
		function info(sslName, len, actualLen, isETM) {
			return {
				sslName,
				len,
				actualLen,
				isETM
			};
		}
		return {
			"hmac-md5": info("md5", 16, 16, false),
			"hmac-md5-96": info("md5", 16, 12, false),
			"hmac-ripemd160": info("ripemd160", 20, 20, false),
			"hmac-sha1": info("sha1", 20, 20, false),
			"hmac-sha1-etm@openssh.com": info("sha1", 20, 20, true),
			"hmac-sha1-96": info("sha1", 20, 12, false),
			"hmac-sha2-256": info("sha256", 32, 32, false),
			"hmac-sha2-256-etm@openssh.com": info("sha256", 32, 32, true),
			"hmac-sha2-256-96": info("sha256", 32, 12, false),
			"hmac-sha2-512": info("sha512", 64, 64, false),
			"hmac-sha2-512-etm@openssh.com": info("sha512", 64, 64, true),
			"hmac-sha2-512-96": info("sha512", 64, 12, false)
		};
	})();
	var NullCipher = class {
		constructor(seqno, onWrite) {
			this.outSeqno = seqno;
			this._onWrite = onWrite;
			this._dead = false;
		}
		free() {
			this._dead = true;
		}
		allocPacket(payloadLen) {
			let pktLen = 5 + payloadLen;
			let padLen = 8 - (pktLen & 7);
			if (padLen < 4) padLen += 8;
			pktLen += padLen;
			const packet = Buffer.allocUnsafe(pktLen);
			writeUInt32BE(packet, pktLen - 4, 0);
			packet[4] = padLen;
			randomFillSync(packet, 5 + payloadLen, padLen);
			return packet;
		}
		encrypt(packet) {
			if (this._dead) return;
			this._onWrite(packet);
			this.outSeqno = this.outSeqno + 1 >>> 0;
		}
	};
	const POLY1305_ZEROS = Buffer.alloc(32);
	const POLY1305_OUT_COMPUTE = Buffer.alloc(16);
	let POLY1305_WASM_MODULE;
	let POLY1305_RESULT_MALLOC;
	let poly1305_auth;
	var ChaChaPolyCipherNative = class {
		constructor(config) {
			const enc = config.outbound;
			this.outSeqno = enc.seqno;
			this._onWrite = enc.onWrite;
			this._encKeyMain = enc.cipherKey.slice(0, 32);
			this._encKeyPktLen = enc.cipherKey.slice(32);
			this._dead = false;
		}
		free() {
			this._dead = true;
		}
		allocPacket(payloadLen) {
			let pktLen = 5 + payloadLen;
			let padLen = 8 - (pktLen - 4 & 7);
			if (padLen < 4) padLen += 8;
			pktLen += padLen;
			const packet = Buffer.allocUnsafe(pktLen);
			writeUInt32BE(packet, pktLen - 4, 0);
			packet[4] = padLen;
			randomFillSync(packet, 5 + payloadLen, padLen);
			return packet;
		}
		encrypt(packet) {
			if (this._dead) return;
			POLY1305_OUT_COMPUTE[0] = 0;
			writeUInt32BE(POLY1305_OUT_COMPUTE, this.outSeqno, 12);
			const polyKey = createCipheriv("chacha20", this._encKeyMain, POLY1305_OUT_COMPUTE).update(POLY1305_ZEROS);
			const pktLenEnc = createCipheriv("chacha20", this._encKeyPktLen, POLY1305_OUT_COMPUTE).update(packet.slice(0, 4));
			this._onWrite(pktLenEnc);
			POLY1305_OUT_COMPUTE[0] = 1;
			const payloadEnc = createCipheriv("chacha20", this._encKeyMain, POLY1305_OUT_COMPUTE).update(packet.slice(4));
			this._onWrite(payloadEnc);
			poly1305_auth(POLY1305_RESULT_MALLOC, pktLenEnc, pktLenEnc.length, payloadEnc, payloadEnc.length, polyKey);
			const mac = Buffer.allocUnsafe(16);
			mac.set(new Uint8Array(POLY1305_WASM_MODULE.HEAPU8.buffer, POLY1305_RESULT_MALLOC, 16), 0);
			this._onWrite(mac);
			this.outSeqno = this.outSeqno + 1 >>> 0;
		}
	};
	var ChaChaPolyCipherBinding = class {
		constructor(config) {
			const enc = config.outbound;
			this.outSeqno = enc.seqno;
			this._onWrite = enc.onWrite;
			this._instance = new ChaChaPolyCipher(enc.cipherKey);
			this._dead = false;
		}
		free() {
			this._dead = true;
			this._instance.free();
		}
		allocPacket(payloadLen) {
			let pktLen = 5 + payloadLen;
			let padLen = 8 - (pktLen - 4 & 7);
			if (padLen < 4) padLen += 8;
			pktLen += padLen;
			const packet = Buffer.allocUnsafe(pktLen + 16);
			writeUInt32BE(packet, pktLen - 4, 0);
			packet[4] = padLen;
			randomFillSync(packet, 5 + payloadLen, padLen);
			return packet;
		}
		encrypt(packet) {
			if (this._dead) return;
			this._instance.encrypt(packet, this.outSeqno);
			this._onWrite(packet);
			this.outSeqno = this.outSeqno + 1 >>> 0;
		}
	};
	var AESGCMCipherNative = class {
		constructor(config) {
			const enc = config.outbound;
			this.outSeqno = enc.seqno;
			this._onWrite = enc.onWrite;
			this._encSSLName = enc.cipherInfo.sslName;
			this._encKey = enc.cipherKey;
			this._encIV = enc.cipherIV;
			this._dead = false;
		}
		free() {
			this._dead = true;
		}
		allocPacket(payloadLen) {
			let pktLen = 5 + payloadLen;
			let padLen = 16 - (pktLen - 4 & 15);
			if (padLen < 4) padLen += 16;
			pktLen += padLen;
			const packet = Buffer.allocUnsafe(pktLen);
			writeUInt32BE(packet, pktLen - 4, 0);
			packet[4] = padLen;
			randomFillSync(packet, 5 + payloadLen, padLen);
			return packet;
		}
		encrypt(packet) {
			if (this._dead) return;
			const cipher = createCipheriv(this._encSSLName, this._encKey, this._encIV);
			cipher.setAutoPadding(false);
			const lenData = packet.slice(0, 4);
			cipher.setAAD(lenData);
			this._onWrite(lenData);
			const encrypted = cipher.update(packet.slice(4));
			this._onWrite(encrypted);
			const final = cipher.final();
			if (final.length) this._onWrite(final);
			const tag = cipher.getAuthTag();
			this._onWrite(tag);
			ivIncrement(this._encIV);
			this.outSeqno = this.outSeqno + 1 >>> 0;
		}
	};
	var AESGCMCipherBinding = class {
		constructor(config) {
			const enc = config.outbound;
			this.outSeqno = enc.seqno;
			this._onWrite = enc.onWrite;
			this._instance = new AESGCMCipher(enc.cipherInfo.sslName, enc.cipherKey, enc.cipherIV);
			this._dead = false;
		}
		free() {
			this._dead = true;
			this._instance.free();
		}
		allocPacket(payloadLen) {
			let pktLen = 5 + payloadLen;
			let padLen = 16 - (pktLen - 4 & 15);
			if (padLen < 4) padLen += 16;
			pktLen += padLen;
			const packet = Buffer.allocUnsafe(pktLen + 16);
			writeUInt32BE(packet, pktLen - 4, 0);
			packet[4] = padLen;
			randomFillSync(packet, 5 + payloadLen, padLen);
			return packet;
		}
		encrypt(packet) {
			if (this._dead) return;
			this._instance.encrypt(packet);
			this._onWrite(packet);
			this.outSeqno = this.outSeqno + 1 >>> 0;
		}
	};
	var GenericCipherNative = class {
		constructor(config) {
			const enc = config.outbound;
			this.outSeqno = enc.seqno;
			this._onWrite = enc.onWrite;
			this._encBlockLen = enc.cipherInfo.blockLen;
			this._cipherInstance = createCipheriv(enc.cipherInfo.sslName, enc.cipherKey, enc.cipherIV);
			this._macSSLName = enc.macInfo.sslName;
			this._macKey = enc.macKey;
			this._macActualLen = enc.macInfo.actualLen;
			this._macETM = enc.macInfo.isETM;
			this._aadLen = this._macETM ? 4 : 0;
			this._dead = false;
			const discardLen = enc.cipherInfo.discardLen;
			if (discardLen) {
				let discard = DISCARD_CACHE.get(discardLen);
				if (discard === void 0) {
					discard = Buffer.alloc(discardLen);
					DISCARD_CACHE.set(discardLen, discard);
				}
				this._cipherInstance.update(discard);
			}
		}
		free() {
			this._dead = true;
		}
		allocPacket(payloadLen) {
			const blockLen = this._encBlockLen;
			let pktLen = 5 + payloadLen;
			let padLen = blockLen - (pktLen - this._aadLen & blockLen - 1);
			if (padLen < 4) padLen += blockLen;
			pktLen += padLen;
			const packet = Buffer.allocUnsafe(pktLen);
			writeUInt32BE(packet, pktLen - 4, 0);
			packet[4] = padLen;
			randomFillSync(packet, 5 + payloadLen, padLen);
			return packet;
		}
		encrypt(packet) {
			if (this._dead) return;
			let mac;
			if (this._macETM) {
				const lenBytes = new Uint8Array(packet.buffer, packet.byteOffset, 4);
				const encrypted = this._cipherInstance.update(new Uint8Array(packet.buffer, packet.byteOffset + 4, packet.length - 4));
				this._onWrite(lenBytes);
				this._onWrite(encrypted);
				mac = createHmac(this._macSSLName, this._macKey);
				writeUInt32BE(BUF_INT, this.outSeqno, 0);
				mac.update(BUF_INT);
				mac.update(lenBytes);
				mac.update(encrypted);
			} else {
				const encrypted = this._cipherInstance.update(packet);
				this._onWrite(encrypted);
				mac = createHmac(this._macSSLName, this._macKey);
				writeUInt32BE(BUF_INT, this.outSeqno, 0);
				mac.update(BUF_INT);
				mac.update(packet);
			}
			let digest = mac.digest();
			if (digest.length > this._macActualLen) digest = digest.slice(0, this._macActualLen);
			this._onWrite(digest);
			this.outSeqno = this.outSeqno + 1 >>> 0;
		}
	};
	var GenericCipherBinding = class {
		constructor(config) {
			const enc = config.outbound;
			this.outSeqno = enc.seqno;
			this._onWrite = enc.onWrite;
			this._encBlockLen = enc.cipherInfo.blockLen;
			this._macLen = enc.macInfo.len;
			this._macActualLen = enc.macInfo.actualLen;
			this._aadLen = enc.macInfo.isETM ? 4 : 0;
			this._instance = new GenericCipher(enc.cipherInfo.sslName, enc.cipherKey, enc.cipherIV, enc.macInfo.sslName, enc.macKey, enc.macInfo.isETM);
			this._dead = false;
		}
		free() {
			this._dead = true;
			this._instance.free();
		}
		allocPacket(payloadLen) {
			const blockLen = this._encBlockLen;
			let pktLen = 5 + payloadLen;
			let padLen = blockLen - (pktLen - this._aadLen & blockLen - 1);
			if (padLen < 4) padLen += blockLen;
			pktLen += padLen;
			const packet = Buffer.allocUnsafe(pktLen + this._macLen);
			writeUInt32BE(packet, pktLen - 4, 0);
			packet[4] = padLen;
			randomFillSync(packet, 5 + payloadLen, padLen);
			return packet;
		}
		encrypt(packet) {
			if (this._dead) return;
			this._instance.encrypt(packet, this.outSeqno);
			if (this._macActualLen < this._macLen) packet = new FastBuffer(packet.buffer, packet.byteOffset, packet.length - (this._macLen - this._macActualLen));
			this._onWrite(packet);
			this.outSeqno = this.outSeqno + 1 >>> 0;
		}
	};
	var NullDecipher = class {
		constructor(seqno, onPayload) {
			this.inSeqno = seqno;
			this._onPayload = onPayload;
			this._len = 0;
			this._lenBytes = 0;
			this._packet = null;
			this._packetPos = 0;
		}
		free() {}
		decrypt(data, p, dataLen) {
			while (p < dataLen) {
				if (this._lenBytes < 4) {
					let nb = Math.min(4 - this._lenBytes, dataLen - p);
					this._lenBytes += nb;
					while (nb--) this._len = (this._len << 8) + data[p++];
					if (this._lenBytes < 4) return;
					if (this._len > MAX_PACKET_SIZE || this._len < 8 || (4 + this._len & 7) !== 0) throw new Error("Bad packet length");
					if (p >= dataLen) return;
				}
				if (this._packetPos < this._len) {
					const nb = Math.min(this._len - this._packetPos, dataLen - p);
					let chunk;
					if (p !== 0 || nb !== dataLen) chunk = new Uint8Array(data.buffer, data.byteOffset + p, nb);
					else chunk = data;
					if (nb === this._len) this._packet = chunk;
					else {
						if (!this._packet) this._packet = Buffer.allocUnsafe(this._len);
						this._packet.set(chunk, this._packetPos);
					}
					p += nb;
					this._packetPos += nb;
					if (this._packetPos < this._len) return;
				}
				const payload = !this._packet ? EMPTY_BUFFER : new FastBuffer(this._packet.buffer, this._packet.byteOffset + 1, this._packet.length - this._packet[0] - 1);
				this.inSeqno = this.inSeqno + 1 >>> 0;
				this._len = 0;
				this._lenBytes = 0;
				this._packet = null;
				this._packetPos = 0;
				{
					const ret = this._onPayload(payload);
					if (ret !== void 0) return ret === false ? p : ret;
				}
			}
		}
	};
	var ChaChaPolyDecipherNative = class {
		constructor(config) {
			const dec = config.inbound;
			this.inSeqno = dec.seqno;
			this._onPayload = dec.onPayload;
			this._decKeyMain = dec.decipherKey.slice(0, 32);
			this._decKeyPktLen = dec.decipherKey.slice(32);
			this._len = 0;
			this._lenBuf = Buffer.alloc(4);
			this._lenPos = 0;
			this._packet = null;
			this._pktLen = 0;
			this._mac = Buffer.allocUnsafe(16);
			this._calcMac = Buffer.allocUnsafe(16);
			this._macPos = 0;
		}
		free() {}
		decrypt(data, p, dataLen) {
			while (p < dataLen) {
				if (this._lenPos < 4) {
					let nb = Math.min(4 - this._lenPos, dataLen - p);
					while (nb--) this._lenBuf[this._lenPos++] = data[p++];
					if (this._lenPos < 4) return;
					POLY1305_OUT_COMPUTE[0] = 0;
					writeUInt32BE(POLY1305_OUT_COMPUTE, this.inSeqno, 12);
					const decLenBytes = createDecipheriv("chacha20", this._decKeyPktLen, POLY1305_OUT_COMPUTE).update(this._lenBuf);
					this._len = readUInt32BE(decLenBytes, 0);
					if (this._len > MAX_PACKET_SIZE || this._len < 8 || (this._len & 7) !== 0) throw new Error("Bad packet length");
				}
				if (this._pktLen < this._len) {
					if (p >= dataLen) return;
					const nb = Math.min(this._len - this._pktLen, dataLen - p);
					let encrypted;
					if (p !== 0 || nb !== dataLen) encrypted = new Uint8Array(data.buffer, data.byteOffset + p, nb);
					else encrypted = data;
					if (nb === this._len) this._packet = encrypted;
					else {
						if (!this._packet) this._packet = Buffer.allocUnsafe(this._len);
						this._packet.set(encrypted, this._pktLen);
					}
					p += nb;
					this._pktLen += nb;
					if (this._pktLen < this._len || p >= dataLen) return;
				}
				{
					const nb = Math.min(16 - this._macPos, dataLen - p);
					if (p !== 0 || nb !== dataLen) this._mac.set(new Uint8Array(data.buffer, data.byteOffset + p, nb), this._macPos);
					else this._mac.set(data, this._macPos);
					p += nb;
					this._macPos += nb;
					if (this._macPos < 16) return;
				}
				POLY1305_OUT_COMPUTE[0] = 0;
				writeUInt32BE(POLY1305_OUT_COMPUTE, this.inSeqno, 12);
				const polyKey = createCipheriv("chacha20", this._decKeyMain, POLY1305_OUT_COMPUTE).update(POLY1305_ZEROS);
				poly1305_auth(POLY1305_RESULT_MALLOC, this._lenBuf, 4, this._packet, this._packet.length, polyKey);
				this._calcMac.set(new Uint8Array(POLY1305_WASM_MODULE.HEAPU8.buffer, POLY1305_RESULT_MALLOC, 16), 0);
				if (!timingSafeEqual(this._calcMac, this._mac)) throw new Error("Invalid MAC");
				POLY1305_OUT_COMPUTE[0] = 1;
				const packet = createDecipheriv("chacha20", this._decKeyMain, POLY1305_OUT_COMPUTE).update(this._packet);
				const payload = new FastBuffer(packet.buffer, packet.byteOffset + 1, packet.length - packet[0] - 1);
				this.inSeqno = this.inSeqno + 1 >>> 0;
				this._len = 0;
				this._lenPos = 0;
				this._packet = null;
				this._pktLen = 0;
				this._macPos = 0;
				{
					const ret = this._onPayload(payload);
					if (ret !== void 0) return ret === false ? p : ret;
				}
			}
		}
	};
	var ChaChaPolyDecipherBinding = class {
		constructor(config) {
			const dec = config.inbound;
			this.inSeqno = dec.seqno;
			this._onPayload = dec.onPayload;
			this._instance = new ChaChaPolyDecipher(dec.decipherKey);
			this._len = 0;
			this._lenBuf = Buffer.alloc(4);
			this._lenPos = 0;
			this._packet = null;
			this._pktLen = 0;
			this._mac = Buffer.allocUnsafe(16);
			this._macPos = 0;
		}
		free() {
			this._instance.free();
		}
		decrypt(data, p, dataLen) {
			while (p < dataLen) {
				if (this._lenPos < 4) {
					let nb = Math.min(4 - this._lenPos, dataLen - p);
					while (nb--) this._lenBuf[this._lenPos++] = data[p++];
					if (this._lenPos < 4) return;
					this._len = this._instance.decryptLen(this._lenBuf, this.inSeqno);
					if (this._len > MAX_PACKET_SIZE || this._len < 8 || (this._len & 7) !== 0) throw new Error("Bad packet length");
					if (p >= dataLen) return;
				}
				if (this._pktLen < this._len) {
					const nb = Math.min(this._len - this._pktLen, dataLen - p);
					let encrypted;
					if (p !== 0 || nb !== dataLen) encrypted = new Uint8Array(data.buffer, data.byteOffset + p, nb);
					else encrypted = data;
					if (nb === this._len) this._packet = encrypted;
					else {
						if (!this._packet) this._packet = Buffer.allocUnsafe(this._len);
						this._packet.set(encrypted, this._pktLen);
					}
					p += nb;
					this._pktLen += nb;
					if (this._pktLen < this._len || p >= dataLen) return;
				}
				{
					const nb = Math.min(16 - this._macPos, dataLen - p);
					if (p !== 0 || nb !== dataLen) this._mac.set(new Uint8Array(data.buffer, data.byteOffset + p, nb), this._macPos);
					else this._mac.set(data, this._macPos);
					p += nb;
					this._macPos += nb;
					if (this._macPos < 16) return;
				}
				this._instance.decrypt(this._packet, this._mac, this.inSeqno);
				const payload = new FastBuffer(this._packet.buffer, this._packet.byteOffset + 1, this._packet.length - this._packet[0] - 1);
				this.inSeqno = this.inSeqno + 1 >>> 0;
				this._len = 0;
				this._lenPos = 0;
				this._packet = null;
				this._pktLen = 0;
				this._macPos = 0;
				{
					const ret = this._onPayload(payload);
					if (ret !== void 0) return ret === false ? p : ret;
				}
			}
		}
	};
	var AESGCMDecipherNative = class {
		constructor(config) {
			const dec = config.inbound;
			this.inSeqno = dec.seqno;
			this._onPayload = dec.onPayload;
			this._decipherInstance = null;
			this._decipherSSLName = dec.decipherInfo.sslName;
			this._decipherKey = dec.decipherKey;
			this._decipherIV = dec.decipherIV;
			this._len = 0;
			this._lenBytes = 0;
			this._packet = null;
			this._packetPos = 0;
			this._pktLen = 0;
			this._tag = Buffer.allocUnsafe(16);
			this._tagPos = 0;
		}
		free() {}
		decrypt(data, p, dataLen) {
			while (p < dataLen) {
				if (this._lenBytes < 4) {
					let nb = Math.min(4 - this._lenBytes, dataLen - p);
					this._lenBytes += nb;
					while (nb--) this._len = (this._len << 8) + data[p++];
					if (this._lenBytes < 4) return;
					if (this._len + 20 > MAX_PACKET_SIZE || this._len < 16 || (this._len & 15) !== 0) throw new Error("Bad packet length");
					this._decipherInstance = createDecipheriv(this._decipherSSLName, this._decipherKey, this._decipherIV);
					this._decipherInstance.setAutoPadding(false);
					this._decipherInstance.setAAD(intToBytes(this._len));
				}
				if (this._pktLen < this._len) {
					if (p >= dataLen) return;
					const nb = Math.min(this._len - this._pktLen, dataLen - p);
					let decrypted;
					if (p !== 0 || nb !== dataLen) decrypted = this._decipherInstance.update(new Uint8Array(data.buffer, data.byteOffset + p, nb));
					else decrypted = this._decipherInstance.update(data);
					if (decrypted.length) {
						if (nb === this._len) this._packet = decrypted;
						else {
							if (!this._packet) this._packet = Buffer.allocUnsafe(this._len);
							this._packet.set(decrypted, this._packetPos);
						}
						this._packetPos += decrypted.length;
					}
					p += nb;
					this._pktLen += nb;
					if (this._pktLen < this._len || p >= dataLen) return;
				}
				{
					const nb = Math.min(16 - this._tagPos, dataLen - p);
					if (p !== 0 || nb !== dataLen) this._tag.set(new Uint8Array(data.buffer, data.byteOffset + p, nb), this._tagPos);
					else this._tag.set(data, this._tagPos);
					p += nb;
					this._tagPos += nb;
					if (this._tagPos < 16) return;
				}
				{
					this._decipherInstance.setAuthTag(this._tag);
					const decrypted = this._decipherInstance.final();
					if (decrypted.length) {
						if (this._packet) this._packet.set(decrypted, this._packetPos);
						else this._packet = decrypted;
					}
				}
				const payload = !this._packet ? EMPTY_BUFFER : new FastBuffer(this._packet.buffer, this._packet.byteOffset + 1, this._packet.length - this._packet[0] - 1);
				this.inSeqno = this.inSeqno + 1 >>> 0;
				ivIncrement(this._decipherIV);
				this._len = 0;
				this._lenBytes = 0;
				this._packet = null;
				this._packetPos = 0;
				this._pktLen = 0;
				this._tagPos = 0;
				{
					const ret = this._onPayload(payload);
					if (ret !== void 0) return ret === false ? p : ret;
				}
			}
		}
	};
	var AESGCMDecipherBinding = class {
		constructor(config) {
			const dec = config.inbound;
			this.inSeqno = dec.seqno;
			this._onPayload = dec.onPayload;
			this._instance = new AESGCMDecipher(dec.decipherInfo.sslName, dec.decipherKey, dec.decipherIV);
			this._len = 0;
			this._lenBytes = 0;
			this._packet = null;
			this._pktLen = 0;
			this._tag = Buffer.allocUnsafe(16);
			this._tagPos = 0;
		}
		free() {}
		decrypt(data, p, dataLen) {
			while (p < dataLen) {
				if (this._lenBytes < 4) {
					let nb = Math.min(4 - this._lenBytes, dataLen - p);
					this._lenBytes += nb;
					while (nb--) this._len = (this._len << 8) + data[p++];
					if (this._lenBytes < 4) return;
					if (this._len + 20 > MAX_PACKET_SIZE || this._len < 16 || (this._len & 15) !== 0) throw new Error(`Bad packet length: ${this._len}`);
				}
				if (this._pktLen < this._len) {
					if (p >= dataLen) return;
					const nb = Math.min(this._len - this._pktLen, dataLen - p);
					let encrypted;
					if (p !== 0 || nb !== dataLen) encrypted = new Uint8Array(data.buffer, data.byteOffset + p, nb);
					else encrypted = data;
					if (nb === this._len) this._packet = encrypted;
					else {
						if (!this._packet) this._packet = Buffer.allocUnsafe(this._len);
						this._packet.set(encrypted, this._pktLen);
					}
					p += nb;
					this._pktLen += nb;
					if (this._pktLen < this._len || p >= dataLen) return;
				}
				{
					const nb = Math.min(16 - this._tagPos, dataLen - p);
					if (p !== 0 || nb !== dataLen) this._tag.set(new Uint8Array(data.buffer, data.byteOffset + p, nb), this._tagPos);
					else this._tag.set(data, this._tagPos);
					p += nb;
					this._tagPos += nb;
					if (this._tagPos < 16) return;
				}
				this._instance.decrypt(this._packet, this._len, this._tag);
				const payload = new FastBuffer(this._packet.buffer, this._packet.byteOffset + 1, this._packet.length - this._packet[0] - 1);
				this.inSeqno = this.inSeqno + 1 >>> 0;
				this._len = 0;
				this._lenBytes = 0;
				this._packet = null;
				this._pktLen = 0;
				this._tagPos = 0;
				{
					const ret = this._onPayload(payload);
					if (ret !== void 0) return ret === false ? p : ret;
				}
			}
		}
	};
	var GenericDecipherNative = class {
		constructor(config) {
			const dec = config.inbound;
			this.inSeqno = dec.seqno;
			this._onPayload = dec.onPayload;
			this._decipherInstance = createDecipheriv(dec.decipherInfo.sslName, dec.decipherKey, dec.decipherIV);
			this._decipherInstance.setAutoPadding(false);
			this._block = Buffer.allocUnsafe(dec.macInfo.isETM ? 4 : dec.decipherInfo.blockLen);
			this._blockSize = dec.decipherInfo.blockLen;
			this._blockPos = 0;
			this._len = 0;
			this._packet = null;
			this._packetPos = 0;
			this._pktLen = 0;
			this._mac = Buffer.allocUnsafe(dec.macInfo.actualLen);
			this._macPos = 0;
			this._macSSLName = dec.macInfo.sslName;
			this._macKey = dec.macKey;
			this._macActualLen = dec.macInfo.actualLen;
			this._macETM = dec.macInfo.isETM;
			this._macInstance = null;
			const discardLen = dec.decipherInfo.discardLen;
			if (discardLen) {
				let discard = DISCARD_CACHE.get(discardLen);
				if (discard === void 0) {
					discard = Buffer.alloc(discardLen);
					DISCARD_CACHE.set(discardLen, discard);
				}
				this._decipherInstance.update(discard);
			}
		}
		free() {}
		decrypt(data, p, dataLen) {
			while (p < dataLen) {
				if (this._blockPos < this._block.length) {
					const nb = Math.min(this._block.length - this._blockPos, dataLen - p);
					if (p !== 0 || nb !== dataLen || nb < data.length) this._block.set(new Uint8Array(data.buffer, data.byteOffset + p, nb), this._blockPos);
					else this._block.set(data, this._blockPos);
					p += nb;
					this._blockPos += nb;
					if (this._blockPos < this._block.length) return;
					let decrypted;
					let need;
					if (this._macETM) this._len = need = readUInt32BE(this._block, 0);
					else {
						decrypted = this._decipherInstance.update(this._block);
						this._len = readUInt32BE(decrypted, 0);
						need = 4 + this._len - this._blockSize;
					}
					if (this._len > MAX_PACKET_SIZE || this._len < 5 || (need & this._blockSize - 1) !== 0) throw new Error("Bad packet length");
					this._macInstance = createHmac(this._macSSLName, this._macKey);
					writeUInt32BE(BUF_INT, this.inSeqno, 0);
					this._macInstance.update(BUF_INT);
					if (this._macETM) this._macInstance.update(this._block);
					else {
						this._macInstance.update(new Uint8Array(decrypted.buffer, decrypted.byteOffset, 4));
						this._pktLen = decrypted.length - 4;
						this._packetPos = this._pktLen;
						this._packet = Buffer.allocUnsafe(this._len);
						this._packet.set(new Uint8Array(decrypted.buffer, decrypted.byteOffset + 4, this._packetPos), 0);
					}
					if (p >= dataLen) return;
				}
				if (this._pktLen < this._len) {
					const nb = Math.min(this._len - this._pktLen, dataLen - p);
					let encrypted;
					if (p !== 0 || nb !== dataLen) encrypted = new Uint8Array(data.buffer, data.byteOffset + p, nb);
					else encrypted = data;
					if (this._macETM) this._macInstance.update(encrypted);
					const decrypted = this._decipherInstance.update(encrypted);
					if (decrypted.length) {
						if (nb === this._len) this._packet = decrypted;
						else {
							if (!this._packet) this._packet = Buffer.allocUnsafe(this._len);
							this._packet.set(decrypted, this._packetPos);
						}
						this._packetPos += decrypted.length;
					}
					p += nb;
					this._pktLen += nb;
					if (this._pktLen < this._len || p >= dataLen) return;
				}
				{
					const nb = Math.min(this._macActualLen - this._macPos, dataLen - p);
					if (p !== 0 || nb !== dataLen) this._mac.set(new Uint8Array(data.buffer, data.byteOffset + p, nb), this._macPos);
					else this._mac.set(data, this._macPos);
					p += nb;
					this._macPos += nb;
					if (this._macPos < this._macActualLen) return;
				}
				if (!this._macETM) this._macInstance.update(this._packet);
				let calculated = this._macInstance.digest();
				if (this._macActualLen < calculated.length) calculated = new Uint8Array(calculated.buffer, calculated.byteOffset, this._macActualLen);
				if (!timingSafeEquals(calculated, this._mac)) throw new Error("Invalid MAC");
				const payload = new FastBuffer(this._packet.buffer, this._packet.byteOffset + 1, this._packet.length - this._packet[0] - 1);
				this.inSeqno = this.inSeqno + 1 >>> 0;
				this._blockPos = 0;
				this._len = 0;
				this._packet = null;
				this._packetPos = 0;
				this._pktLen = 0;
				this._macPos = 0;
				this._macInstance = null;
				{
					const ret = this._onPayload(payload);
					if (ret !== void 0) return ret === false ? p : ret;
				}
			}
		}
	};
	var GenericDecipherBinding = class {
		constructor(config) {
			const dec = config.inbound;
			this.inSeqno = dec.seqno;
			this._onPayload = dec.onPayload;
			this._instance = new GenericDecipher(dec.decipherInfo.sslName, dec.decipherKey, dec.decipherIV, dec.macInfo.sslName, dec.macKey, dec.macInfo.isETM, dec.macInfo.actualLen);
			this._block = Buffer.allocUnsafe(dec.macInfo.isETM || dec.decipherInfo.stream ? 4 : dec.decipherInfo.blockLen);
			this._blockPos = 0;
			this._len = 0;
			this._packet = null;
			this._pktLen = 0;
			this._mac = Buffer.allocUnsafe(dec.macInfo.actualLen);
			this._macPos = 0;
			this._macActualLen = dec.macInfo.actualLen;
			this._macETM = dec.macInfo.isETM;
		}
		free() {
			this._instance.free();
		}
		decrypt(data, p, dataLen) {
			while (p < dataLen) {
				if (this._blockPos < this._block.length) {
					const nb = Math.min(this._block.length - this._blockPos, dataLen - p);
					if (p !== 0 || nb !== dataLen || nb < data.length) this._block.set(new Uint8Array(data.buffer, data.byteOffset + p, nb), this._blockPos);
					else this._block.set(data, this._blockPos);
					p += nb;
					this._blockPos += nb;
					if (this._blockPos < this._block.length) return;
					let need;
					if (this._macETM) this._len = need = readUInt32BE(this._block, 0);
					else {
						this._instance.decryptBlock(this._block);
						this._len = readUInt32BE(this._block, 0);
						need = 4 + this._len - this._block.length;
					}
					if (this._len > MAX_PACKET_SIZE || this._len < 5 || (need & this._block.length - 1) !== 0) throw new Error("Bad packet length");
					if (!this._macETM) {
						this._pktLen = this._block.length - 4;
						if (this._pktLen) {
							this._packet = Buffer.allocUnsafe(this._len);
							this._packet.set(new Uint8Array(this._block.buffer, this._block.byteOffset + 4, this._pktLen), 0);
						}
					}
					if (p >= dataLen) return;
				}
				if (this._pktLen < this._len) {
					const nb = Math.min(this._len - this._pktLen, dataLen - p);
					let encrypted;
					if (p !== 0 || nb !== dataLen) encrypted = new Uint8Array(data.buffer, data.byteOffset + p, nb);
					else encrypted = data;
					if (nb === this._len) this._packet = encrypted;
					else {
						if (!this._packet) this._packet = Buffer.allocUnsafe(this._len);
						this._packet.set(encrypted, this._pktLen);
					}
					p += nb;
					this._pktLen += nb;
					if (this._pktLen < this._len || p >= dataLen) return;
				}
				{
					const nb = Math.min(this._macActualLen - this._macPos, dataLen - p);
					if (p !== 0 || nb !== dataLen) this._mac.set(new Uint8Array(data.buffer, data.byteOffset + p, nb), this._macPos);
					else this._mac.set(data, this._macPos);
					p += nb;
					this._macPos += nb;
					if (this._macPos < this._macActualLen) return;
				}
				this._instance.decrypt(this._packet, this.inSeqno, this._block, this._mac);
				const payload = new FastBuffer(this._packet.buffer, this._packet.byteOffset + 1, this._packet.length - this._packet[0] - 1);
				this.inSeqno = this.inSeqno + 1 >>> 0;
				this._blockPos = 0;
				this._len = 0;
				this._packet = null;
				this._pktLen = 0;
				this._macPos = 0;
				this._macInstance = null;
				{
					const ret = this._onPayload(payload);
					if (ret !== void 0) return ret === false ? p : ret;
				}
			}
		}
	};
	function ivIncrement(iv) {
		++iv[11] >>> 8 && ++iv[10] >>> 8 && ++iv[9] >>> 8 && ++iv[8] >>> 8 && ++iv[7] >>> 8 && ++iv[6] >>> 8 && ++iv[5] >>> 8 && ++iv[4] >>> 8;
	}
	const intToBytes = (() => {
		const ret = Buffer.alloc(4);
		return (n) => {
			ret[0] = n >>> 24;
			ret[1] = n >>> 16;
			ret[2] = n >>> 8;
			ret[3] = n;
			return ret;
		};
	})();
	function timingSafeEquals(a, b) {
		if (a.length !== b.length) {
			timingSafeEqual(a, a);
			return false;
		}
		return timingSafeEqual(a, b);
	}
	function createCipher(config) {
		if (typeof config !== "object" || config === null) throw new Error("Invalid config");
		if (typeof config.outbound !== "object" || config.outbound === null) throw new Error("Invalid outbound");
		const outbound = config.outbound;
		if (typeof outbound.onWrite !== "function") throw new Error("Invalid outbound.onWrite");
		if (typeof outbound.cipherInfo !== "object" || outbound.cipherInfo === null) throw new Error("Invalid outbound.cipherInfo");
		if (!Buffer.isBuffer(outbound.cipherKey) || outbound.cipherKey.length !== outbound.cipherInfo.keyLen) throw new Error("Invalid outbound.cipherKey");
		if (outbound.cipherInfo.ivLen && (!Buffer.isBuffer(outbound.cipherIV) || outbound.cipherIV.length !== outbound.cipherInfo.ivLen)) throw new Error("Invalid outbound.cipherIV");
		if (typeof outbound.seqno !== "number" || outbound.seqno < 0 || outbound.seqno > MAX_SEQNO) throw new Error("Invalid outbound.seqno");
		const forceNative = !!outbound.forceNative;
		switch (outbound.cipherInfo.sslName) {
			case "aes-128-gcm":
			case "aes-256-gcm": return AESGCMCipher && !forceNative ? new AESGCMCipherBinding(config) : new AESGCMCipherNative(config);
			case "chacha20": return ChaChaPolyCipher && !forceNative ? new ChaChaPolyCipherBinding(config) : new ChaChaPolyCipherNative(config);
			default:
				if (typeof outbound.macInfo !== "object" || outbound.macInfo === null) throw new Error("Invalid outbound.macInfo");
				if (!Buffer.isBuffer(outbound.macKey) || outbound.macKey.length !== outbound.macInfo.len) throw new Error("Invalid outbound.macKey");
				return GenericCipher && !forceNative ? new GenericCipherBinding(config) : new GenericCipherNative(config);
		}
	}
	function createDecipher(config) {
		if (typeof config !== "object" || config === null) throw new Error("Invalid config");
		if (typeof config.inbound !== "object" || config.inbound === null) throw new Error("Invalid inbound");
		const inbound = config.inbound;
		if (typeof inbound.onPayload !== "function") throw new Error("Invalid inbound.onPayload");
		if (typeof inbound.decipherInfo !== "object" || inbound.decipherInfo === null) throw new Error("Invalid inbound.decipherInfo");
		if (!Buffer.isBuffer(inbound.decipherKey) || inbound.decipherKey.length !== inbound.decipherInfo.keyLen) throw new Error("Invalid inbound.decipherKey");
		if (inbound.decipherInfo.ivLen && (!Buffer.isBuffer(inbound.decipherIV) || inbound.decipherIV.length !== inbound.decipherInfo.ivLen)) throw new Error("Invalid inbound.decipherIV");
		if (typeof inbound.seqno !== "number" || inbound.seqno < 0 || inbound.seqno > MAX_SEQNO) throw new Error("Invalid inbound.seqno");
		const forceNative = !!inbound.forceNative;
		switch (inbound.decipherInfo.sslName) {
			case "aes-128-gcm":
			case "aes-256-gcm": return AESGCMDecipher && !forceNative ? new AESGCMDecipherBinding(config) : new AESGCMDecipherNative(config);
			case "chacha20": return ChaChaPolyDecipher && !forceNative ? new ChaChaPolyDecipherBinding(config) : new ChaChaPolyDecipherNative(config);
			default:
				if (typeof inbound.macInfo !== "object" || inbound.macInfo === null) throw new Error("Invalid inbound.macInfo");
				if (!Buffer.isBuffer(inbound.macKey) || inbound.macKey.length !== inbound.macInfo.len) throw new Error("Invalid inbound.macKey");
				return GenericDecipher && !forceNative ? new GenericDecipherBinding(config) : new GenericDecipherNative(config);
		}
	}
	module.exports = {
		CIPHER_INFO,
		MAC_INFO,
		bindingAvailable: !!binding,
		init: (() => {
			return new Promise(async (resolve, reject) => {
				try {
					POLY1305_WASM_MODULE = await require_poly1305()();
					POLY1305_RESULT_MALLOC = POLY1305_WASM_MODULE._malloc(16);
					poly1305_auth = POLY1305_WASM_MODULE.cwrap("poly1305_auth", null, [
						"number",
						"array",
						"number",
						"array",
						"number",
						"array"
					]);
				} catch (ex) {
					return reject(ex);
				}
				resolve();
			});
		})(),
		NullCipher,
		createCipher,
		NullDecipher,
		createDecipher
	};
}));
// node_modules/ssh2/lib/protocol/keyParser.js
var require_keyParser = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const { createDecipheriv, createECDH, createHash, createHmac, createSign, createVerify, getCiphers, sign: sign_, verify: verify_ } = __require("crypto");
	const supportedOpenSSLCiphers = getCiphers();
	const { Ber } = require_lib$2();
	const bcrypt_pbkdf = require_bcrypt_pbkdf().pbkdf;
	const { CIPHER_INFO } = require_crypto();
	const { eddsaSupported, SUPPORTED_CIPHER } = require_constants();
	const { bufferSlice, makeBufferParser, readString, readUInt32BE, writeUInt32BE } = require_utils$1();
	const SYM_HASH_ALGO = Symbol("Hash Algorithm");
	const SYM_PRIV_PEM = Symbol("Private key PEM");
	const SYM_PUB_PEM = Symbol("Public key PEM");
	const SYM_PUB_SSH = Symbol("Public key SSH");
	const SYM_DECRYPTED = Symbol("Decrypted Key");
	const CIPHER_INFO_OPENSSL = Object.create(null);
	{
		const keys = Object.keys(CIPHER_INFO);
		for (let i = 0; i < keys.length; ++i) {
			const cipherName = CIPHER_INFO[keys[i]].sslName;
			if (!cipherName || CIPHER_INFO_OPENSSL[cipherName]) continue;
			CIPHER_INFO_OPENSSL[cipherName] = CIPHER_INFO[keys[i]];
		}
	}
	const binaryKeyParser = makeBufferParser();
	function makePEM(type, data) {
		data = data.base64Slice(0, data.length);
		let formatted = data.replace(/.{64}/g, "$&\n");
		if (data.length & 63) formatted += "\n";
		return `-----BEGIN ${type} KEY-----\n${formatted}-----END ${type} KEY-----`;
	}
	function combineBuffers(buf1, buf2) {
		const result = Buffer.allocUnsafe(buf1.length + buf2.length);
		result.set(buf1, 0);
		result.set(buf2, buf1.length);
		return result;
	}
	function skipFields(buf, nfields) {
		const bufLen = buf.length;
		let pos = buf._pos || 0;
		for (let i = 0; i < nfields; ++i) {
			const left = bufLen - pos;
			if (pos >= bufLen || left < 4) return false;
			const len = readUInt32BE(buf, pos);
			if (left < 4 + len) return false;
			pos += 4 + len;
		}
		buf._pos = pos;
		return true;
	}
	function genOpenSSLRSAPub(n, e) {
		const asnWriter = new Ber.Writer();
		asnWriter.startSequence();
		asnWriter.startSequence();
		asnWriter.writeOID("1.2.840.113549.1.1.1");
		asnWriter.writeNull();
		asnWriter.endSequence();
		asnWriter.startSequence(Ber.BitString);
		asnWriter.writeByte(0);
		asnWriter.startSequence();
		asnWriter.writeBuffer(n, Ber.Integer);
		asnWriter.writeBuffer(e, Ber.Integer);
		asnWriter.endSequence();
		asnWriter.endSequence();
		asnWriter.endSequence();
		return makePEM("PUBLIC", asnWriter.buffer);
	}
	function genOpenSSHRSAPub(n, e) {
		const publicKey = Buffer.allocUnsafe(15 + e.length + 4 + n.length);
		writeUInt32BE(publicKey, 7, 0);
		publicKey.utf8Write("ssh-rsa", 4, 7);
		let i = 11;
		writeUInt32BE(publicKey, e.length, i);
		publicKey.set(e, i += 4);
		writeUInt32BE(publicKey, n.length, i += e.length);
		publicKey.set(n, i + 4);
		return publicKey;
	}
	const genOpenSSLRSAPriv = (() => {
		function genRSAASN1Buf(n, e, d, p, q, dmp1, dmq1, iqmp) {
			const asnWriter = new Ber.Writer();
			asnWriter.startSequence();
			asnWriter.writeInt(0, Ber.Integer);
			asnWriter.writeBuffer(n, Ber.Integer);
			asnWriter.writeBuffer(e, Ber.Integer);
			asnWriter.writeBuffer(d, Ber.Integer);
			asnWriter.writeBuffer(p, Ber.Integer);
			asnWriter.writeBuffer(q, Ber.Integer);
			asnWriter.writeBuffer(dmp1, Ber.Integer);
			asnWriter.writeBuffer(dmq1, Ber.Integer);
			asnWriter.writeBuffer(iqmp, Ber.Integer);
			asnWriter.endSequence();
			return asnWriter.buffer;
		}
		function bigIntFromBuffer(buf) {
			return BigInt(`0x${buf.hexSlice(0, buf.length)}`);
		}
		function bigIntToBuffer(bn) {
			let hex = bn.toString(16);
			if ((hex.length & 1) !== 0) hex = `0${hex}`;
			else {
				const sigbit = hex.charCodeAt(0);
				if (sigbit === 56 || sigbit === 57 || sigbit >= 97 && sigbit <= 102) hex = `00${hex}`;
			}
			return Buffer.from(hex, "hex");
		}
		return function genOpenSSLRSAPriv(n, e, d, iqmp, p, q) {
			const bn_d = bigIntFromBuffer(d);
			return makePEM("RSA PRIVATE", genRSAASN1Buf(n, e, d, p, q, bigIntToBuffer(bn_d % (bigIntFromBuffer(p) - 1n)), bigIntToBuffer(bn_d % (bigIntFromBuffer(q) - 1n)), iqmp));
		};
	})();
	function genOpenSSLDSAPub(p, q, g, y) {
		const asnWriter = new Ber.Writer();
		asnWriter.startSequence();
		asnWriter.startSequence();
		asnWriter.writeOID("1.2.840.10040.4.1");
		asnWriter.startSequence();
		asnWriter.writeBuffer(p, Ber.Integer);
		asnWriter.writeBuffer(q, Ber.Integer);
		asnWriter.writeBuffer(g, Ber.Integer);
		asnWriter.endSequence();
		asnWriter.endSequence();
		asnWriter.startSequence(Ber.BitString);
		asnWriter.writeByte(0);
		asnWriter.writeBuffer(y, Ber.Integer);
		asnWriter.endSequence();
		asnWriter.endSequence();
		return makePEM("PUBLIC", asnWriter.buffer);
	}
	function genOpenSSHDSAPub(p, q, g, y) {
		const publicKey = Buffer.allocUnsafe(15 + p.length + 4 + q.length + 4 + g.length + 4 + y.length);
		writeUInt32BE(publicKey, 7, 0);
		publicKey.utf8Write("ssh-dss", 4, 7);
		let i = 11;
		writeUInt32BE(publicKey, p.length, i);
		publicKey.set(p, i += 4);
		writeUInt32BE(publicKey, q.length, i += p.length);
		publicKey.set(q, i += 4);
		writeUInt32BE(publicKey, g.length, i += q.length);
		publicKey.set(g, i += 4);
		writeUInt32BE(publicKey, y.length, i += g.length);
		publicKey.set(y, i + 4);
		return publicKey;
	}
	function genOpenSSLDSAPriv(p, q, g, y, x) {
		const asnWriter = new Ber.Writer();
		asnWriter.startSequence();
		asnWriter.writeInt(0, Ber.Integer);
		asnWriter.writeBuffer(p, Ber.Integer);
		asnWriter.writeBuffer(q, Ber.Integer);
		asnWriter.writeBuffer(g, Ber.Integer);
		asnWriter.writeBuffer(y, Ber.Integer);
		asnWriter.writeBuffer(x, Ber.Integer);
		asnWriter.endSequence();
		return makePEM("DSA PRIVATE", asnWriter.buffer);
	}
	function genOpenSSLEdPub(pub) {
		const asnWriter = new Ber.Writer();
		asnWriter.startSequence();
		asnWriter.startSequence();
		asnWriter.writeOID("1.3.101.112");
		asnWriter.endSequence();
		asnWriter.startSequence(Ber.BitString);
		asnWriter.writeByte(0);
		asnWriter._ensure(pub.length);
		asnWriter._buf.set(pub, asnWriter._offset);
		asnWriter._offset += pub.length;
		asnWriter.endSequence();
		asnWriter.endSequence();
		return makePEM("PUBLIC", asnWriter.buffer);
	}
	function genOpenSSHEdPub(pub) {
		const publicKey = Buffer.allocUnsafe(19 + pub.length);
		writeUInt32BE(publicKey, 11, 0);
		publicKey.utf8Write("ssh-ed25519", 4, 11);
		writeUInt32BE(publicKey, pub.length, 15);
		publicKey.set(pub, 19);
		return publicKey;
	}
	function genOpenSSLEdPriv(priv) {
		const asnWriter = new Ber.Writer();
		asnWriter.startSequence();
		asnWriter.writeInt(0, Ber.Integer);
		asnWriter.startSequence();
		asnWriter.writeOID("1.3.101.112");
		asnWriter.endSequence();
		asnWriter.startSequence(Ber.OctetString);
		asnWriter.writeBuffer(priv, Ber.OctetString);
		asnWriter.endSequence();
		asnWriter.endSequence();
		return makePEM("PRIVATE", asnWriter.buffer);
	}
	function genOpenSSLECDSAPub(oid, Q) {
		const asnWriter = new Ber.Writer();
		asnWriter.startSequence();
		asnWriter.startSequence();
		asnWriter.writeOID("1.2.840.10045.2.1");
		asnWriter.writeOID(oid);
		asnWriter.endSequence();
		asnWriter.startSequence(Ber.BitString);
		asnWriter.writeByte(0);
		asnWriter._ensure(Q.length);
		asnWriter._buf.set(Q, asnWriter._offset);
		asnWriter._offset += Q.length;
		asnWriter.endSequence();
		asnWriter.endSequence();
		return makePEM("PUBLIC", asnWriter.buffer);
	}
	function genOpenSSHECDSAPub(oid, Q) {
		let curveName;
		switch (oid) {
			case "1.2.840.10045.3.1.7":
				curveName = "nistp256";
				break;
			case "1.3.132.0.34":
				curveName = "nistp384";
				break;
			case "1.3.132.0.35":
				curveName = "nistp521";
				break;
			default: return;
		}
		const publicKey = Buffer.allocUnsafe(39 + Q.length);
		writeUInt32BE(publicKey, 19, 0);
		publicKey.utf8Write(`ecdsa-sha2-${curveName}`, 4, 19);
		writeUInt32BE(publicKey, 8, 23);
		publicKey.utf8Write(curveName, 27, 8);
		writeUInt32BE(publicKey, Q.length, 35);
		publicKey.set(Q, 39);
		return publicKey;
	}
	function genOpenSSLECDSAPriv(oid, pub, priv) {
		const asnWriter = new Ber.Writer();
		asnWriter.startSequence();
		asnWriter.writeInt(1, Ber.Integer);
		asnWriter.writeBuffer(priv, Ber.OctetString);
		asnWriter.startSequence(160);
		asnWriter.writeOID(oid);
		asnWriter.endSequence();
		asnWriter.startSequence(161);
		asnWriter.startSequence(Ber.BitString);
		asnWriter.writeByte(0);
		asnWriter._ensure(pub.length);
		asnWriter._buf.set(pub, asnWriter._offset);
		asnWriter._offset += pub.length;
		asnWriter.endSequence();
		asnWriter.endSequence();
		asnWriter.endSequence();
		return makePEM("EC PRIVATE", asnWriter.buffer);
	}
	function genOpenSSLECDSAPubFromPriv(curveName, priv) {
		const tempECDH = createECDH(curveName);
		tempECDH.setPrivateKey(priv);
		return tempECDH.getPublicKey();
	}
	const BaseKey = {
		sign: (() => {
			if (typeof sign_ === "function") return function sign(data, algo) {
				const pem = this[SYM_PRIV_PEM];
				if (pem === null) return /* @__PURE__ */ new Error("No private key available");
				if (!algo || typeof algo !== "string") algo = this[SYM_HASH_ALGO];
				try {
					return sign_(algo, data, pem);
				} catch (ex) {
					return ex;
				}
			};
			return function sign(data, algo) {
				const pem = this[SYM_PRIV_PEM];
				if (pem === null) return /* @__PURE__ */ new Error("No private key available");
				if (!algo || typeof algo !== "string") algo = this[SYM_HASH_ALGO];
				const signature = createSign(algo);
				signature.update(data);
				try {
					return signature.sign(pem);
				} catch (ex) {
					return ex;
				}
			};
		})(),
		verify: (() => {
			if (typeof verify_ === "function") return function verify(data, signature, algo) {
				const pem = this[SYM_PUB_PEM];
				if (pem === null) return /* @__PURE__ */ new Error("No public key available");
				if (!algo || typeof algo !== "string") algo = this[SYM_HASH_ALGO];
				try {
					return verify_(algo, data, pem, signature);
				} catch (ex) {
					return ex;
				}
			};
			return function verify(data, signature, algo) {
				const pem = this[SYM_PUB_PEM];
				if (pem === null) return /* @__PURE__ */ new Error("No public key available");
				if (!algo || typeof algo !== "string") algo = this[SYM_HASH_ALGO];
				const verifier = createVerify(algo);
				verifier.update(data);
				try {
					return verifier.verify(pem, signature);
				} catch (ex) {
					return ex;
				}
			};
		})(),
		isPrivateKey: function isPrivateKey() {
			return this[SYM_PRIV_PEM] !== null;
		},
		getPrivatePEM: function getPrivatePEM() {
			return this[SYM_PRIV_PEM];
		},
		getPublicPEM: function getPublicPEM() {
			return this[SYM_PUB_PEM];
		},
		getPublicSSH: function getPublicSSH() {
			return this[SYM_PUB_SSH];
		},
		equals: function equals(key) {
			const parsed = parseKey(key);
			if (parsed instanceof Error) return false;
			return this.type === parsed.type && this[SYM_PRIV_PEM] === parsed[SYM_PRIV_PEM] && this[SYM_PUB_PEM] === parsed[SYM_PUB_PEM] && this[SYM_PUB_SSH].equals(parsed[SYM_PUB_SSH]);
		}
	};
	function OpenSSH_Private(type, comment, privPEM, pubPEM, pubSSH, algo, decrypted) {
		this.type = type;
		this.comment = comment;
		this[SYM_PRIV_PEM] = privPEM;
		this[SYM_PUB_PEM] = pubPEM;
		this[SYM_PUB_SSH] = pubSSH;
		this[SYM_HASH_ALGO] = algo;
		this[SYM_DECRYPTED] = decrypted;
	}
	OpenSSH_Private.prototype = BaseKey;
	{
		const regexp = /^-----BEGIN OPENSSH PRIVATE KEY-----(?:\r\n|\n)([\s\S]+)(?:\r\n|\n)-----END OPENSSH PRIVATE KEY-----$/;
		OpenSSH_Private.parse = (str, passphrase) => {
			const m = regexp.exec(str);
			if (m === null) return null;
			let ret;
			const data = Buffer.from(m[1], "base64");
			if (data.length < 31) return /* @__PURE__ */ new Error("Malformed OpenSSH private key");
			const magic = data.utf8Slice(0, 15);
			if (magic !== "openssh-key-v1\0") return /* @__PURE__ */ new Error(`Unsupported OpenSSH key magic: ${magic}`);
			const cipherName = readString(data, 15, true);
			if (cipherName === void 0) return /* @__PURE__ */ new Error("Malformed OpenSSH private key");
			if (cipherName !== "none" && SUPPORTED_CIPHER.indexOf(cipherName) === -1) return /* @__PURE__ */ new Error(`Unsupported cipher for OpenSSH key: ${cipherName}`);
			const kdfName = readString(data, data._pos, true);
			if (kdfName === void 0) return /* @__PURE__ */ new Error("Malformed OpenSSH private key");
			if (kdfName !== "none") {
				if (cipherName === "none") return /* @__PURE__ */ new Error("Malformed OpenSSH private key");
				if (kdfName !== "bcrypt") return /* @__PURE__ */ new Error(`Unsupported kdf name for OpenSSH key: ${kdfName}`);
				if (!passphrase) return /* @__PURE__ */ new Error("Encrypted private OpenSSH key detected, but no passphrase given");
			} else if (cipherName !== "none") return /* @__PURE__ */ new Error("Malformed OpenSSH private key");
			let encInfo;
			let cipherKey;
			let cipherIV;
			if (cipherName !== "none") encInfo = CIPHER_INFO[cipherName];
			const kdfOptions = readString(data, data._pos);
			if (kdfOptions === void 0) return /* @__PURE__ */ new Error("Malformed OpenSSH private key");
			if (kdfOptions.length) switch (kdfName) {
				case "none": return /* @__PURE__ */ new Error("Malformed OpenSSH private key");
				case "bcrypt": {
					const salt = readString(kdfOptions, 0);
					if (salt === void 0 || kdfOptions._pos + 4 > kdfOptions.length) return /* @__PURE__ */ new Error("Malformed OpenSSH private key");
					const rounds = readUInt32BE(kdfOptions, kdfOptions._pos);
					const gen = Buffer.allocUnsafe(encInfo.keyLen + encInfo.ivLen);
					if (bcrypt_pbkdf(passphrase, passphrase.length, salt, salt.length, gen, gen.length, rounds) !== 0) return /* @__PURE__ */ new Error("Failed to generate information to decrypt key");
					cipherKey = bufferSlice(gen, 0, encInfo.keyLen);
					cipherIV = bufferSlice(gen, encInfo.keyLen, gen.length);
					break;
				}
			}
			else if (kdfName !== "none") return /* @__PURE__ */ new Error("Malformed OpenSSH private key");
			if (data._pos + 3 >= data.length) return /* @__PURE__ */ new Error("Malformed OpenSSH private key");
			const keyCount = readUInt32BE(data, data._pos);
			data._pos += 4;
			if (keyCount > 0) {
				for (let i = 0; i < keyCount; ++i) {
					const pubData = readString(data, data._pos);
					if (pubData === void 0) return /* @__PURE__ */ new Error("Malformed OpenSSH private key");
					if (readString(pubData, 0, true) === void 0) return /* @__PURE__ */ new Error("Malformed OpenSSH private key");
				}
				let privBlob = readString(data, data._pos);
				if (privBlob === void 0) return /* @__PURE__ */ new Error("Malformed OpenSSH private key");
				if (cipherKey !== void 0) {
					if (privBlob.length < encInfo.blockLen || privBlob.length % encInfo.blockLen !== 0) return /* @__PURE__ */ new Error("Malformed OpenSSH private key");
					try {
						const options = { authTagLength: encInfo.authLen };
						const decipher = createDecipheriv(encInfo.sslName, cipherKey, cipherIV, options);
						decipher.setAutoPadding(false);
						if (encInfo.authLen > 0) {
							if (data.length - data._pos < encInfo.authLen) return /* @__PURE__ */ new Error("Malformed OpenSSH private key");
							decipher.setAuthTag(bufferSlice(data, data._pos, data._pos += encInfo.authLen));
						}
						privBlob = combineBuffers(decipher.update(privBlob), decipher.final());
					} catch (ex) {
						return ex;
					}
				}
				if (data._pos !== data.length) return /* @__PURE__ */ new Error("Malformed OpenSSH private key");
				ret = parseOpenSSHPrivKeys(privBlob, keyCount, cipherKey !== void 0);
			} else ret = [];
			if (ret instanceof Error) return ret;
			return ret[0];
		};
		function parseOpenSSHPrivKeys(data, nkeys, decrypted) {
			const keys = [];
			if (data.length < 8) return /* @__PURE__ */ new Error("Malformed OpenSSH private key");
			if (readUInt32BE(data, 0) !== readUInt32BE(data, 4)) {
				if (decrypted) return /* @__PURE__ */ new Error("OpenSSH key integrity check failed -- bad passphrase?");
				return /* @__PURE__ */ new Error("OpenSSH key integrity check failed");
			}
			data._pos = 8;
			let i;
			let oid;
			for (i = 0; i < nkeys; ++i) {
				let algo;
				let privPEM;
				let pubPEM;
				let pubSSH;
				const type = readString(data, data._pos, true);
				if (type === void 0) return /* @__PURE__ */ new Error("Malformed OpenSSH private key");
				switch (type) {
					case "ssh-rsa": {
						const n = readString(data, data._pos);
						if (n === void 0) return /* @__PURE__ */ new Error("Malformed OpenSSH private key");
						const e = readString(data, data._pos);
						if (e === void 0) return /* @__PURE__ */ new Error("Malformed OpenSSH private key");
						const d = readString(data, data._pos);
						if (d === void 0) return /* @__PURE__ */ new Error("Malformed OpenSSH private key");
						const iqmp = readString(data, data._pos);
						if (iqmp === void 0) return /* @__PURE__ */ new Error("Malformed OpenSSH private key");
						const p = readString(data, data._pos);
						if (p === void 0) return /* @__PURE__ */ new Error("Malformed OpenSSH private key");
						const q = readString(data, data._pos);
						if (q === void 0) return /* @__PURE__ */ new Error("Malformed OpenSSH private key");
						pubPEM = genOpenSSLRSAPub(n, e);
						pubSSH = genOpenSSHRSAPub(n, e);
						privPEM = genOpenSSLRSAPriv(n, e, d, iqmp, p, q);
						algo = "sha1";
						break;
					}
					case "ssh-dss": {
						const p = readString(data, data._pos);
						if (p === void 0) return /* @__PURE__ */ new Error("Malformed OpenSSH private key");
						const q = readString(data, data._pos);
						if (q === void 0) return /* @__PURE__ */ new Error("Malformed OpenSSH private key");
						const g = readString(data, data._pos);
						if (g === void 0) return /* @__PURE__ */ new Error("Malformed OpenSSH private key");
						const y = readString(data, data._pos);
						if (y === void 0) return /* @__PURE__ */ new Error("Malformed OpenSSH private key");
						const x = readString(data, data._pos);
						if (x === void 0) return /* @__PURE__ */ new Error("Malformed OpenSSH private key");
						pubPEM = genOpenSSLDSAPub(p, q, g, y);
						pubSSH = genOpenSSHDSAPub(p, q, g, y);
						privPEM = genOpenSSLDSAPriv(p, q, g, y, x);
						algo = "sha1";
						break;
					}
					case "ssh-ed25519": {
						if (!eddsaSupported) return /* @__PURE__ */ new Error(`Unsupported OpenSSH private key type: ${type}`);
						const edpub = readString(data, data._pos);
						if (edpub === void 0 || edpub.length !== 32) return /* @__PURE__ */ new Error("Malformed OpenSSH private key");
						const edpriv = readString(data, data._pos);
						if (edpriv === void 0 || edpriv.length !== 64) return /* @__PURE__ */ new Error("Malformed OpenSSH private key");
						pubPEM = genOpenSSLEdPub(edpub);
						pubSSH = genOpenSSHEdPub(edpub);
						privPEM = genOpenSSLEdPriv(bufferSlice(edpriv, 0, 32));
						algo = null;
						break;
					}
					case "ecdsa-sha2-nistp256":
						algo = "sha256";
						oid = "1.2.840.10045.3.1.7";
					case "ecdsa-sha2-nistp384": if (algo === void 0) {
						algo = "sha384";
						oid = "1.3.132.0.34";
					}
					case "ecdsa-sha2-nistp521": {
						if (algo === void 0) {
							algo = "sha512";
							oid = "1.3.132.0.35";
						}
						if (!skipFields(data, 1)) return /* @__PURE__ */ new Error("Malformed OpenSSH private key");
						const ecpub = readString(data, data._pos);
						if (ecpub === void 0) return /* @__PURE__ */ new Error("Malformed OpenSSH private key");
						const ecpriv = readString(data, data._pos);
						if (ecpriv === void 0) return /* @__PURE__ */ new Error("Malformed OpenSSH private key");
						pubPEM = genOpenSSLECDSAPub(oid, ecpub);
						pubSSH = genOpenSSHECDSAPub(oid, ecpub);
						privPEM = genOpenSSLECDSAPriv(oid, ecpub, ecpriv);
						break;
					}
					default: return /* @__PURE__ */ new Error(`Unsupported OpenSSH private key type: ${type}`);
				}
				const privComment = readString(data, data._pos, true);
				if (privComment === void 0) return /* @__PURE__ */ new Error("Malformed OpenSSH private key");
				keys.push(new OpenSSH_Private(type, privComment, privPEM, pubPEM, pubSSH, algo, decrypted));
			}
			let cnt = 0;
			for (i = data._pos; i < data.length; ++i) if (data[i] !== ++cnt % 255) return /* @__PURE__ */ new Error("Malformed OpenSSH private key");
			return keys;
		}
	}
	function OpenSSH_Old_Private(type, comment, privPEM, pubPEM, pubSSH, algo, decrypted) {
		this.type = type;
		this.comment = comment;
		this[SYM_PRIV_PEM] = privPEM;
		this[SYM_PUB_PEM] = pubPEM;
		this[SYM_PUB_SSH] = pubSSH;
		this[SYM_HASH_ALGO] = algo;
		this[SYM_DECRYPTED] = decrypted;
	}
	OpenSSH_Old_Private.prototype = BaseKey;
	{
		const regexp = /^-----BEGIN (RSA|DSA|EC) PRIVATE KEY-----(?:\r\n|\n)((?:[^:]+:\s*[\S].*(?:\r\n|\n))*)([\s\S]+)(?:\r\n|\n)-----END (RSA|DSA|EC) PRIVATE KEY-----$/;
		OpenSSH_Old_Private.parse = (str, passphrase) => {
			const m = regexp.exec(str);
			if (m === null) return null;
			let privBlob = Buffer.from(m[3], "base64");
			let headers = m[2];
			let decrypted = false;
			if (headers !== void 0) {
				headers = headers.split(/\r\n|\n/g);
				for (let i = 0; i < headers.length; ++i) {
					const header = headers[i];
					let sepIdx = header.indexOf(":");
					if (header.slice(0, sepIdx) === "DEK-Info") {
						const val = header.slice(sepIdx + 2);
						sepIdx = val.indexOf(",");
						if (sepIdx === -1) continue;
						const cipherName = val.slice(0, sepIdx).toLowerCase();
						if (supportedOpenSSLCiphers.indexOf(cipherName) === -1) return /* @__PURE__ */ new Error(`Cipher (${cipherName}) not supported for encrypted OpenSSH private key`);
						const encInfo = CIPHER_INFO_OPENSSL[cipherName];
						if (!encInfo) return /* @__PURE__ */ new Error(`Cipher (${cipherName}) not supported for encrypted OpenSSH private key`);
						const cipherIV = Buffer.from(val.slice(sepIdx + 1), "hex");
						if (cipherIV.length !== encInfo.ivLen) return /* @__PURE__ */ new Error("Malformed encrypted OpenSSH private key");
						if (!passphrase) return /* @__PURE__ */ new Error("Encrypted OpenSSH private key detected, but no passphrase given");
						const ivSlice = bufferSlice(cipherIV, 0, 8);
						let cipherKey = createHash("md5").update(passphrase).update(ivSlice).digest();
						while (cipherKey.length < encInfo.keyLen) cipherKey = combineBuffers(cipherKey, createHash("md5").update(cipherKey).update(passphrase).update(ivSlice).digest());
						if (cipherKey.length > encInfo.keyLen) cipherKey = bufferSlice(cipherKey, 0, encInfo.keyLen);
						try {
							const decipher = createDecipheriv(cipherName, cipherKey, cipherIV);
							decipher.setAutoPadding(false);
							privBlob = combineBuffers(decipher.update(privBlob), decipher.final());
							decrypted = true;
						} catch (ex) {
							return ex;
						}
					}
				}
			}
			let type;
			let privPEM;
			let pubPEM;
			let pubSSH;
			let algo;
			let reader;
			let errMsg = "Malformed OpenSSH private key";
			if (decrypted) errMsg += ". Bad passphrase?";
			switch (m[1]) {
				case "RSA":
					type = "ssh-rsa";
					privPEM = makePEM("RSA PRIVATE", privBlob);
					try {
						reader = new Ber.Reader(privBlob);
						reader.readSequence();
						reader.readInt();
						const n = reader.readString(Ber.Integer, true);
						if (n === null) return new Error(errMsg);
						const e = reader.readString(Ber.Integer, true);
						if (e === null) return new Error(errMsg);
						pubPEM = genOpenSSLRSAPub(n, e);
						pubSSH = genOpenSSHRSAPub(n, e);
					} catch {
						return new Error(errMsg);
					}
					algo = "sha1";
					break;
				case "DSA":
					type = "ssh-dss";
					privPEM = makePEM("DSA PRIVATE", privBlob);
					try {
						reader = new Ber.Reader(privBlob);
						reader.readSequence();
						reader.readInt();
						const p = reader.readString(Ber.Integer, true);
						if (p === null) return new Error(errMsg);
						const q = reader.readString(Ber.Integer, true);
						if (q === null) return new Error(errMsg);
						const g = reader.readString(Ber.Integer, true);
						if (g === null) return new Error(errMsg);
						const y = reader.readString(Ber.Integer, true);
						if (y === null) return new Error(errMsg);
						pubPEM = genOpenSSLDSAPub(p, q, g, y);
						pubSSH = genOpenSSHDSAPub(p, q, g, y);
					} catch {
						return new Error(errMsg);
					}
					algo = "sha1";
					break;
				case "EC": {
					let ecSSLName;
					let ecPriv;
					let ecOID;
					try {
						reader = new Ber.Reader(privBlob);
						reader.readSequence();
						reader.readInt();
						ecPriv = reader.readString(Ber.OctetString, true);
						reader.readByte();
						const offset = reader.readLength();
						if (offset !== null) {
							reader._offset = offset;
							ecOID = reader.readOID();
							if (ecOID === null) return new Error(errMsg);
							switch (ecOID) {
								case "1.2.840.10045.3.1.7":
									ecSSLName = "prime256v1";
									type = "ecdsa-sha2-nistp256";
									algo = "sha256";
									break;
								case "1.3.132.0.34":
									ecSSLName = "secp384r1";
									type = "ecdsa-sha2-nistp384";
									algo = "sha384";
									break;
								case "1.3.132.0.35":
									ecSSLName = "secp521r1";
									type = "ecdsa-sha2-nistp521";
									algo = "sha512";
									break;
								default: return /* @__PURE__ */ new Error(`Unsupported private key EC OID: ${ecOID}`);
							}
						} else return new Error(errMsg);
					} catch {
						return new Error(errMsg);
					}
					privPEM = makePEM("EC PRIVATE", privBlob);
					const pubBlob = genOpenSSLECDSAPubFromPriv(ecSSLName, ecPriv);
					pubPEM = genOpenSSLECDSAPub(ecOID, pubBlob);
					pubSSH = genOpenSSHECDSAPub(ecOID, pubBlob);
					break;
				}
			}
			return new OpenSSH_Old_Private(type, "", privPEM, pubPEM, pubSSH, algo, decrypted);
		};
	}
	function PPK_Private(type, comment, privPEM, pubPEM, pubSSH, algo, decrypted) {
		this.type = type;
		this.comment = comment;
		this[SYM_PRIV_PEM] = privPEM;
		this[SYM_PUB_PEM] = pubPEM;
		this[SYM_PUB_SSH] = pubSSH;
		this[SYM_HASH_ALGO] = algo;
		this[SYM_DECRYPTED] = decrypted;
	}
	PPK_Private.prototype = BaseKey;
	{
		const EMPTY_PASSPHRASE = Buffer.alloc(0);
		const PPK_IV = Buffer.from([
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0
		]);
		const PPK_PP1 = Buffer.from([
			0,
			0,
			0,
			0
		]);
		const PPK_PP2 = Buffer.from([
			0,
			0,
			0,
			1
		]);
		const regexp = /^PuTTY-User-Key-File-2: (ssh-(?:rsa|dss))\r?\nEncryption: (aes256-cbc|none)\r?\nComment: ([^\r\n]*)\r?\nPublic-Lines: \d+\r?\n([\s\S]+?)\r?\nPrivate-Lines: \d+\r?\n([\s\S]+?)\r?\nPrivate-MAC: ([^\r\n]+)/;
		PPK_Private.parse = (str, passphrase) => {
			const m = regexp.exec(str);
			if (m === null) return null;
			const cipherName = m[2];
			const encrypted = cipherName !== "none";
			if (encrypted && !passphrase) return /* @__PURE__ */ new Error("Encrypted PPK private key detected, but no passphrase given");
			let privBlob = Buffer.from(m[5], "base64");
			if (encrypted) {
				const encInfo = CIPHER_INFO[cipherName];
				let cipherKey = combineBuffers(createHash("sha1").update(PPK_PP1).update(passphrase).digest(), createHash("sha1").update(PPK_PP2).update(passphrase).digest());
				if (cipherKey.length > encInfo.keyLen) cipherKey = bufferSlice(cipherKey, 0, encInfo.keyLen);
				try {
					const decipher = createDecipheriv(encInfo.sslName, cipherKey, PPK_IV);
					decipher.setAutoPadding(false);
					privBlob = combineBuffers(decipher.update(privBlob), decipher.final());
				} catch (ex) {
					return ex;
				}
			}
			const type = m[1];
			const comment = m[3];
			const pubBlob = Buffer.from(m[4], "base64");
			const mac = m[6];
			const typeLen = type.length;
			const cipherNameLen = cipherName.length;
			const commentLen = Buffer.byteLength(comment);
			const pubLen = pubBlob.length;
			const privLen = privBlob.length;
			const macData = Buffer.allocUnsafe(4 + typeLen + 4 + cipherNameLen + 4 + commentLen + 4 + pubLen + 4 + privLen);
			let p = 0;
			writeUInt32BE(macData, typeLen, p);
			macData.utf8Write(type, p += 4, typeLen);
			writeUInt32BE(macData, cipherNameLen, p += typeLen);
			macData.utf8Write(cipherName, p += 4, cipherNameLen);
			writeUInt32BE(macData, commentLen, p += cipherNameLen);
			macData.utf8Write(comment, p += 4, commentLen);
			writeUInt32BE(macData, pubLen, p += commentLen);
			macData.set(pubBlob, p += 4);
			writeUInt32BE(macData, privLen, p += pubLen);
			macData.set(privBlob, p + 4);
			if (!passphrase) passphrase = EMPTY_PASSPHRASE;
			if (createHmac("sha1", createHash("sha1").update("putty-private-key-file-mac-key").update(passphrase).digest()).update(macData).digest("hex") !== mac) {
				if (encrypted) return /* @__PURE__ */ new Error("PPK private key integrity check failed -- bad passphrase?");
				return /* @__PURE__ */ new Error("PPK private key integrity check failed");
			}
			let pubPEM;
			let pubSSH;
			let privPEM;
			pubBlob._pos = 0;
			skipFields(pubBlob, 1);
			switch (type) {
				case "ssh-rsa": {
					const e = readString(pubBlob, pubBlob._pos);
					if (e === void 0) return /* @__PURE__ */ new Error("Malformed PPK public key");
					const n = readString(pubBlob, pubBlob._pos);
					if (n === void 0) return /* @__PURE__ */ new Error("Malformed PPK public key");
					const d = readString(privBlob, 0);
					if (d === void 0) return /* @__PURE__ */ new Error("Malformed PPK private key");
					const p = readString(privBlob, privBlob._pos);
					if (p === void 0) return /* @__PURE__ */ new Error("Malformed PPK private key");
					const q = readString(privBlob, privBlob._pos);
					if (q === void 0) return /* @__PURE__ */ new Error("Malformed PPK private key");
					const iqmp = readString(privBlob, privBlob._pos);
					if (iqmp === void 0) return /* @__PURE__ */ new Error("Malformed PPK private key");
					pubPEM = genOpenSSLRSAPub(n, e);
					pubSSH = genOpenSSHRSAPub(n, e);
					privPEM = genOpenSSLRSAPriv(n, e, d, iqmp, p, q);
					break;
				}
				case "ssh-dss": {
					const p = readString(pubBlob, pubBlob._pos);
					if (p === void 0) return /* @__PURE__ */ new Error("Malformed PPK public key");
					const q = readString(pubBlob, pubBlob._pos);
					if (q === void 0) return /* @__PURE__ */ new Error("Malformed PPK public key");
					const g = readString(pubBlob, pubBlob._pos);
					if (g === void 0) return /* @__PURE__ */ new Error("Malformed PPK public key");
					const y = readString(pubBlob, pubBlob._pos);
					if (y === void 0) return /* @__PURE__ */ new Error("Malformed PPK public key");
					const x = readString(privBlob, 0);
					if (x === void 0) return /* @__PURE__ */ new Error("Malformed PPK private key");
					pubPEM = genOpenSSLDSAPub(p, q, g, y);
					pubSSH = genOpenSSHDSAPub(p, q, g, y);
					privPEM = genOpenSSLDSAPriv(p, q, g, y, x);
					break;
				}
			}
			return new PPK_Private(type, comment, privPEM, pubPEM, pubSSH, "sha1", encrypted);
		};
	}
	function OpenSSH_Public(type, comment, pubPEM, pubSSH, algo) {
		this.type = type;
		this.comment = comment;
		this[SYM_PRIV_PEM] = null;
		this[SYM_PUB_PEM] = pubPEM;
		this[SYM_PUB_SSH] = pubSSH;
		this[SYM_HASH_ALGO] = algo;
		this[SYM_DECRYPTED] = false;
	}
	OpenSSH_Public.prototype = BaseKey;
	{
		let regexp;
		if (eddsaSupported) regexp = /^(((?:ssh-(?:rsa|dss|ed25519))|ecdsa-sha2-nistp(?:256|384|521))(?:-cert-v0[01]@openssh.com)?) ([A-Z0-9a-z/+=]+)(?:$|\s+([\S].*)?)$/;
		else regexp = /^(((?:ssh-(?:rsa|dss))|ecdsa-sha2-nistp(?:256|384|521))(?:-cert-v0[01]@openssh.com)?) ([A-Z0-9a-z/+=]+)(?:$|\s+([\S].*)?)$/;
		OpenSSH_Public.parse = (str) => {
			const m = regexp.exec(str);
			if (m === null) return null;
			const fullType = m[1];
			const baseType = m[2];
			const data = Buffer.from(m[3], "base64");
			const comment = m[4] || "";
			const type = readString(data, data._pos, true);
			if (type === void 0 || type.indexOf(baseType) !== 0) return /* @__PURE__ */ new Error("Malformed OpenSSH public key");
			return parseDER(data, baseType, comment, fullType);
		};
	}
	function RFC4716_Public(type, comment, pubPEM, pubSSH, algo) {
		this.type = type;
		this.comment = comment;
		this[SYM_PRIV_PEM] = null;
		this[SYM_PUB_PEM] = pubPEM;
		this[SYM_PUB_SSH] = pubSSH;
		this[SYM_HASH_ALGO] = algo;
		this[SYM_DECRYPTED] = false;
	}
	RFC4716_Public.prototype = BaseKey;
	{
		const regexp = /^---- BEGIN SSH2 PUBLIC KEY ----(?:\r?\n)((?:.{0,72}\r?\n)+)---- END SSH2 PUBLIC KEY ----$/;
		const RE_DATA = /^[A-Z0-9a-z/+=\r\n]+$/;
		const RE_HEADER = /^([\x21-\x39\x3B-\x7E]{1,64}): ((?:[^\\]*\\\r?\n)*[^\r\n]+)\r?\n/gm;
		const RE_HEADER_ENDS = /\\\r?\n/g;
		RFC4716_Public.parse = (str) => {
			let m = regexp.exec(str);
			if (m === null) return null;
			const body = m[1];
			let dataStart = 0;
			let comment = "";
			while (m = RE_HEADER.exec(body)) {
				const headerName = m[1];
				const headerValue = m[2].replace(RE_HEADER_ENDS, "");
				if (headerValue.length > 1024) {
					RE_HEADER.lastIndex = 0;
					return /* @__PURE__ */ new Error("Malformed RFC4716 public key");
				}
				dataStart = RE_HEADER.lastIndex;
				if (headerName.toLowerCase() === "comment") {
					comment = headerValue;
					if (comment.length > 1 && comment.charCodeAt(0) === 34 && comment.charCodeAt(comment.length - 1) === 34) comment = comment.slice(1, -1);
				}
			}
			let data = body.slice(dataStart);
			if (!RE_DATA.test(data)) return /* @__PURE__ */ new Error("Malformed RFC4716 public key");
			data = Buffer.from(data, "base64");
			const type = readString(data, 0, true);
			if (type === void 0) return /* @__PURE__ */ new Error("Malformed RFC4716 public key");
			let pubPEM = null;
			let pubSSH = null;
			switch (type) {
				case "ssh-rsa": {
					const e = readString(data, data._pos);
					if (e === void 0) return /* @__PURE__ */ new Error("Malformed RFC4716 public key");
					const n = readString(data, data._pos);
					if (n === void 0) return /* @__PURE__ */ new Error("Malformed RFC4716 public key");
					pubPEM = genOpenSSLRSAPub(n, e);
					pubSSH = genOpenSSHRSAPub(n, e);
					break;
				}
				case "ssh-dss": {
					const p = readString(data, data._pos);
					if (p === void 0) return /* @__PURE__ */ new Error("Malformed RFC4716 public key");
					const q = readString(data, data._pos);
					if (q === void 0) return /* @__PURE__ */ new Error("Malformed RFC4716 public key");
					const g = readString(data, data._pos);
					if (g === void 0) return /* @__PURE__ */ new Error("Malformed RFC4716 public key");
					const y = readString(data, data._pos);
					if (y === void 0) return /* @__PURE__ */ new Error("Malformed RFC4716 public key");
					pubPEM = genOpenSSLDSAPub(p, q, g, y);
					pubSSH = genOpenSSHDSAPub(p, q, g, y);
					break;
				}
				default: return /* @__PURE__ */ new Error("Malformed RFC4716 public key");
			}
			return new RFC4716_Public(type, comment, pubPEM, pubSSH, "sha1");
		};
	}
	function parseDER(data, baseType, comment, fullType) {
		if (!isSupportedKeyType(baseType)) return /* @__PURE__ */ new Error(`Unsupported OpenSSH public key type: ${baseType}`);
		let algo;
		let oid;
		let pubPEM = null;
		let pubSSH = null;
		switch (baseType) {
			case "ssh-rsa": {
				const e = readString(data, data._pos || 0);
				if (e === void 0) return /* @__PURE__ */ new Error("Malformed OpenSSH public key");
				const n = readString(data, data._pos);
				if (n === void 0) return /* @__PURE__ */ new Error("Malformed OpenSSH public key");
				pubPEM = genOpenSSLRSAPub(n, e);
				pubSSH = genOpenSSHRSAPub(n, e);
				algo = "sha1";
				break;
			}
			case "ssh-dss": {
				const p = readString(data, data._pos || 0);
				if (p === void 0) return /* @__PURE__ */ new Error("Malformed OpenSSH public key");
				const q = readString(data, data._pos);
				if (q === void 0) return /* @__PURE__ */ new Error("Malformed OpenSSH public key");
				const g = readString(data, data._pos);
				if (g === void 0) return /* @__PURE__ */ new Error("Malformed OpenSSH public key");
				const y = readString(data, data._pos);
				if (y === void 0) return /* @__PURE__ */ new Error("Malformed OpenSSH public key");
				pubPEM = genOpenSSLDSAPub(p, q, g, y);
				pubSSH = genOpenSSHDSAPub(p, q, g, y);
				algo = "sha1";
				break;
			}
			case "ssh-ed25519": {
				const edpub = readString(data, data._pos || 0);
				if (edpub === void 0 || edpub.length !== 32) return /* @__PURE__ */ new Error("Malformed OpenSSH public key");
				pubPEM = genOpenSSLEdPub(edpub);
				pubSSH = genOpenSSHEdPub(edpub);
				algo = null;
				break;
			}
			case "ecdsa-sha2-nistp256":
				algo = "sha256";
				oid = "1.2.840.10045.3.1.7";
			case "ecdsa-sha2-nistp384": if (algo === void 0) {
				algo = "sha384";
				oid = "1.3.132.0.34";
			}
			case "ecdsa-sha2-nistp521": {
				if (algo === void 0) {
					algo = "sha512";
					oid = "1.3.132.0.35";
				}
				if (!skipFields(data, 1)) return /* @__PURE__ */ new Error("Malformed OpenSSH public key");
				const ecpub = readString(data, data._pos || 0);
				if (ecpub === void 0) return /* @__PURE__ */ new Error("Malformed OpenSSH public key");
				pubPEM = genOpenSSLECDSAPub(oid, ecpub);
				pubSSH = genOpenSSHECDSAPub(oid, ecpub);
				break;
			}
			default: return /* @__PURE__ */ new Error(`Unsupported OpenSSH public key type: ${baseType}`);
		}
		return new OpenSSH_Public(fullType, comment, pubPEM, pubSSH, algo);
	}
	function isSupportedKeyType(type) {
		switch (type) {
			case "ssh-rsa":
			case "ssh-dss":
			case "ecdsa-sha2-nistp256":
			case "ecdsa-sha2-nistp384":
			case "ecdsa-sha2-nistp521": return true;
			case "ssh-ed25519": if (eddsaSupported) return true;
			default: return false;
		}
	}
	function isParsedKey(val) {
		if (!val) return false;
		return typeof val[SYM_DECRYPTED] === "boolean";
	}
	function parseKey(data, passphrase) {
		if (isParsedKey(data)) return data;
		let origBuffer;
		if (Buffer.isBuffer(data)) {
			origBuffer = data;
			data = data.utf8Slice(0, data.length).trim();
		} else if (typeof data === "string") data = data.trim();
		else return /* @__PURE__ */ new Error("Key data must be a Buffer or string");
		if (passphrase != void 0) {
			if (typeof passphrase === "string") passphrase = Buffer.from(passphrase);
			else if (!Buffer.isBuffer(passphrase)) return /* @__PURE__ */ new Error("Passphrase must be a string or Buffer when supplied");
		}
		let ret;
		if ((ret = OpenSSH_Private.parse(data, passphrase)) !== null) return ret;
		if ((ret = OpenSSH_Old_Private.parse(data, passphrase)) !== null) return ret;
		if ((ret = PPK_Private.parse(data, passphrase)) !== null) return ret;
		if ((ret = OpenSSH_Public.parse(data)) !== null) return ret;
		if ((ret = RFC4716_Public.parse(data)) !== null) return ret;
		if (origBuffer) {
			binaryKeyParser.init(origBuffer, 0);
			const type = binaryKeyParser.readString(true);
			if (type !== void 0) {
				data = binaryKeyParser.readRaw();
				if (data !== void 0) {
					ret = parseDER(data, type, "", type);
					if (ret instanceof Error) ret = null;
				}
			}
			binaryKeyParser.clear();
		}
		if (ret) return ret;
		return /* @__PURE__ */ new Error("Unsupported key format");
	}
	module.exports = {
		isParsedKey,
		isSupportedKeyType,
		parseDERKey: (data, type) => parseDER(data, type, "", type),
		parseKey
	};
}));
// node_modules/ssh2/lib/agent.js
var require_agent = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var __dirname = import.meta.dirname;
	const { Socket } = __require("net");
	const { Duplex } = __require("stream");
	const { resolve } = __require("path");
	const { readFile } = __require("fs");
	const { execFile, spawn } = __require("child_process");
	const { isParsedKey, parseKey } = require_keyParser();
	const { makeBufferParser, readUInt32BE, writeUInt32BE, writeUInt32LE } = require_utils$1();
	function once(cb) {
		let called = false;
		return (...args) => {
			if (called) return;
			called = true;
			cb(...args);
		};
	}
	function concat(buf1, buf2) {
		const combined = Buffer.allocUnsafe(buf1.length + buf2.length);
		buf1.copy(combined, 0);
		buf2.copy(combined, buf1.length);
		return combined;
	}
	function noop() {}
	const EMPTY_BUF = Buffer.alloc(0);
	const binaryParser = makeBufferParser();
	var BaseAgent = class {
		getIdentities(cb) {
			cb(/* @__PURE__ */ new Error("Missing getIdentities() implementation"));
		}
		sign(pubKey, data, options, cb) {
			if (typeof options === "function") cb = options;
			cb(/* @__PURE__ */ new Error("Missing sign() implementation"));
		}
	};
	var OpenSSHAgent = class extends BaseAgent {
		constructor(socketPath) {
			super();
			this.socketPath = socketPath;
		}
		getStream(cb) {
			cb = once(cb);
			const sock = new Socket();
			sock.on("connect", () => {
				cb(null, sock);
			});
			sock.on("close", onFail).on("end", onFail).on("error", onFail);
			sock.connect(this.socketPath);
			function onFail() {
				try {
					sock.destroy();
				} catch {}
				cb(/* @__PURE__ */ new Error("Failed to connect to agent"));
			}
		}
		getIdentities(cb) {
			cb = once(cb);
			this.getStream((err, stream) => {
				function onFail(err) {
					if (stream) try {
						stream.destroy();
					} catch {}
					if (!err) err = /* @__PURE__ */ new Error("Failed to retrieve identities from agent");
					cb(err);
				}
				if (err) return onFail(err);
				const protocol = new AgentProtocol(true);
				protocol.on("error", onFail);
				protocol.pipe(stream).pipe(protocol);
				stream.on("close", onFail).on("end", onFail).on("error", onFail);
				protocol.getIdentities((err, keys) => {
					if (err) return onFail(err);
					try {
						stream.destroy();
					} catch {}
					cb(null, keys);
				});
			});
		}
		sign(pubKey, data, options, cb) {
			if (typeof options === "function") {
				cb = options;
				options = void 0;
			} else if (typeof options !== "object" || options === null) options = void 0;
			cb = once(cb);
			this.getStream((err, stream) => {
				function onFail(err) {
					if (stream) try {
						stream.destroy();
					} catch {}
					if (!err) err = /* @__PURE__ */ new Error("Failed to sign data with agent");
					cb(err);
				}
				if (err) return onFail(err);
				const protocol = new AgentProtocol(true);
				protocol.on("error", onFail);
				protocol.pipe(stream).pipe(protocol);
				stream.on("close", onFail).on("end", onFail).on("error", onFail);
				protocol.sign(pubKey, data, options, (err, sig) => {
					if (err) return onFail(err);
					try {
						stream.destroy();
					} catch {}
					cb(null, sig);
				});
			});
		}
	};
	const PageantAgent = (() => {
		const RET_ERR_BADARGS = 10;
		const RET_ERR_UNAVAILABLE = 11;
		const RET_ERR_NOMAP = 12;
		const RET_ERR_BINSTDIN = 13;
		const RET_ERR_BINSTDOUT = 14;
		const RET_ERR_BADLEN = 15;
		const EXEPATH = resolve(__dirname, "..", "util/pagent.exe");
		const ERROR = {
			[RET_ERR_BADARGS]: /* @__PURE__ */ new Error("Invalid pagent.exe arguments"),
			[RET_ERR_UNAVAILABLE]: /* @__PURE__ */ new Error("Pageant is not running"),
			[RET_ERR_NOMAP]: /* @__PURE__ */ new Error("pagent.exe could not create an mmap"),
			[RET_ERR_BINSTDIN]: /* @__PURE__ */ new Error("pagent.exe could not set mode for stdin"),
			[RET_ERR_BINSTDOUT]: /* @__PURE__ */ new Error("pagent.exe could not set mode for stdout"),
			[RET_ERR_BADLEN]: /* @__PURE__ */ new Error("pagent.exe did not get expected input payload")
		};
		function destroy(stream) {
			stream.buffer = null;
			if (stream.proc) {
				stream.proc.kill();
				stream.proc = void 0;
			}
		}
		class PageantSocket extends Duplex {
			constructor() {
				super();
				this.proc = void 0;
				this.buffer = null;
			}
			_read(n) {}
			_write(data, encoding, cb) {
				if (this.buffer === null) this.buffer = data;
				else {
					const newBuffer = Buffer.allocUnsafe(this.buffer.length + data.length);
					this.buffer.copy(newBuffer, 0);
					data.copy(newBuffer, this.buffer.length);
					this.buffer = newBuffer;
				}
				if (this.buffer.length < 4) return cb();
				const len = readUInt32BE(this.buffer, 0);
				if (this.buffer.length - 4 < len) return cb();
				data = this.buffer.slice(0, 4 + len);
				if (this.buffer.length > 4 + len) return cb(/* @__PURE__ */ new Error("Unexpected multiple agent requests"));
				this.buffer = null;
				let error;
				const proc = this.proc = spawn(EXEPATH, [data.length]);
				proc.stdout.on("data", (data) => {
					this.push(data);
				});
				proc.on("error", (err) => {
					error = err;
					cb(error);
				});
				proc.on("close", (code) => {
					this.proc = void 0;
					if (!error) {
						if (error = ERROR[code]) return cb(error);
						cb();
					}
				});
				proc.stdin.end(data);
			}
			_final(cb) {
				destroy(this);
				cb();
			}
			_destroy(err, cb) {
				destroy(this);
				cb();
			}
		}
		return class PageantAgent extends OpenSSHAgent {
			getStream(cb) {
				cb(null, new PageantSocket());
			}
		};
	})();
	const CygwinAgent = (() => {
		const RE_CYGWIN_SOCK = /^!<socket >(\d+) s ([A-Z0-9]{8}-[A-Z0-9]{8}-[A-Z0-9]{8}-[A-Z0-9]{8})/;
		return class CygwinAgent extends OpenSSHAgent {
			getStream(cb) {
				cb = once(cb);
				let socketPath = this.socketPath;
				let triedCygpath = false;
				readFile(socketPath, function readCygsocket(err, data) {
					if (err) {
						if (triedCygpath) return cb(/* @__PURE__ */ new Error("Invalid cygwin unix socket path"));
						execFile("cygpath", ["-w", socketPath], (err, stdout, stderr) => {
							if (err || stdout.length === 0) return cb(/* @__PURE__ */ new Error("Invalid cygwin unix socket path"));
							triedCygpath = true;
							socketPath = stdout.toString().replace(/[\r\n]/g, "");
							readFile(socketPath, readCygsocket);
						});
						return;
					}
					const m = RE_CYGWIN_SOCK.exec(data.toString("ascii"));
					if (!m) return cb(/* @__PURE__ */ new Error("Malformed cygwin unix socket file"));
					let state;
					let bc = 0;
					let isRetrying = false;
					const inBuf = [];
					let sock;
					let credsBuf = Buffer.alloc(12);
					const port = parseInt(m[1], 10);
					const secret = m[2].replace(/-/g, "");
					const secretBuf = Buffer.allocUnsafe(16);
					for (let i = 0, j = 0; j < 32; ++i, j += 2) secretBuf[i] = parseInt(secret.substring(j, j + 2), 16);
					for (let i = 0; i < 16; i += 4) writeUInt32LE(secretBuf, readUInt32BE(secretBuf, i), i);
					tryConnect();
					function _onconnect() {
						bc = 0;
						state = "secret";
						sock.write(secretBuf);
					}
					function _ondata(data) {
						bc += data.length;
						if (state === "secret") {
							if (bc === 16) {
								bc = 0;
								state = "creds";
								sock.write(credsBuf);
							}
							return;
						}
						if (state === "creds") {
							if (!isRetrying) inBuf.push(data);
							if (bc === 12) {
								sock.removeListener("connect", _onconnect);
								sock.removeListener("data", _ondata);
								sock.removeListener("error", onFail);
								sock.removeListener("end", onFail);
								sock.removeListener("close", onFail);
								if (isRetrying) return cb(null, sock);
								isRetrying = true;
								credsBuf = Buffer.concat(inBuf);
								writeUInt32LE(credsBuf, process.pid, 0);
								sock.on("error", () => {});
								sock.destroy();
								tryConnect();
							}
						}
					}
					function onFail() {
						cb(/* @__PURE__ */ new Error("Problem negotiating cygwin unix socket security"));
					}
					function tryConnect() {
						sock = new Socket();
						sock.on("connect", _onconnect);
						sock.on("data", _ondata);
						sock.on("error", onFail);
						sock.on("end", onFail);
						sock.on("close", onFail);
						sock.connect(port);
					}
				});
			}
		};
	})();
	const WINDOWS_PIPE_REGEX = /^[/\\][/\\]\.[/\\]pipe[/\\].+/;
	function createAgent(path) {
		if (process.platform === "win32" && !WINDOWS_PIPE_REGEX.test(path)) return path === "pageant" ? new PageantAgent() : new CygwinAgent(path);
		return new OpenSSHAgent(path);
	}
	const AgentProtocol = (() => {
		const SSH_AGENTC_REQUEST_IDENTITIES = 11;
		const SSH_AGENTC_SIGN_REQUEST = 13;
		const SSH_AGENT_FAILURE = 5;
		const SSH_AGENT_IDENTITIES_ANSWER = 12;
		const SSH_AGENT_SIGN_RESPONSE = 14;
		const SSH_AGENT_RSA_SHA2_256 = 2;
		const SSH_AGENT_RSA_SHA2_512 = 4;
		const ROLE_CLIENT = 0;
		const ROLE_SERVER = 1;
		function processResponses(protocol) {
			let ret;
			while (protocol[SYM_REQS].length) {
				const nextResponse = protocol[SYM_REQS][0][SYM_RESP];
				if (nextResponse === void 0) break;
				protocol[SYM_REQS].shift();
				ret = protocol.push(nextResponse);
			}
			return ret;
		}
		const SYM_TYPE = Symbol("Inbound Request Type");
		const SYM_RESP = Symbol("Inbound Request Response");
		const SYM_CTX = Symbol("Inbound Request Context");
		class AgentInboundRequest {
			constructor(type, ctx) {
				this[SYM_TYPE] = type;
				this[SYM_RESP] = void 0;
				this[SYM_CTX] = ctx;
			}
			hasResponded() {
				return this[SYM_RESP] !== void 0;
			}
			getType() {
				return this[SYM_TYPE];
			}
			getContext() {
				return this[SYM_CTX];
			}
		}
		function respond(protocol, req, data) {
			req[SYM_RESP] = data;
			return processResponses(protocol);
		}
		function cleanup(protocol) {
			protocol[SYM_BUFFER] = null;
			if (protocol[SYM_MODE] === ROLE_CLIENT) {
				const reqs = protocol[SYM_REQS];
				if (reqs && reqs.length) {
					protocol[SYM_REQS] = [];
					for (const req of reqs) req.cb(/* @__PURE__ */ new Error("No reply from server"));
				}
			}
			try {
				protocol.end();
			} catch {}
			setImmediate(() => {
				if (!protocol[SYM_ENDED]) protocol.emit("end");
				if (!protocol[SYM_CLOSED]) protocol.emit("close");
			});
		}
		function onClose() {
			this[SYM_CLOSED] = true;
		}
		function onEnd() {
			this[SYM_ENDED] = true;
		}
		const SYM_REQS = Symbol("Requests");
		const SYM_MODE = Symbol("Agent Protocol Role");
		const SYM_BUFFER = Symbol("Agent Protocol Buffer");
		const SYM_MSGLEN = Symbol("Agent Protocol Current Message Length");
		const SYM_CLOSED = Symbol("Agent Protocol Closed");
		const SYM_ENDED = Symbol("Agent Protocol Ended");
		return class AgentProtocol extends Duplex {
			constructor(isClient) {
				super({
					autoDestroy: true,
					emitClose: false
				});
				this[SYM_MODE] = isClient ? ROLE_CLIENT : ROLE_SERVER;
				this[SYM_REQS] = [];
				this[SYM_BUFFER] = null;
				this[SYM_MSGLEN] = -1;
				this.once("end", onEnd);
				this.once("close", onClose);
			}
			_read(n) {}
			_write(data, encoding, cb) {
				if (this[SYM_BUFFER] === null) this[SYM_BUFFER] = data;
				else this[SYM_BUFFER] = concat(this[SYM_BUFFER], data);
				let buffer = this[SYM_BUFFER];
				let bufferLen = buffer.length;
				let p = 0;
				while (p < bufferLen) {
					if (bufferLen < 5) break;
					if (this[SYM_MSGLEN] === -1) this[SYM_MSGLEN] = readUInt32BE(buffer, p);
					if (bufferLen < 4 + this[SYM_MSGLEN]) break;
					const msgType = buffer[p += 4];
					++p;
					if (this[SYM_MODE] === ROLE_CLIENT) {
						if (this[SYM_REQS].length === 0) return cb(/* @__PURE__ */ new Error("Received unexpected message from server"));
						const req = this[SYM_REQS].shift();
						switch (msgType) {
							case SSH_AGENT_FAILURE:
								req.cb(/* @__PURE__ */ new Error("Agent responded with failure"));
								break;
							case SSH_AGENT_IDENTITIES_ANSWER: {
								if (req.type !== SSH_AGENTC_REQUEST_IDENTITIES) return cb(/* @__PURE__ */ new Error("Agent responded with wrong message type"));
								binaryParser.init(buffer, p);
								const numKeys = binaryParser.readUInt32BE();
								if (numKeys === void 0) {
									binaryParser.clear();
									return cb(/* @__PURE__ */ new Error("Malformed agent response"));
								}
								const keys = [];
								for (let i = 0; i < numKeys; ++i) {
									let pubKey = binaryParser.readString();
									if (pubKey === void 0) {
										binaryParser.clear();
										return cb(/* @__PURE__ */ new Error("Malformed agent response"));
									}
									const comment = binaryParser.readString(true);
									if (comment === void 0) {
										binaryParser.clear();
										return cb(/* @__PURE__ */ new Error("Malformed agent response"));
									}
									pubKey = parseKey(pubKey);
									if (pubKey instanceof Error) continue;
									pubKey.comment = pubKey.comment || comment;
									keys.push(pubKey);
								}
								p = binaryParser.pos();
								binaryParser.clear();
								req.cb(null, keys);
								break;
							}
							case SSH_AGENT_SIGN_RESPONSE: {
								if (req.type !== SSH_AGENTC_SIGN_REQUEST) return cb(/* @__PURE__ */ new Error("Agent responded with wrong message type"));
								binaryParser.init(buffer, p);
								let signature = binaryParser.readString();
								p = binaryParser.pos();
								binaryParser.clear();
								if (signature === void 0) return cb(/* @__PURE__ */ new Error("Malformed agent response"));
								binaryParser.init(signature, 0);
								binaryParser.readString(true);
								signature = binaryParser.readString();
								binaryParser.clear();
								if (signature === void 0) return cb(/* @__PURE__ */ new Error("Malformed OpenSSH signature format"));
								req.cb(null, signature);
								break;
							}
							default: return cb(/* @__PURE__ */ new Error("Agent responded with unsupported message type"));
						}
					} else switch (msgType) {
						case SSH_AGENTC_REQUEST_IDENTITIES: {
							const req = new AgentInboundRequest(msgType);
							this[SYM_REQS].push(req);
							this.emit("identities", req);
							break;
						}
						case SSH_AGENTC_SIGN_REQUEST: {
							binaryParser.init(buffer, p);
							let pubKey = binaryParser.readString();
							const data = binaryParser.readString();
							const flagsVal = binaryParser.readUInt32BE();
							p = binaryParser.pos();
							binaryParser.clear();
							if (flagsVal === void 0) {
								const req = new AgentInboundRequest(msgType);
								this[SYM_REQS].push(req);
								return this.failureReply(req);
							}
							pubKey = parseKey(pubKey);
							if (pubKey instanceof Error) {
								const req = new AgentInboundRequest(msgType);
								this[SYM_REQS].push(req);
								return this.failureReply(req);
							}
							const flags = { hash: void 0 };
							let ctx;
							if (pubKey.type === "ssh-rsa") {
								if (flagsVal & SSH_AGENT_RSA_SHA2_256) {
									ctx = "rsa-sha2-256";
									flags.hash = "sha256";
								} else if (flagsVal & SSH_AGENT_RSA_SHA2_512) {
									ctx = "rsa-sha2-512";
									flags.hash = "sha512";
								}
							}
							if (ctx === void 0) ctx = pubKey.type;
							const req = new AgentInboundRequest(msgType, ctx);
							this[SYM_REQS].push(req);
							this.emit("sign", req, pubKey, data, flags);
							break;
						}
						default: {
							const req = new AgentInboundRequest(msgType);
							this[SYM_REQS].push(req);
							this.failureReply(req);
						}
					}
					this[SYM_MSGLEN] = -1;
					if (p === bufferLen) {
						this[SYM_BUFFER] = null;
						break;
					} else {
						this[SYM_BUFFER] = buffer = buffer.slice(p);
						bufferLen = buffer.length;
						p = 0;
					}
				}
				cb();
			}
			_destroy(err, cb) {
				cleanup(this);
				cb();
			}
			_final(cb) {
				cleanup(this);
				cb();
			}
			sign(pubKey, data, options, cb) {
				if (this[SYM_MODE] !== ROLE_CLIENT) throw new Error("Client-only method called with server role");
				if (typeof options === "function") {
					cb = options;
					options = void 0;
				} else if (typeof options !== "object" || options === null) options = void 0;
				let flags = 0;
				pubKey = parseKey(pubKey);
				if (pubKey instanceof Error) throw new Error("Invalid public key argument");
				if (pubKey.type === "ssh-rsa" && options) switch (options.hash) {
					case "sha256":
						flags = SSH_AGENT_RSA_SHA2_256;
						break;
					case "sha512": flags = SSH_AGENT_RSA_SHA2_512;
				}
				pubKey = pubKey.getPublicSSH();
				const type = SSH_AGENTC_SIGN_REQUEST;
				const keyLen = pubKey.length;
				const dataLen = data.length;
				let p = 0;
				const buf = Buffer.allocUnsafe(9 + keyLen + 4 + dataLen + 4);
				writeUInt32BE(buf, buf.length - 4, p);
				buf[p += 4] = type;
				writeUInt32BE(buf, keyLen, ++p);
				pubKey.copy(buf, p += 4);
				writeUInt32BE(buf, dataLen, p += keyLen);
				data.copy(buf, p += 4);
				writeUInt32BE(buf, flags, p += dataLen);
				if (typeof cb !== "function") cb = noop;
				this[SYM_REQS].push({
					type,
					cb
				});
				return this.push(buf);
			}
			getIdentities(cb) {
				if (this[SYM_MODE] !== ROLE_CLIENT) throw new Error("Client-only method called with server role");
				const type = SSH_AGENTC_REQUEST_IDENTITIES;
				let p = 0;
				const buf = Buffer.allocUnsafe(5);
				writeUInt32BE(buf, buf.length - 4, p);
				buf[p += 4] = type;
				if (typeof cb !== "function") cb = noop;
				this[SYM_REQS].push({
					type,
					cb
				});
				return this.push(buf);
			}
			failureReply(req) {
				if (this[SYM_MODE] !== ROLE_SERVER) throw new Error("Server-only method called with client role");
				if (!(req instanceof AgentInboundRequest)) throw new Error("Wrong request argument");
				if (req.hasResponded()) return true;
				let p = 0;
				const buf = Buffer.allocUnsafe(5);
				writeUInt32BE(buf, buf.length - 4, p);
				buf[p += 4] = SSH_AGENT_FAILURE;
				return respond(this, req, buf);
			}
			getIdentitiesReply(req, keys) {
				if (this[SYM_MODE] !== ROLE_SERVER) throw new Error("Server-only method called with client role");
				if (!(req instanceof AgentInboundRequest)) throw new Error("Wrong request argument");
				if (req.hasResponded()) return true;
				if (req.getType() !== SSH_AGENTC_REQUEST_IDENTITIES) throw new Error("Invalid response to request");
				if (!Array.isArray(keys)) throw new Error("Keys argument must be an array");
				let totalKeysLen = 4;
				const newKeys = [];
				for (let i = 0; i < keys.length; ++i) {
					const entry = keys[i];
					if (typeof entry !== "object" || entry === null) throw new Error(`Invalid key entry: ${entry}`);
					let pubKey;
					let comment;
					if (isParsedKey(entry)) pubKey = entry;
					else if (isParsedKey(entry.pubKey)) pubKey = entry.pubKey;
					else {
						if (typeof entry.pubKey !== "object" || entry.pubKey === null) continue;
						({pubKey, comment} = entry.pubKey);
						pubKey = parseKey(pubKey);
						if (pubKey instanceof Error) continue;
					}
					comment = pubKey.comment || comment;
					pubKey = pubKey.getPublicSSH();
					totalKeysLen += 4 + pubKey.length;
					if (comment && typeof comment === "string") comment = Buffer.from(comment);
					else if (!Buffer.isBuffer(comment)) comment = EMPTY_BUF;
					totalKeysLen += 4 + comment.length;
					newKeys.push({
						pubKey,
						comment
					});
				}
				let p = 0;
				const buf = Buffer.allocUnsafe(5 + totalKeysLen);
				writeUInt32BE(buf, buf.length - 4, p);
				buf[p += 4] = SSH_AGENT_IDENTITIES_ANSWER;
				writeUInt32BE(buf, newKeys.length, ++p);
				p += 4;
				for (let i = 0; i < newKeys.length; ++i) {
					const { pubKey, comment } = newKeys[i];
					writeUInt32BE(buf, pubKey.length, p);
					pubKey.copy(buf, p += 4);
					writeUInt32BE(buf, comment.length, p += pubKey.length);
					p += 4;
					if (comment.length) {
						comment.copy(buf, p);
						p += comment.length;
					}
				}
				return respond(this, req, buf);
			}
			signReply(req, signature) {
				if (this[SYM_MODE] !== ROLE_SERVER) throw new Error("Server-only method called with client role");
				if (!(req instanceof AgentInboundRequest)) throw new Error("Wrong request argument");
				if (req.hasResponded()) return true;
				if (req.getType() !== SSH_AGENTC_SIGN_REQUEST) throw new Error("Invalid response to request");
				if (!Buffer.isBuffer(signature)) throw new Error("Signature argument must be a Buffer");
				if (signature.length === 0) throw new Error("Signature argument must be non-empty");
				let p = 0;
				const sigFormat = req.getContext();
				const sigFormatLen = Buffer.byteLength(sigFormat);
				const buf = Buffer.allocUnsafe(13 + sigFormatLen + 4 + signature.length);
				writeUInt32BE(buf, buf.length - 4, p);
				buf[p += 4] = SSH_AGENT_SIGN_RESPONSE;
				writeUInt32BE(buf, 4 + sigFormatLen + 4 + signature.length, ++p);
				writeUInt32BE(buf, sigFormatLen, p += 4);
				buf.utf8Write(sigFormat, p += 4, sigFormatLen);
				writeUInt32BE(buf, signature.length, p += sigFormatLen);
				signature.copy(buf, p += 4);
				return respond(this, req, buf);
			}
		};
	})();
	const SYM_AGENT = Symbol("Agent");
	const SYM_AGENT_KEYS = Symbol("Agent Keys");
	const SYM_AGENT_KEYS_IDX = Symbol("Agent Keys Index");
	const SYM_AGENT_CBS = Symbol("Agent Init Callbacks");
	var AgentContext = class {
		constructor(agent) {
			if (typeof agent === "string") agent = createAgent(agent);
			else if (!isAgent(agent)) throw new Error("Invalid agent argument");
			this[SYM_AGENT] = agent;
			this[SYM_AGENT_KEYS] = null;
			this[SYM_AGENT_KEYS_IDX] = -1;
			this[SYM_AGENT_CBS] = null;
		}
		init(cb) {
			if (typeof cb !== "function") cb = noop;
			if (this[SYM_AGENT_KEYS] === null) {
				if (this[SYM_AGENT_CBS] === null) {
					this[SYM_AGENT_CBS] = [cb];
					const doCbs = (...args) => {
						process.nextTick(() => {
							const cbs = this[SYM_AGENT_CBS];
							this[SYM_AGENT_CBS] = null;
							for (const cb of cbs) cb(...args);
						});
					};
					this[SYM_AGENT].getIdentities(once((err, keys) => {
						if (err) return doCbs(err);
						if (!Array.isArray(keys)) return doCbs(/* @__PURE__ */ new Error("Agent implementation failed to provide keys"));
						const newKeys = [];
						for (let key of keys) {
							key = parseKey(key);
							if (key instanceof Error) continue;
							newKeys.push(key);
						}
						this[SYM_AGENT_KEYS] = newKeys;
						this[SYM_AGENT_KEYS_IDX] = -1;
						doCbs();
					}));
				} else this[SYM_AGENT_CBS].push(cb);
			} else process.nextTick(cb);
		}
		nextKey() {
			if (this[SYM_AGENT_KEYS] === null || ++this[SYM_AGENT_KEYS_IDX] >= this[SYM_AGENT_KEYS].length) return false;
			return this[SYM_AGENT_KEYS][this[SYM_AGENT_KEYS_IDX]];
		}
		currentKey() {
			if (this[SYM_AGENT_KEYS] === null || this[SYM_AGENT_KEYS_IDX] >= this[SYM_AGENT_KEYS].length) return null;
			return this[SYM_AGENT_KEYS][this[SYM_AGENT_KEYS_IDX]];
		}
		pos() {
			if (this[SYM_AGENT_KEYS] === null || this[SYM_AGENT_KEYS_IDX] >= this[SYM_AGENT_KEYS].length) return -1;
			return this[SYM_AGENT_KEYS_IDX];
		}
		reset() {
			this[SYM_AGENT_KEYS_IDX] = -1;
		}
		sign(...args) {
			this[SYM_AGENT].sign(...args);
		}
	};
	function isAgent(val) {
		return val instanceof BaseAgent;
	}
	module.exports = {
		AgentContext,
		AgentProtocol,
		BaseAgent,
		createAgent,
		CygwinAgent,
		isAgent,
		OpenSSHAgent,
		PageantAgent
	};
}));
// node_modules/ssh2/lib/protocol/zlib.js
var require_zlib = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const { kMaxLength } = __require("buffer");
	const { createInflate, constants: { DEFLATE, INFLATE, Z_DEFAULT_CHUNK, Z_DEFAULT_COMPRESSION, Z_DEFAULT_MEMLEVEL, Z_DEFAULT_STRATEGY, Z_DEFAULT_WINDOWBITS, Z_PARTIAL_FLUSH } } = __require("zlib");
	const ZlibHandle = createInflate()._handle.constructor;
	function processCallback() {
		throw new Error("Should not get here");
	}
	function zlibOnError(message, errno, code) {
		const self = this._owner;
		const error = new Error(message);
		error.errno = errno;
		error.code = code;
		self._err = error;
	}
	function _close(engine) {
		if (!engine._handle) return;
		engine._handle.close();
		engine._handle = null;
	}
	var Zlib = class {
		constructor(mode) {
			const windowBits = Z_DEFAULT_WINDOWBITS;
			const level = Z_DEFAULT_COMPRESSION;
			const memLevel = Z_DEFAULT_MEMLEVEL;
			const strategy = Z_DEFAULT_STRATEGY;
			const dictionary = void 0;
			this._err = void 0;
			this._writeState = /* @__PURE__ */ new Uint32Array(2);
			this._chunkSize = Z_DEFAULT_CHUNK;
			this._maxOutputLength = kMaxLength;
			this._outBuffer = Buffer.allocUnsafe(this._chunkSize);
			this._outOffset = 0;
			this._handle = new ZlibHandle(mode);
			this._handle._owner = this;
			this._handle.onerror = zlibOnError;
			this._handle.init(windowBits, level, memLevel, strategy, this._writeState, processCallback, dictionary);
		}
		writeSync(chunk, retChunks) {
			const handle = this._handle;
			if (!handle) throw new Error("Invalid Zlib instance");
			let availInBefore = chunk.length;
			let availOutBefore = this._chunkSize - this._outOffset;
			let inOff = 0;
			let availOutAfter;
			let availInAfter;
			let buffers;
			let nread = 0;
			const state = this._writeState;
			let buffer = this._outBuffer;
			let offset = this._outOffset;
			const chunkSize = this._chunkSize;
			while (true) {
				handle.writeSync(Z_PARTIAL_FLUSH, chunk, inOff, availInBefore, buffer, offset, availOutBefore);
				if (this._err) throw this._err;
				availOutAfter = state[0];
				availInAfter = state[1];
				const inDelta = availInBefore - availInAfter;
				const have = availOutBefore - availOutAfter;
				if (have > 0) {
					const out = offset === 0 && have === buffer.length ? buffer : buffer.slice(offset, offset + have);
					offset += have;
					if (!buffers) buffers = out;
					else if (buffers.push === void 0) buffers = [buffers, out];
					else buffers.push(out);
					nread += out.byteLength;
					if (nread > this._maxOutputLength) {
						_close(this);
						throw new Error(`Output length exceeded maximum of ${this._maxOutputLength}`);
					}
				} else if (have !== 0) throw new Error("have should not go down");
				if (availOutAfter === 0 || offset >= chunkSize) {
					availOutBefore = chunkSize;
					offset = 0;
					buffer = Buffer.allocUnsafe(chunkSize);
				}
				if (availOutAfter === 0) {
					inOff += inDelta;
					availInBefore = availInAfter;
				} else break;
			}
			this._outBuffer = buffer;
			this._outOffset = offset;
			if (nread === 0) buffers = Buffer.alloc(0);
			if (retChunks) {
				buffers.totalLen = nread;
				return buffers;
			}
			if (buffers.push === void 0) return buffers;
			const output = Buffer.allocUnsafe(nread);
			for (let i = 0, p = 0; i < buffers.length; ++i) {
				const buf = buffers[i];
				output.set(buf, p);
				p += buf.length;
			}
			return output;
		}
	};
	var ZlibPacketWriter = class {
		constructor(protocol) {
			this.allocStart = 0;
			this.allocStartKEX = 0;
			this._protocol = protocol;
			this._zlib = new Zlib(DEFLATE);
		}
		cleanup() {
			if (this._zlib) _close(this._zlib);
		}
		alloc(payloadSize, force) {
			return Buffer.allocUnsafe(payloadSize);
		}
		finalize(payload, force) {
			if (this._protocol._kexinit === void 0 || force) {
				const output = this._zlib.writeSync(payload, true);
				const packet = this._protocol._cipher.allocPacket(output.totalLen);
				if (output.push === void 0) packet.set(output, 5);
				else for (let i = 0, p = 5; i < output.length; ++i) {
					const chunk = output[i];
					packet.set(chunk, p);
					p += chunk.length;
				}
				return packet;
			}
			return payload;
		}
	};
	var PacketWriter = class {
		constructor(protocol) {
			this.allocStart = 5;
			this.allocStartKEX = 5;
			this._protocol = protocol;
		}
		cleanup() {}
		alloc(payloadSize, force) {
			if (this._protocol._kexinit === void 0 || force) return this._protocol._cipher.allocPacket(payloadSize);
			return Buffer.allocUnsafe(payloadSize);
		}
		finalize(packet, force) {
			return packet;
		}
	};
	var ZlibPacketReader = class {
		constructor() {
			this._zlib = new Zlib(INFLATE);
		}
		cleanup() {
			if (this._zlib) _close(this._zlib);
		}
		read(data) {
			return this._zlib.writeSync(data, false);
		}
	};
	var PacketReader = class {
		cleanup() {}
		read(data) {
			return data;
		}
	};
	module.exports = {
		PacketReader,
		PacketWriter,
		ZlibPacketReader,
		ZlibPacketWriter
	};
}));
// node_modules/ssh2/lib/protocol/handlers.misc.js
var require_handlers_misc = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const { bufferSlice, bufferParser, doFatalError, sigSSHToASN1, writeUInt32BE } = require_utils$1();
	const { CHANNEL_OPEN_FAILURE, COMPAT, MESSAGE, TERMINAL_MODE } = require_constants();
	const { parseKey } = require_keyParser();
	const TERMINAL_MODE_BY_VALUE = Array.from(Object.entries(TERMINAL_MODE)).reduce((obj, [key, value]) => ({
		...obj,
		[key]: value
	}), {});
	module.exports = {
		[MESSAGE.DISCONNECT]: (self, payload) => {
			bufferParser.init(payload, 1);
			const reason = bufferParser.readUInt32BE();
			const desc = bufferParser.readString(true);
			const lang = bufferParser.readString();
			bufferParser.clear();
			if (lang === void 0) return doFatalError(self, "Inbound: Malformed DISCONNECT packet");
			self._debug && self._debug(`Inbound: Received DISCONNECT (${reason}, "${desc}")`);
			const handler = self._handlers.DISCONNECT;
			handler && handler(self, reason, desc);
		},
		[MESSAGE.IGNORE]: (self, payload) => {
			self._debug && self._debug("Inbound: Received IGNORE");
		},
		[MESSAGE.UNIMPLEMENTED]: (self, payload) => {
			bufferParser.init(payload, 1);
			const seqno = bufferParser.readUInt32BE();
			bufferParser.clear();
			if (seqno === void 0) return doFatalError(self, "Inbound: Malformed UNIMPLEMENTED packet");
			self._debug && self._debug(`Inbound: Received UNIMPLEMENTED (seqno ${seqno})`);
		},
		[MESSAGE.DEBUG]: (self, payload) => {
			bufferParser.init(payload, 1);
			const display = bufferParser.readBool();
			const msg = bufferParser.readString(true);
			const lang = bufferParser.readString();
			bufferParser.clear();
			if (lang === void 0) return doFatalError(self, "Inbound: Malformed DEBUG packet");
			self._debug && self._debug("Inbound: Received DEBUG");
			const handler = self._handlers.DEBUG;
			handler && handler(self, display, msg);
		},
		[MESSAGE.SERVICE_REQUEST]: (self, payload) => {
			bufferParser.init(payload, 1);
			const name = bufferParser.readString(true);
			bufferParser.clear();
			if (name === void 0) return doFatalError(self, "Inbound: Malformed SERVICE_REQUEST packet");
			self._debug && self._debug(`Inbound: Received SERVICE_REQUEST (${name})`);
			const handler = self._handlers.SERVICE_REQUEST;
			handler && handler(self, name);
		},
		[MESSAGE.SERVICE_ACCEPT]: (self, payload) => {
			bufferParser.init(payload, 1);
			const name = bufferParser.readString(true);
			bufferParser.clear();
			if (name === void 0) return doFatalError(self, "Inbound: Malformed SERVICE_ACCEPT packet");
			self._debug && self._debug(`Inbound: Received SERVICE_ACCEPT (${name})`);
			const handler = self._handlers.SERVICE_ACCEPT;
			handler && handler(self, name);
		},
		[MESSAGE.EXT_INFO]: (self, payload) => {
			bufferParser.init(payload, 1);
			const numExts = bufferParser.readUInt32BE();
			let exts;
			if (numExts !== void 0) {
				exts = [];
				for (let i = 0; i < numExts; ++i) {
					const name = bufferParser.readString(true);
					const data = bufferParser.readString();
					if (data !== void 0) switch (name) {
						case "server-sig-algs": {
							const algs = data.latin1Slice(0, data.length).split(",");
							exts.push({
								name,
								algs
							});
							continue;
						}
						default: continue;
					}
					exts = void 0;
					break;
				}
			}
			bufferParser.clear();
			if (exts === void 0) return doFatalError(self, "Inbound: Malformed EXT_INFO packet");
			self._debug && self._debug("Inbound: Received EXT_INFO");
			const handler = self._handlers.EXT_INFO;
			handler && handler(self, exts);
		},
		[MESSAGE.USERAUTH_REQUEST]: (self, payload) => {
			bufferParser.init(payload, 1);
			const user = bufferParser.readString(true);
			const service = bufferParser.readString(true);
			const method = bufferParser.readString(true);
			let methodData;
			let methodDesc;
			switch (method) {
				case "none":
					methodData = null;
					break;
				case "password": {
					const isChange = bufferParser.readBool();
					if (isChange !== void 0) {
						methodData = bufferParser.readString(true);
						if (methodData !== void 0 && isChange) {
							const newPassword = bufferParser.readString(true);
							if (newPassword !== void 0) methodData = {
								oldPassword: methodData,
								newPassword
							};
							else methodData = void 0;
						}
					}
					break;
				}
				case "publickey": {
					const hasSig = bufferParser.readBool();
					if (hasSig !== void 0) {
						const keyAlgo = bufferParser.readString(true);
						let realKeyAlgo = keyAlgo;
						const key = bufferParser.readString();
						let hashAlgo;
						switch (keyAlgo) {
							case "rsa-sha2-256":
								realKeyAlgo = "ssh-rsa";
								hashAlgo = "sha256";
								break;
							case "rsa-sha2-512":
								realKeyAlgo = "ssh-rsa";
								hashAlgo = "sha512";
						}
						if (hasSig) {
							const blobEnd = bufferParser.pos();
							let signature = bufferParser.readString();
							if (signature !== void 0) {
								if (signature.length > 4 + keyAlgo.length + 4 && signature.utf8Slice(4, 4 + keyAlgo.length) === keyAlgo) signature = bufferSlice(signature, 4 + keyAlgo.length + 4);
								signature = sigSSHToASN1(signature, realKeyAlgo);
								if (signature) {
									const sessionID = self._kex.sessionID;
									const blob = Buffer.allocUnsafe(4 + sessionID.length + blobEnd);
									writeUInt32BE(blob, sessionID.length, 0);
									blob.set(sessionID, 4);
									blob.set(new Uint8Array(payload.buffer, payload.byteOffset, blobEnd), 4 + sessionID.length);
									methodData = {
										keyAlgo: realKeyAlgo,
										key,
										signature,
										blob,
										hashAlgo
									};
								}
							}
						} else {
							methodData = {
								keyAlgo: realKeyAlgo,
								key,
								hashAlgo
							};
							methodDesc = "publickey -- check";
						}
					}
					break;
				}
				case "hostbased": {
					const keyAlgo = bufferParser.readString(true);
					let realKeyAlgo = keyAlgo;
					const key = bufferParser.readString();
					const localHostname = bufferParser.readString(true);
					const localUsername = bufferParser.readString(true);
					let hashAlgo;
					switch (keyAlgo) {
						case "rsa-sha2-256":
							realKeyAlgo = "ssh-rsa";
							hashAlgo = "sha256";
							break;
						case "rsa-sha2-512":
							realKeyAlgo = "ssh-rsa";
							hashAlgo = "sha512";
					}
					const blobEnd = bufferParser.pos();
					let signature = bufferParser.readString();
					if (signature !== void 0) {
						if (signature.length > 4 + keyAlgo.length + 4 && signature.utf8Slice(4, 4 + keyAlgo.length) === keyAlgo) signature = bufferSlice(signature, 4 + keyAlgo.length + 4);
						signature = sigSSHToASN1(signature, realKeyAlgo);
						if (signature !== void 0) {
							const sessionID = self._kex.sessionID;
							const blob = Buffer.allocUnsafe(4 + sessionID.length + blobEnd);
							writeUInt32BE(blob, sessionID.length, 0);
							blob.set(sessionID, 4);
							blob.set(new Uint8Array(payload.buffer, payload.byteOffset, blobEnd), 4 + sessionID.length);
							methodData = {
								keyAlgo: realKeyAlgo,
								key,
								signature,
								blob,
								localHostname,
								localUsername,
								hashAlgo
							};
						}
					}
					break;
				}
				case "keyboard-interactive":
					bufferParser.skipString();
					methodData = bufferParser.readList();
					break;
				default: if (method !== void 0) methodData = bufferParser.readRaw();
			}
			bufferParser.clear();
			if (methodData === void 0) return doFatalError(self, "Inbound: Malformed USERAUTH_REQUEST packet");
			if (methodDesc === void 0) methodDesc = method;
			self._authsQueue.push(method);
			self._debug && self._debug(`Inbound: Received USERAUTH_REQUEST (${methodDesc})`);
			const handler = self._handlers.USERAUTH_REQUEST;
			handler && handler(self, user, service, method, methodData);
		},
		[MESSAGE.USERAUTH_FAILURE]: (self, payload) => {
			bufferParser.init(payload, 1);
			const authMethods = bufferParser.readList();
			const partialSuccess = bufferParser.readBool();
			bufferParser.clear();
			if (partialSuccess === void 0) return doFatalError(self, "Inbound: Malformed USERAUTH_FAILURE packet");
			self._debug && self._debug(`Inbound: Received USERAUTH_FAILURE (${authMethods})`);
			self._authsQueue.shift();
			const handler = self._handlers.USERAUTH_FAILURE;
			handler && handler(self, authMethods, partialSuccess);
		},
		[MESSAGE.USERAUTH_SUCCESS]: (self, payload) => {
			self._debug && self._debug("Inbound: Received USERAUTH_SUCCESS");
			self._authsQueue.shift();
			const handler = self._handlers.USERAUTH_SUCCESS;
			handler && handler(self);
		},
		[MESSAGE.USERAUTH_BANNER]: (self, payload) => {
			bufferParser.init(payload, 1);
			const msg = bufferParser.readString(true);
			const lang = bufferParser.readString();
			bufferParser.clear();
			if (lang === void 0) return doFatalError(self, "Inbound: Malformed USERAUTH_BANNER packet");
			self._debug && self._debug("Inbound: Received USERAUTH_BANNER");
			const handler = self._handlers.USERAUTH_BANNER;
			handler && handler(self, msg);
		},
		60: (self, payload) => {
			if (!self._authsQueue.length) {
				self._debug && self._debug("Inbound: Received payload type 60 without auth");
				return;
			}
			switch (self._authsQueue[0]) {
				case "password": {
					bufferParser.init(payload, 1);
					const prompt = bufferParser.readString(true);
					const lang = bufferParser.readString();
					bufferParser.clear();
					if (lang === void 0) return doFatalError(self, "Inbound: Malformed USERAUTH_PASSWD_CHANGEREQ packet");
					self._debug && self._debug("Inbound: Received USERAUTH_PASSWD_CHANGEREQ");
					const handler = self._handlers.USERAUTH_PASSWD_CHANGEREQ;
					handler && handler(self, prompt);
					break;
				}
				case "publickey": {
					bufferParser.init(payload, 1);
					const keyAlgo = bufferParser.readString(true);
					const key = bufferParser.readString();
					bufferParser.clear();
					if (key === void 0) return doFatalError(self, "Inbound: Malformed USERAUTH_PK_OK packet");
					self._debug && self._debug("Inbound: Received USERAUTH_PK_OK");
					self._authsQueue.shift();
					const handler = self._handlers.USERAUTH_PK_OK;
					handler && handler(self, keyAlgo, key);
					break;
				}
				case "keyboard-interactive": {
					bufferParser.init(payload, 1);
					const name = bufferParser.readString(true);
					const instructions = bufferParser.readString(true);
					bufferParser.readString();
					const numPrompts = bufferParser.readUInt32BE();
					let prompts;
					if (numPrompts !== void 0) {
						prompts = new Array(numPrompts);
						let i = 0;
						for (; i < numPrompts; ++i) {
							const prompt = bufferParser.readString(true);
							const echo = bufferParser.readBool();
							if (echo === void 0) break;
							prompts[i] = {
								prompt,
								echo
							};
						}
						if (i !== numPrompts) prompts = void 0;
					}
					bufferParser.clear();
					if (prompts === void 0) return doFatalError(self, "Inbound: Malformed USERAUTH_INFO_REQUEST packet");
					self._debug && self._debug("Inbound: Received USERAUTH_INFO_REQUEST");
					const handler = self._handlers.USERAUTH_INFO_REQUEST;
					handler && handler(self, name, instructions, prompts);
					break;
				}
				default: self._debug && self._debug("Inbound: Received unexpected payload type 60");
			}
		},
		61: (self, payload) => {
			if (!self._authsQueue.length) {
				self._debug && self._debug("Inbound: Received payload type 61 without auth");
				return;
			}
			if (self._authsQueue[0] !== "keyboard-interactive") return doFatalError(self, "Inbound: Received unexpected payload type 61");
			bufferParser.init(payload, 1);
			const numResponses = bufferParser.readUInt32BE();
			let responses;
			if (numResponses !== void 0) {
				responses = new Array(numResponses);
				let i = 0;
				for (; i < numResponses; ++i) {
					const response = bufferParser.readString(true);
					if (response === void 0) break;
					responses[i] = response;
				}
				if (i !== numResponses) responses = void 0;
			}
			bufferParser.clear();
			if (responses === void 0) return doFatalError(self, "Inbound: Malformed USERAUTH_INFO_RESPONSE packet");
			self._debug && self._debug("Inbound: Received USERAUTH_INFO_RESPONSE");
			const handler = self._handlers.USERAUTH_INFO_RESPONSE;
			handler && handler(self, responses);
		},
		[MESSAGE.GLOBAL_REQUEST]: (self, payload) => {
			bufferParser.init(payload, 1);
			const name = bufferParser.readString(true);
			const wantReply = bufferParser.readBool();
			let data;
			if (wantReply !== void 0) switch (name) {
				case "tcpip-forward":
				case "cancel-tcpip-forward": {
					const bindAddr = bufferParser.readString(true);
					const bindPort = bufferParser.readUInt32BE();
					if (bindPort !== void 0) data = {
						bindAddr,
						bindPort
					};
					break;
				}
				case "streamlocal-forward@openssh.com":
				case "cancel-streamlocal-forward@openssh.com": {
					const socketPath = bufferParser.readString(true);
					if (socketPath !== void 0) data = { socketPath };
					break;
				}
				case "no-more-sessions@openssh.com":
					data = null;
					break;
				case "hostkeys-00@openssh.com":
					data = [];
					while (bufferParser.avail() > 0) {
						const keyRaw = bufferParser.readString();
						if (keyRaw === void 0) {
							data = void 0;
							break;
						}
						const key = parseKey(keyRaw);
						if (!(key instanceof Error)) data.push(key);
					}
					break;
				default: data = bufferParser.readRaw();
			}
			bufferParser.clear();
			if (data === void 0) return doFatalError(self, "Inbound: Malformed GLOBAL_REQUEST packet");
			self._debug && self._debug(`Inbound: GLOBAL_REQUEST (${name})`);
			const handler = self._handlers.GLOBAL_REQUEST;
			if (handler) handler(self, name, wantReply, data);
			else self.requestFailure();
		},
		[MESSAGE.REQUEST_SUCCESS]: (self, payload) => {
			const data = payload.length > 1 ? bufferSlice(payload, 1) : null;
			self._debug && self._debug("Inbound: REQUEST_SUCCESS");
			const handler = self._handlers.REQUEST_SUCCESS;
			handler && handler(self, data);
		},
		[MESSAGE.REQUEST_FAILURE]: (self, payload) => {
			self._debug && self._debug("Inbound: Received REQUEST_FAILURE");
			const handler = self._handlers.REQUEST_FAILURE;
			handler && handler(self);
		},
		[MESSAGE.CHANNEL_OPEN]: (self, payload) => {
			bufferParser.init(payload, 1);
			const type = bufferParser.readString(true);
			const sender = bufferParser.readUInt32BE();
			const window = bufferParser.readUInt32BE();
			const packetSize = bufferParser.readUInt32BE();
			let channelInfo;
			switch (type) {
				case "forwarded-tcpip":
				case "direct-tcpip": {
					const destIP = bufferParser.readString(true);
					const destPort = bufferParser.readUInt32BE();
					const srcIP = bufferParser.readString(true);
					const srcPort = bufferParser.readUInt32BE();
					if (srcPort !== void 0) channelInfo = {
						type,
						sender,
						window,
						packetSize,
						data: {
							destIP,
							destPort,
							srcIP,
							srcPort
						}
					};
					break;
				}
				case "forwarded-streamlocal@openssh.com":
				case "direct-streamlocal@openssh.com": {
					const socketPath = bufferParser.readString(true);
					if (socketPath !== void 0) channelInfo = {
						type,
						sender,
						window,
						packetSize,
						data: { socketPath }
					};
					break;
				}
				case "x11": {
					const srcIP = bufferParser.readString(true);
					const srcPort = bufferParser.readUInt32BE();
					if (srcPort !== void 0) channelInfo = {
						type,
						sender,
						window,
						packetSize,
						data: {
							srcIP,
							srcPort
						}
					};
					break;
				}
				default: channelInfo = {
					type,
					sender,
					window,
					packetSize,
					data: {}
				};
			}
			bufferParser.clear();
			if (channelInfo === void 0) return doFatalError(self, "Inbound: Malformed CHANNEL_OPEN packet");
			self._debug && self._debug(`Inbound: CHANNEL_OPEN (s:${sender}, ${type})`);
			const handler = self._handlers.CHANNEL_OPEN;
			if (handler) handler(self, channelInfo);
			else self.channelOpenFail(channelInfo.sender, CHANNEL_OPEN_FAILURE.ADMINISTRATIVELY_PROHIBITED, "", "");
		},
		[MESSAGE.CHANNEL_OPEN_CONFIRMATION]: (self, payload) => {
			bufferParser.init(payload, 1);
			const recipient = bufferParser.readUInt32BE();
			const sender = bufferParser.readUInt32BE();
			const window = bufferParser.readUInt32BE();
			const packetSize = bufferParser.readUInt32BE();
			const data = bufferParser.avail() ? bufferParser.readRaw() : void 0;
			bufferParser.clear();
			if (packetSize === void 0) return doFatalError(self, "Inbound: Malformed CHANNEL_OPEN_CONFIRMATION packet");
			self._debug && self._debug(`Inbound: CHANNEL_OPEN_CONFIRMATION (r:${recipient}, s:${sender})`);
			const handler = self._handlers.CHANNEL_OPEN_CONFIRMATION;
			if (handler) handler(self, {
				recipient,
				sender,
				window,
				packetSize,
				data
			});
		},
		[MESSAGE.CHANNEL_OPEN_FAILURE]: (self, payload) => {
			bufferParser.init(payload, 1);
			const recipient = bufferParser.readUInt32BE();
			const reason = bufferParser.readUInt32BE();
			const description = bufferParser.readString(true);
			const lang = bufferParser.readString();
			bufferParser.clear();
			if (lang === void 0) return doFatalError(self, "Inbound: Malformed CHANNEL_OPEN_FAILURE packet");
			self._debug && self._debug(`Inbound: CHANNEL_OPEN_FAILURE (r:${recipient})`);
			const handler = self._handlers.CHANNEL_OPEN_FAILURE;
			handler && handler(self, recipient, reason, description);
		},
		[MESSAGE.CHANNEL_WINDOW_ADJUST]: (self, payload) => {
			bufferParser.init(payload, 1);
			const recipient = bufferParser.readUInt32BE();
			const bytesToAdd = bufferParser.readUInt32BE();
			bufferParser.clear();
			if (bytesToAdd === void 0) return doFatalError(self, "Inbound: Malformed CHANNEL_WINDOW_ADJUST packet");
			self._debug && self._debug(`Inbound: CHANNEL_WINDOW_ADJUST (r:${recipient}, ${bytesToAdd})`);
			const handler = self._handlers.CHANNEL_WINDOW_ADJUST;
			handler && handler(self, recipient, bytesToAdd);
		},
		[MESSAGE.CHANNEL_DATA]: (self, payload) => {
			bufferParser.init(payload, 1);
			const recipient = bufferParser.readUInt32BE();
			const data = bufferParser.readString();
			bufferParser.clear();
			if (data === void 0) return doFatalError(self, "Inbound: Malformed CHANNEL_DATA packet");
			self._debug && self._debug(`Inbound: CHANNEL_DATA (r:${recipient}, ${data.length})`);
			const handler = self._handlers.CHANNEL_DATA;
			handler && handler(self, recipient, data);
		},
		[MESSAGE.CHANNEL_EXTENDED_DATA]: (self, payload) => {
			bufferParser.init(payload, 1);
			const recipient = bufferParser.readUInt32BE();
			const type = bufferParser.readUInt32BE();
			const data = bufferParser.readString();
			bufferParser.clear();
			if (data === void 0) return doFatalError(self, "Inbound: Malformed CHANNEL_EXTENDED_DATA packet");
			self._debug && self._debug(`Inbound: CHANNEL_EXTENDED_DATA (r:${recipient}, ${data.length})`);
			const handler = self._handlers.CHANNEL_EXTENDED_DATA;
			handler && handler(self, recipient, data, type);
		},
		[MESSAGE.CHANNEL_EOF]: (self, payload) => {
			bufferParser.init(payload, 1);
			const recipient = bufferParser.readUInt32BE();
			bufferParser.clear();
			if (recipient === void 0) return doFatalError(self, "Inbound: Malformed CHANNEL_EOF packet");
			self._debug && self._debug(`Inbound: CHANNEL_EOF (r:${recipient})`);
			const handler = self._handlers.CHANNEL_EOF;
			handler && handler(self, recipient);
		},
		[MESSAGE.CHANNEL_CLOSE]: (self, payload) => {
			bufferParser.init(payload, 1);
			const recipient = bufferParser.readUInt32BE();
			bufferParser.clear();
			if (recipient === void 0) return doFatalError(self, "Inbound: Malformed CHANNEL_CLOSE packet");
			self._debug && self._debug(`Inbound: CHANNEL_CLOSE (r:${recipient})`);
			const handler = self._handlers.CHANNEL_CLOSE;
			handler && handler(self, recipient);
		},
		[MESSAGE.CHANNEL_REQUEST]: (self, payload) => {
			bufferParser.init(payload, 1);
			const recipient = bufferParser.readUInt32BE();
			const type = bufferParser.readString(true);
			const wantReply = bufferParser.readBool();
			let data;
			if (wantReply !== void 0) switch (type) {
				case "exit-status":
					data = bufferParser.readUInt32BE();
					self._debug && self._debug(`Inbound: CHANNEL_REQUEST (r:${recipient}, ${type}: ${data})`);
					break;
				case "exit-signal": {
					let signal;
					let coreDumped;
					if (self._compatFlags & COMPAT.OLD_EXIT) {
						const num = bufferParser.readUInt32BE();
						switch (num) {
							case 1:
								signal = "HUP";
								break;
							case 2:
								signal = "INT";
								break;
							case 3:
								signal = "QUIT";
								break;
							case 6:
								signal = "ABRT";
								break;
							case 9:
								signal = "KILL";
								break;
							case 14:
								signal = "ALRM";
								break;
							case 15:
								signal = "TERM";
								break;
							default: if (num !== void 0) signal = `UNKNOWN (${num})`;
						}
						coreDumped = false;
					} else {
						signal = bufferParser.readString(true);
						coreDumped = bufferParser.readBool();
						if (coreDumped === void 0) signal = void 0;
					}
					const errorMessage = bufferParser.readString(true);
					if (bufferParser.skipString() !== void 0) data = {
						signal,
						coreDumped,
						errorMessage
					};
					self._debug && self._debug(`Inbound: CHANNEL_REQUEST (r:${recipient}, ${type}: ${signal})`);
					break;
				}
				case "pty-req": {
					const term = bufferParser.readString(true);
					const cols = bufferParser.readUInt32BE();
					const rows = bufferParser.readUInt32BE();
					const width = bufferParser.readUInt32BE();
					const height = bufferParser.readUInt32BE();
					const modesBinary = bufferParser.readString();
					if (modesBinary !== void 0) {
						bufferParser.init(modesBinary, 1);
						let modes = {};
						while (bufferParser.avail()) {
							const opcode = bufferParser.readByte();
							if (opcode === TERMINAL_MODE.TTY_OP_END) break;
							const name = TERMINAL_MODE_BY_VALUE[opcode];
							const value = bufferParser.readUInt32BE();
							if (opcode === void 0 || name === void 0 || value === void 0) {
								modes = void 0;
								break;
							}
							modes[name] = value;
						}
						if (modes !== void 0) data = {
							term,
							cols,
							rows,
							width,
							height,
							modes
						};
					}
					self._debug && self._debug(`Inbound: CHANNEL_REQUEST (r:${recipient}, ${type})`);
					break;
				}
				case "window-change": {
					const cols = bufferParser.readUInt32BE();
					const rows = bufferParser.readUInt32BE();
					const width = bufferParser.readUInt32BE();
					const height = bufferParser.readUInt32BE();
					if (height !== void 0) data = {
						cols,
						rows,
						width,
						height
					};
					self._debug && self._debug(`Inbound: CHANNEL_REQUEST (r:${recipient}, ${type})`);
					break;
				}
				case "x11-req": {
					const single = bufferParser.readBool();
					const protocol = bufferParser.readString(true);
					const cookie = bufferParser.readString();
					const screen = bufferParser.readUInt32BE();
					if (screen !== void 0) data = {
						single,
						protocol,
						cookie,
						screen
					};
					self._debug && self._debug(`Inbound: CHANNEL_REQUEST (r:${recipient}, ${type})`);
					break;
				}
				case "env": {
					const name = bufferParser.readString(true);
					const value = bufferParser.readString(true);
					if (value !== void 0) data = {
						name,
						value
					};
					if (self._debug) self._debug(`Inbound: CHANNEL_REQUEST (r:${recipient}, ${type}: ${name}=${value})`);
					break;
				}
				case "shell":
					data = null;
					self._debug && self._debug(`Inbound: CHANNEL_REQUEST (r:${recipient}, ${type})`);
					break;
				case "exec":
					data = bufferParser.readString(true);
					self._debug && self._debug(`Inbound: CHANNEL_REQUEST (r:${recipient}, ${type}: ${data})`);
					break;
				case "subsystem":
					data = bufferParser.readString(true);
					self._debug && self._debug(`Inbound: CHANNEL_REQUEST (r:${recipient}, ${type}: ${data})`);
					break;
				case "signal":
					data = bufferParser.readString(true);
					self._debug && self._debug(`Inbound: CHANNEL_REQUEST (r:${recipient}, ${type}: ${data})`);
					break;
				case "xon-xoff":
					data = bufferParser.readBool();
					self._debug && self._debug(`Inbound: CHANNEL_REQUEST (r:${recipient}, ${type}: ${data})`);
					break;
				case "auth-agent-req@openssh.com":
					data = null;
					self._debug && self._debug(`Inbound: CHANNEL_REQUEST (r:${recipient}, ${type})`);
					break;
				default:
					data = bufferParser.avail() ? bufferParser.readRaw() : null;
					self._debug && self._debug(`Inbound: CHANNEL_REQUEST (r:${recipient}, ${type})`);
			}
			bufferParser.clear();
			if (data === void 0) return doFatalError(self, "Inbound: Malformed CHANNEL_REQUEST packet");
			const handler = self._handlers.CHANNEL_REQUEST;
			handler && handler(self, recipient, type, wantReply, data);
		},
		[MESSAGE.CHANNEL_SUCCESS]: (self, payload) => {
			bufferParser.init(payload, 1);
			const recipient = bufferParser.readUInt32BE();
			bufferParser.clear();
			if (recipient === void 0) return doFatalError(self, "Inbound: Malformed CHANNEL_SUCCESS packet");
			self._debug && self._debug(`Inbound: CHANNEL_SUCCESS (r:${recipient})`);
			const handler = self._handlers.CHANNEL_SUCCESS;
			handler && handler(self, recipient);
		},
		[MESSAGE.CHANNEL_FAILURE]: (self, payload) => {
			bufferParser.init(payload, 1);
			const recipient = bufferParser.readUInt32BE();
			bufferParser.clear();
			if (recipient === void 0) return doFatalError(self, "Inbound: Malformed CHANNEL_FAILURE packet");
			self._debug && self._debug(`Inbound: CHANNEL_FAILURE (r:${recipient})`);
			const handler = self._handlers.CHANNEL_FAILURE;
			handler && handler(self, recipient);
		}
	};
}));
// node_modules/ssh2/lib/protocol/handlers.js
var require_handlers = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const MESSAGE_HANDLERS = new Array(256);
	[require_kex().HANDLERS, require_handlers_misc()].forEach((handlers) => {
		for (let [type, handler] of Object.entries(handlers)) {
			type = +type;
			if (isFinite(type) && type >= 0 && type < MESSAGE_HANDLERS.length) MESSAGE_HANDLERS[type] = handler;
		}
	});
	module.exports = MESSAGE_HANDLERS;
}));
// node_modules/ssh2/lib/protocol/kex.js
var require_kex = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const { createDiffieHellman, createDiffieHellmanGroup, createECDH, createHash, createPublicKey, diffieHellman, generateKeyPairSync, randomFillSync } = __require("crypto");
	const { Ber } = require_lib$2();
	const { COMPAT, curve25519Supported, DEFAULT_KEX, DEFAULT_SERVER_HOST_KEY, DEFAULT_CIPHER, DEFAULT_MAC, DEFAULT_COMPRESSION, DISCONNECT_REASON, MESSAGE } = require_constants();
	const { CIPHER_INFO, createCipher, createDecipher, MAC_INFO } = require_crypto();
	const { parseDERKey } = require_keyParser();
	const { bufferFill, bufferParser, convertSignature, doFatalError, FastBuffer, sigSSHToASN1, writeUInt32BE } = require_utils$1();
	const { PacketReader, PacketWriter, ZlibPacketReader, ZlibPacketWriter } = require_zlib();
	let MESSAGE_HANDLERS;
	const GEX_MIN_BITS = 2048;
	const GEX_MAX_BITS = 8192;
	const EMPTY_BUFFER = Buffer.alloc(0);
	function kexinit(self) {
		let payload;
		if (self._compatFlags & COMPAT.BAD_DHGEX) {
			const entry = self._offer.lists.kex;
			let kex = entry.array;
			let found = false;
			for (let i = 0; i < kex.length; ++i) if (kex[i].includes("group-exchange")) {
				if (!found) {
					found = true;
					kex = kex.slice();
				}
				kex.splice(i--, 1);
			}
			if (found) {
				let len = 17 + self._offer.totalSize + 1 + 4;
				const newKexBuf = Buffer.from(kex.join(","));
				len -= entry.buffer.length - newKexBuf.length;
				const all = self._offer.lists.all;
				const rest = new Uint8Array(all.buffer, all.byteOffset + 4 + entry.buffer.length, all.length - (4 + entry.buffer.length));
				payload = Buffer.allocUnsafe(len);
				writeUInt32BE(payload, newKexBuf.length, 17);
				payload.set(newKexBuf, 21);
				payload.set(rest, 21 + newKexBuf.length);
			}
		}
		if (payload === void 0) {
			payload = Buffer.allocUnsafe(17 + self._offer.totalSize + 1 + 4);
			self._offer.copyAllTo(payload, 17);
		}
		self._debug && self._debug("Outbound: Sending KEXINIT");
		payload[0] = MESSAGE.KEXINIT;
		randomFillSync(payload, 1, 16);
		bufferFill(payload, 0, payload.length - 5);
		self._kexinit = payload;
		self._packetRW.write.allocStart = 0;
		{
			const p = self._packetRW.write.allocStartKEX;
			const packet = self._packetRW.write.alloc(payload.length, true);
			packet.set(payload, p);
			self._cipher.encrypt(self._packetRW.write.finalize(packet, true));
		}
	}
	function handleKexInit(self, payload) {
		const init = {
			kex: void 0,
			serverHostKey: void 0,
			cs: {
				cipher: void 0,
				mac: void 0,
				compress: void 0,
				lang: void 0
			},
			sc: {
				cipher: void 0,
				mac: void 0,
				compress: void 0,
				lang: void 0
			}
		};
		bufferParser.init(payload, 17);
		if ((init.kex = bufferParser.readList()) === void 0 || (init.serverHostKey = bufferParser.readList()) === void 0 || (init.cs.cipher = bufferParser.readList()) === void 0 || (init.sc.cipher = bufferParser.readList()) === void 0 || (init.cs.mac = bufferParser.readList()) === void 0 || (init.sc.mac = bufferParser.readList()) === void 0 || (init.cs.compress = bufferParser.readList()) === void 0 || (init.sc.compress = bufferParser.readList()) === void 0 || (init.cs.lang = bufferParser.readList()) === void 0 || (init.sc.lang = bufferParser.readList()) === void 0) {
			bufferParser.clear();
			return doFatalError(self, "Received malformed KEXINIT", "handshake", DISCONNECT_REASON.KEY_EXCHANGE_FAILED);
		}
		const pos = bufferParser.pos();
		const firstFollows = pos < payload.length && payload[pos] === 1;
		bufferParser.clear();
		const local = self._offer;
		const remote = init;
		let localKex = local.lists.kex.array;
		if (self._compatFlags & COMPAT.BAD_DHGEX) {
			let found = false;
			for (let i = 0; i < localKex.length; ++i) if (localKex[i].indexOf("group-exchange") !== -1) {
				if (!found) {
					found = true;
					localKex = localKex.slice();
				}
				localKex.splice(i--, 1);
			}
		}
		let clientList;
		let serverList;
		let i;
		const debug = self._debug;
		debug && debug("Inbound: Handshake in progress");
		debug && debug(`Handshake: (local) KEX method: ${localKex}`);
		debug && debug(`Handshake: (remote) KEX method: ${remote.kex}`);
		let remoteExtInfoEnabled;
		if (self._server) {
			serverList = localKex;
			clientList = remote.kex;
			remoteExtInfoEnabled = clientList.indexOf("ext-info-c") !== -1;
		} else {
			serverList = remote.kex;
			clientList = localKex;
			remoteExtInfoEnabled = serverList.indexOf("ext-info-s") !== -1;
		}
		if (self._strictMode === void 0) {
			if (self._server) self._strictMode = clientList.indexOf("kex-strict-c-v00@openssh.com") !== -1;
			else self._strictMode = serverList.indexOf("kex-strict-s-v00@openssh.com") !== -1;
			if (self._strictMode) {
				debug && debug("Handshake: strict KEX mode enabled");
				if (self._decipher.inSeqno !== 1) {
					if (debug) debug("Handshake: KEXINIT not first packet in strict KEX mode");
					return doFatalError(self, "Handshake failed: KEXINIT not first packet in strict KEX mode", "handshake", DISCONNECT_REASON.KEY_EXCHANGE_FAILED);
				}
			}
		}
		for (i = 0; i < clientList.length && serverList.indexOf(clientList[i]) === -1; ++i);
		if (i === clientList.length) {
			debug && debug("Handshake: no matching key exchange algorithm");
			return doFatalError(self, "Handshake failed: no matching key exchange algorithm", "handshake", DISCONNECT_REASON.KEY_EXCHANGE_FAILED);
		}
		init.kex = clientList[i];
		debug && debug(`Handshake: KEX algorithm: ${clientList[i]}`);
		if (firstFollows && (!remote.kex.length || clientList[i] !== remote.kex[0])) self._skipNextInboundPacket = true;
		const localSrvHostKey = local.lists.serverHostKey.array;
		debug && debug(`Handshake: (local) Host key format: ${localSrvHostKey}`);
		debug && debug(`Handshake: (remote) Host key format: ${remote.serverHostKey}`);
		if (self._server) {
			serverList = localSrvHostKey;
			clientList = remote.serverHostKey;
		} else {
			serverList = remote.serverHostKey;
			clientList = localSrvHostKey;
		}
		for (i = 0; i < clientList.length && serverList.indexOf(clientList[i]) === -1; ++i);
		if (i === clientList.length) {
			debug && debug("Handshake: No matching host key format");
			return doFatalError(self, "Handshake failed: no matching host key format", "handshake", DISCONNECT_REASON.KEY_EXCHANGE_FAILED);
		}
		init.serverHostKey = clientList[i];
		debug && debug(`Handshake: Host key format: ${clientList[i]}`);
		const localCSCipher = local.lists.cs.cipher.array;
		debug && debug(`Handshake: (local) C->S cipher: ${localCSCipher}`);
		debug && debug(`Handshake: (remote) C->S cipher: ${remote.cs.cipher}`);
		if (self._server) {
			serverList = localCSCipher;
			clientList = remote.cs.cipher;
		} else {
			serverList = remote.cs.cipher;
			clientList = localCSCipher;
		}
		for (i = 0; i < clientList.length && serverList.indexOf(clientList[i]) === -1; ++i);
		if (i === clientList.length) {
			debug && debug("Handshake: No matching C->S cipher");
			return doFatalError(self, "Handshake failed: no matching C->S cipher", "handshake", DISCONNECT_REASON.KEY_EXCHANGE_FAILED);
		}
		init.cs.cipher = clientList[i];
		debug && debug(`Handshake: C->S Cipher: ${clientList[i]}`);
		const localSCCipher = local.lists.sc.cipher.array;
		debug && debug(`Handshake: (local) S->C cipher: ${localSCCipher}`);
		debug && debug(`Handshake: (remote) S->C cipher: ${remote.sc.cipher}`);
		if (self._server) {
			serverList = localSCCipher;
			clientList = remote.sc.cipher;
		} else {
			serverList = remote.sc.cipher;
			clientList = localSCCipher;
		}
		for (i = 0; i < clientList.length && serverList.indexOf(clientList[i]) === -1; ++i);
		if (i === clientList.length) {
			debug && debug("Handshake: No matching S->C cipher");
			return doFatalError(self, "Handshake failed: no matching S->C cipher", "handshake", DISCONNECT_REASON.KEY_EXCHANGE_FAILED);
		}
		init.sc.cipher = clientList[i];
		debug && debug(`Handshake: S->C cipher: ${clientList[i]}`);
		const localCSMAC = local.lists.cs.mac.array;
		debug && debug(`Handshake: (local) C->S MAC: ${localCSMAC}`);
		debug && debug(`Handshake: (remote) C->S MAC: ${remote.cs.mac}`);
		if (CIPHER_INFO[init.cs.cipher].authLen > 0) {
			init.cs.mac = "";
			debug && debug("Handshake: C->S MAC: <implicit>");
		} else {
			if (self._server) {
				serverList = localCSMAC;
				clientList = remote.cs.mac;
			} else {
				serverList = remote.cs.mac;
				clientList = localCSMAC;
			}
			for (i = 0; i < clientList.length && serverList.indexOf(clientList[i]) === -1; ++i);
			if (i === clientList.length) {
				debug && debug("Handshake: No matching C->S MAC");
				return doFatalError(self, "Handshake failed: no matching C->S MAC", "handshake", DISCONNECT_REASON.KEY_EXCHANGE_FAILED);
			}
			init.cs.mac = clientList[i];
			debug && debug(`Handshake: C->S MAC: ${clientList[i]}`);
		}
		const localSCMAC = local.lists.sc.mac.array;
		debug && debug(`Handshake: (local) S->C MAC: ${localSCMAC}`);
		debug && debug(`Handshake: (remote) S->C MAC: ${remote.sc.mac}`);
		if (CIPHER_INFO[init.sc.cipher].authLen > 0) {
			init.sc.mac = "";
			debug && debug("Handshake: S->C MAC: <implicit>");
		} else {
			if (self._server) {
				serverList = localSCMAC;
				clientList = remote.sc.mac;
			} else {
				serverList = remote.sc.mac;
				clientList = localSCMAC;
			}
			for (i = 0; i < clientList.length && serverList.indexOf(clientList[i]) === -1; ++i);
			if (i === clientList.length) {
				debug && debug("Handshake: No matching S->C MAC");
				return doFatalError(self, "Handshake failed: no matching S->C MAC", "handshake", DISCONNECT_REASON.KEY_EXCHANGE_FAILED);
			}
			init.sc.mac = clientList[i];
			debug && debug(`Handshake: S->C MAC: ${clientList[i]}`);
		}
		const localCSCompress = local.lists.cs.compress.array;
		debug && debug(`Handshake: (local) C->S compression: ${localCSCompress}`);
		debug && debug(`Handshake: (remote) C->S compression: ${remote.cs.compress}`);
		if (self._server) {
			serverList = localCSCompress;
			clientList = remote.cs.compress;
		} else {
			serverList = remote.cs.compress;
			clientList = localCSCompress;
		}
		for (i = 0; i < clientList.length && serverList.indexOf(clientList[i]) === -1; ++i);
		if (i === clientList.length) {
			debug && debug("Handshake: No matching C->S compression");
			return doFatalError(self, "Handshake failed: no matching C->S compression", "handshake", DISCONNECT_REASON.KEY_EXCHANGE_FAILED);
		}
		init.cs.compress = clientList[i];
		debug && debug(`Handshake: C->S compression: ${clientList[i]}`);
		const localSCCompress = local.lists.sc.compress.array;
		debug && debug(`Handshake: (local) S->C compression: ${localSCCompress}`);
		debug && debug(`Handshake: (remote) S->C compression: ${remote.sc.compress}`);
		if (self._server) {
			serverList = localSCCompress;
			clientList = remote.sc.compress;
		} else {
			serverList = remote.sc.compress;
			clientList = localSCCompress;
		}
		for (i = 0; i < clientList.length && serverList.indexOf(clientList[i]) === -1; ++i);
		if (i === clientList.length) {
			debug && debug("Handshake: No matching S->C compression");
			return doFatalError(self, "Handshake failed: no matching S->C compression", "handshake", DISCONNECT_REASON.KEY_EXCHANGE_FAILED);
		}
		init.sc.compress = clientList[i];
		debug && debug(`Handshake: S->C compression: ${clientList[i]}`);
		init.cs.lang = "";
		init.sc.lang = "";
		if (self._kex) {
			if (!self._kexinit) kexinit(self);
			self._decipher._onPayload = onKEXPayload.bind(self, { firstPacket: false });
		}
		self._kex = createKeyExchange(init, self, payload);
		self._kex.remoteExtInfoEnabled = remoteExtInfoEnabled;
		self._kex.start();
	}
	const createKeyExchange = (() => {
		function convertToMpint(buf) {
			let idx = 0;
			let length = buf.length;
			while (buf[idx] === 0) {
				++idx;
				--length;
			}
			let newBuf;
			if (buf[idx] & 128) {
				newBuf = Buffer.allocUnsafe(1 + length);
				newBuf[0] = 0;
				buf.copy(newBuf, 1, idx);
				buf = newBuf;
			} else if (length !== buf.length) {
				newBuf = Buffer.allocUnsafe(length);
				buf.copy(newBuf, 0, idx);
				buf = newBuf;
			}
			return buf;
		}
		class KeyExchange {
			constructor(negotiated, protocol, remoteKexinit) {
				this._protocol = protocol;
				this.sessionID = protocol._kex ? protocol._kex.sessionID : void 0;
				this.negotiated = negotiated;
				this.remoteExtInfoEnabled = false;
				this._step = 1;
				this._public = null;
				this._dh = null;
				this._sentNEWKEYS = false;
				this._receivedNEWKEYS = false;
				this._finished = false;
				this._hostVerified = false;
				this._kexinit = protocol._kexinit;
				this._remoteKexinit = remoteKexinit;
				this._identRaw = protocol._identRaw;
				this._remoteIdentRaw = protocol._remoteIdentRaw;
				this._hostKey = void 0;
				this._dhData = void 0;
				this._sig = void 0;
			}
			finish(scOnly) {
				if (this._finished) return false;
				this._finished = true;
				const isServer = this._protocol._server;
				const negotiated = this.negotiated;
				const pubKey = this.convertPublicKey(this._dhData);
				let secret = this.computeSecret(this._dhData);
				if (secret instanceof Error) {
					secret.message = `Error while computing DH secret (${this.type}): ${secret.message}`;
					secret.level = "handshake";
					return doFatalError(this._protocol, secret, DISCONNECT_REASON.KEY_EXCHANGE_FAILED);
				}
				const hash = createHash(this.hashName);
				hashString(hash, isServer ? this._remoteIdentRaw : this._identRaw);
				hashString(hash, isServer ? this._identRaw : this._remoteIdentRaw);
				hashString(hash, isServer ? this._remoteKexinit : this._kexinit);
				hashString(hash, isServer ? this._kexinit : this._remoteKexinit);
				const serverPublicHostKey = isServer ? this._hostKey.getPublicSSH() : this._hostKey;
				hashString(hash, serverPublicHostKey);
				if (this.type === "groupex") {
					const params = this.getDHParams();
					const num = Buffer.allocUnsafe(4);
					writeUInt32BE(num, this._minBits, 0);
					hash.update(num);
					writeUInt32BE(num, this._prefBits, 0);
					hash.update(num);
					writeUInt32BE(num, this._maxBits, 0);
					hash.update(num);
					hashString(hash, params.prime);
					hashString(hash, params.generator);
				}
				hashString(hash, isServer ? pubKey : this.getPublicKey());
				const serverPublicKey = isServer ? this.getPublicKey() : pubKey;
				hashString(hash, serverPublicKey);
				hashString(hash, secret);
				const exchangeHash = hash.digest();
				if (!isServer) {
					bufferParser.init(this._sig, 0);
					const sigType = bufferParser.readString(true);
					if (!sigType) return doFatalError(this._protocol, "Malformed packet while reading signature", "handshake", DISCONNECT_REASON.KEY_EXCHANGE_FAILED);
					if (sigType !== negotiated.serverHostKey) return doFatalError(this._protocol, `Wrong signature type: ${sigType}, expected: ${negotiated.serverHostKey}`, "handshake", DISCONNECT_REASON.KEY_EXCHANGE_FAILED);
					let sigValue = bufferParser.readString();
					bufferParser.clear();
					if (sigValue === void 0) return doFatalError(this._protocol, "Malformed packet while reading signature", "handshake", DISCONNECT_REASON.KEY_EXCHANGE_FAILED);
					if (!(sigValue = sigSSHToASN1(sigValue, sigType))) return doFatalError(this._protocol, "Malformed signature", "handshake", DISCONNECT_REASON.KEY_EXCHANGE_FAILED);
					let parsedHostKey;
					{
						bufferParser.init(this._hostKey, 0);
						const name = bufferParser.readString(true);
						const hostKey = this._hostKey.slice(bufferParser.pos());
						bufferParser.clear();
						parsedHostKey = parseDERKey(hostKey, name);
						if (parsedHostKey instanceof Error) {
							parsedHostKey.level = "handshake";
							return doFatalError(this._protocol, parsedHostKey, DISCONNECT_REASON.KEY_EXCHANGE_FAILED);
						}
					}
					let hashAlgo;
					switch (this.negotiated.serverHostKey) {
						case "rsa-sha2-256":
							hashAlgo = "sha256";
							break;
						case "rsa-sha2-512": hashAlgo = "sha512";
					}
					this._protocol._debug && this._protocol._debug("Verifying signature ...");
					const verified = parsedHostKey.verify(exchangeHash, sigValue, hashAlgo);
					if (verified !== true) {
						if (verified instanceof Error) this._protocol._debug && this._protocol._debug(`Signature verification failed: ${verified.stack}`);
						else this._protocol._debug && this._protocol._debug("Signature verification failed");
						return doFatalError(this._protocol, "Handshake failed: signature verification failed", "handshake", DISCONNECT_REASON.KEY_EXCHANGE_FAILED);
					}
					this._protocol._debug && this._protocol._debug("Verified signature");
				} else {
					let hashAlgo;
					switch (this.negotiated.serverHostKey) {
						case "rsa-sha2-256":
							hashAlgo = "sha256";
							break;
						case "rsa-sha2-512": hashAlgo = "sha512";
					}
					this._protocol._debug && this._protocol._debug("Generating signature ...");
					let signature = this._hostKey.sign(exchangeHash, hashAlgo);
					if (signature instanceof Error) return doFatalError(this._protocol, `Handshake failed: signature generation failed for ${this._hostKey.type} host key: ${signature.message}`, "handshake", DISCONNECT_REASON.KEY_EXCHANGE_FAILED);
					signature = convertSignature(signature, this._hostKey.type);
					if (signature === false) return doFatalError(this._protocol, `Handshake failed: signature conversion failed for ${this._hostKey.type} host key`, "handshake", DISCONNECT_REASON.KEY_EXCHANGE_FAILED);
					const sigType = this.negotiated.serverHostKey;
					const sigTypeLen = Buffer.byteLength(sigType);
					const sigLen = 4 + sigTypeLen + 4 + signature.length;
					let p = this._protocol._packetRW.write.allocStartKEX;
					const packet = this._protocol._packetRW.write.alloc(5 + serverPublicHostKey.length + 4 + serverPublicKey.length + 4 + sigLen, true);
					packet[p] = MESSAGE.KEXDH_REPLY;
					writeUInt32BE(packet, serverPublicHostKey.length, ++p);
					packet.set(serverPublicHostKey, p += 4);
					writeUInt32BE(packet, serverPublicKey.length, p += serverPublicHostKey.length);
					packet.set(serverPublicKey, p += 4);
					writeUInt32BE(packet, sigLen, p += serverPublicKey.length);
					writeUInt32BE(packet, sigTypeLen, p += 4);
					packet.utf8Write(sigType, p += 4, sigTypeLen);
					writeUInt32BE(packet, signature.length, p += sigTypeLen);
					packet.set(signature, p += 4);
					if (this._protocol._debug) {
						let type;
						switch (this.type) {
							case "group":
								type = "KEXDH_REPLY";
								break;
							case "groupex":
								type = "KEXDH_GEX_REPLY";
								break;
							default: type = "KEXECDH_REPLY";
						}
						this._protocol._debug(`Outbound: Sending ${type}`);
					}
					this._protocol._cipher.encrypt(this._protocol._packetRW.write.finalize(packet, true));
				}
				if (isServer || !scOnly) trySendNEWKEYS(this);
				let hsCipherConfig;
				let hsWrite;
				const completeHandshake = (partial) => {
					if (hsCipherConfig) {
						trySendNEWKEYS(this);
						hsCipherConfig.outbound.seqno = this._protocol._cipher.outSeqno;
						this._protocol._cipher.free();
						this._protocol._cipher = createCipher(hsCipherConfig);
						this._protocol._packetRW.write = hsWrite;
						hsCipherConfig = void 0;
						hsWrite = void 0;
						this._protocol._onHandshakeComplete(negotiated);
						return false;
					}
					if (!this.sessionID) this.sessionID = exchangeHash;
					{
						const newSecret = Buffer.allocUnsafe(4 + secret.length);
						writeUInt32BE(newSecret, secret.length, 0);
						newSecret.set(secret, 4);
						secret = newSecret;
					}
					const csCipherInfo = CIPHER_INFO[negotiated.cs.cipher];
					const scCipherInfo = CIPHER_INFO[negotiated.sc.cipher];
					const csIV = generateKEXVal(csCipherInfo.ivLen, this.hashName, secret, exchangeHash, this.sessionID, "A");
					const scIV = generateKEXVal(scCipherInfo.ivLen, this.hashName, secret, exchangeHash, this.sessionID, "B");
					const csKey = generateKEXVal(csCipherInfo.keyLen, this.hashName, secret, exchangeHash, this.sessionID, "C");
					const scKey = generateKEXVal(scCipherInfo.keyLen, this.hashName, secret, exchangeHash, this.sessionID, "D");
					let csMacInfo;
					let csMacKey;
					if (!csCipherInfo.authLen) {
						csMacInfo = MAC_INFO[negotiated.cs.mac];
						csMacKey = generateKEXVal(csMacInfo.len, this.hashName, secret, exchangeHash, this.sessionID, "E");
					}
					let scMacInfo;
					let scMacKey;
					if (!scCipherInfo.authLen) {
						scMacInfo = MAC_INFO[negotiated.sc.mac];
						scMacKey = generateKEXVal(scMacInfo.len, this.hashName, secret, exchangeHash, this.sessionID, "F");
					}
					const config = {
						inbound: {
							onPayload: this._protocol._onPayload,
							seqno: this._protocol._decipher.inSeqno,
							decipherInfo: !isServer ? scCipherInfo : csCipherInfo,
							decipherIV: !isServer ? scIV : csIV,
							decipherKey: !isServer ? scKey : csKey,
							macInfo: !isServer ? scMacInfo : csMacInfo,
							macKey: !isServer ? scMacKey : csMacKey
						},
						outbound: {
							onWrite: this._protocol._onWrite,
							seqno: this._protocol._cipher.outSeqno,
							cipherInfo: isServer ? scCipherInfo : csCipherInfo,
							cipherIV: isServer ? scIV : csIV,
							cipherKey: isServer ? scKey : csKey,
							macInfo: isServer ? scMacInfo : csMacInfo,
							macKey: isServer ? scMacKey : csMacKey
						}
					};
					this._protocol._decipher.free();
					hsCipherConfig = config;
					this._protocol._decipher = createDecipher(config);
					const rw = {
						read: void 0,
						write: void 0
					};
					switch (negotiated.cs.compress) {
						case "zlib":
							if (isServer) rw.read = new ZlibPacketReader();
							else rw.write = new ZlibPacketWriter(this._protocol);
							break;
						case "zlib@openssh.com": if (this._protocol._authenticated) {
							if (isServer) rw.read = new ZlibPacketReader();
							else rw.write = new ZlibPacketWriter(this._protocol);
							break;
						}
						default: if (isServer) rw.read = new PacketReader();
						else rw.write = new PacketWriter(this._protocol);
					}
					switch (negotiated.sc.compress) {
						case "zlib":
							if (isServer) rw.write = new ZlibPacketWriter(this._protocol);
							else rw.read = new ZlibPacketReader();
							break;
						case "zlib@openssh.com": if (this._protocol._authenticated) {
							if (isServer) rw.write = new ZlibPacketWriter(this._protocol);
							else rw.read = new ZlibPacketReader();
							break;
						}
						default: if (isServer) rw.write = new PacketWriter(this._protocol);
						else rw.read = new PacketReader();
					}
					this._protocol._packetRW.read.cleanup();
					this._protocol._packetRW.write.cleanup();
					this._protocol._packetRW.read = rw.read;
					hsWrite = rw.write;
					this._public = null;
					this._dh = null;
					this._kexinit = this._protocol._kexinit = void 0;
					this._remoteKexinit = void 0;
					this._identRaw = void 0;
					this._remoteIdentRaw = void 0;
					this._hostKey = void 0;
					this._dhData = void 0;
					this._sig = void 0;
					if (!partial) return completeHandshake();
					return false;
				};
				if (isServer || scOnly) this.finish = completeHandshake;
				if (!isServer) return completeHandshake(scOnly);
			}
			start() {
				if (!this._protocol._server) {
					if (this._protocol._debug) {
						let type;
						switch (this.type) {
							case "group":
								type = "KEXDH_INIT";
								break;
							default: type = "KEXECDH_INIT";
						}
						this._protocol._debug(`Outbound: Sending ${type}`);
					}
					const pubKey = this.getPublicKey();
					let p = this._protocol._packetRW.write.allocStartKEX;
					const packet = this._protocol._packetRW.write.alloc(5 + pubKey.length, true);
					packet[p] = MESSAGE.KEXDH_INIT;
					writeUInt32BE(packet, pubKey.length, ++p);
					packet.set(pubKey, p += 4);
					this._protocol._cipher.encrypt(this._protocol._packetRW.write.finalize(packet, true));
				}
			}
			getPublicKey() {
				this.generateKeys();
				const key = this._public;
				if (key) return this.convertPublicKey(key);
			}
			convertPublicKey(key) {
				let newKey;
				let idx = 0;
				let len = key.length;
				while (key[idx] === 0) {
					++idx;
					--len;
				}
				if (key[idx] & 128) {
					newKey = Buffer.allocUnsafe(1 + len);
					newKey[0] = 0;
					key.copy(newKey, 1, idx);
					return newKey;
				}
				if (len !== key.length) {
					newKey = Buffer.allocUnsafe(len);
					key.copy(newKey, 0, idx);
					key = newKey;
				}
				return key;
			}
			computeSecret(otherPublicKey) {
				this.generateKeys();
				try {
					return convertToMpint(this._dh.computeSecret(otherPublicKey));
				} catch (ex) {
					return ex;
				}
			}
			parse(payload) {
				const type = payload[0];
				switch (this._step) {
					case 1:
						if (this._protocol._server) {
							if (type !== MESSAGE.KEXDH_INIT) return doFatalError(this._protocol, `Received packet ${type} instead of ${MESSAGE.KEXDH_INIT}`, "handshake", DISCONNECT_REASON.KEY_EXCHANGE_FAILED);
							this._protocol._debug && this._protocol._debug("Received DH Init");
							bufferParser.init(payload, 1);
							const dhData = bufferParser.readString();
							bufferParser.clear();
							if (dhData === void 0) return doFatalError(this._protocol, "Received malformed KEX*_INIT", "handshake", DISCONNECT_REASON.KEY_EXCHANGE_FAILED);
							this._dhData = dhData;
							let hostKey = this._protocol._hostKeys[this.negotiated.serverHostKey];
							if (Array.isArray(hostKey)) hostKey = hostKey[0];
							this._hostKey = hostKey;
							this.finish();
						} else {
							if (type !== MESSAGE.KEXDH_REPLY) return doFatalError(this._protocol, `Received packet ${type} instead of ${MESSAGE.KEXDH_REPLY}`, "handshake", DISCONNECT_REASON.KEY_EXCHANGE_FAILED);
							this._protocol._debug && this._protocol._debug("Received DH Reply");
							bufferParser.init(payload, 1);
							let hostPubKey;
							let dhData;
							let sig;
							if ((hostPubKey = bufferParser.readString()) === void 0 || (dhData = bufferParser.readString()) === void 0 || (sig = bufferParser.readString()) === void 0) {
								bufferParser.clear();
								return doFatalError(this._protocol, "Received malformed KEX*_REPLY", "handshake", DISCONNECT_REASON.KEY_EXCHANGE_FAILED);
							}
							bufferParser.clear();
							bufferParser.init(hostPubKey, 0);
							const hostPubKeyType = bufferParser.readString(true);
							bufferParser.clear();
							if (hostPubKeyType === void 0) return doFatalError(this._protocol, "Received malformed host public key", "handshake", DISCONNECT_REASON.KEY_EXCHANGE_FAILED);
							if (hostPubKeyType !== this.negotiated.serverHostKey) switch (this.negotiated.serverHostKey) {
								case "rsa-sha2-256":
								case "rsa-sha2-512": if (hostPubKeyType === "ssh-rsa") break;
								default: return doFatalError(this._protocol, "Host key does not match negotiated type", "handshake", DISCONNECT_REASON.KEY_EXCHANGE_FAILED);
							}
							this._hostKey = hostPubKey;
							this._dhData = dhData;
							this._sig = sig;
							let checked = false;
							let ret;
							if (this._protocol._hostVerifier === void 0) {
								ret = true;
								this._protocol._debug && this._protocol._debug("Host accepted by default (no verification)");
							} else ret = this._protocol._hostVerifier(hostPubKey, (permitted) => {
								if (checked) return;
								checked = true;
								if (permitted === false) {
									this._protocol._debug && this._protocol._debug("Host denied (verification failed)");
									return doFatalError(this._protocol, "Host denied (verification failed)", "handshake", DISCONNECT_REASON.KEY_EXCHANGE_FAILED);
								}
								this._protocol._debug && this._protocol._debug("Host accepted (verified)");
								this._hostVerified = true;
								if (this._receivedNEWKEYS) this.finish();
								else trySendNEWKEYS(this);
							});
							if (ret === void 0) {
								++this._step;
								return;
							}
							checked = true;
							if (ret === false) {
								this._protocol._debug && this._protocol._debug("Host denied (verification failed)");
								return doFatalError(this._protocol, "Host denied (verification failed)", "handshake", DISCONNECT_REASON.KEY_EXCHANGE_FAILED);
							}
							this._protocol._debug && this._protocol._debug("Host accepted (verified)");
							this._hostVerified = true;
							trySendNEWKEYS(this);
						}
						++this._step;
						break;
					case 2:
						if (type !== MESSAGE.NEWKEYS) return doFatalError(this._protocol, `Received packet ${type} instead of ${MESSAGE.NEWKEYS}`, "handshake", DISCONNECT_REASON.KEY_EXCHANGE_FAILED);
						this._protocol._debug && this._protocol._debug("Inbound: NEWKEYS");
						this._receivedNEWKEYS = true;
						if (this._protocol._strictMode) this._protocol._decipher.inSeqno = 0;
						++this._step;
						return this.finish(!this._protocol._server && !this._hostVerified);
					default: return doFatalError(this._protocol, `Received unexpected packet ${type} after NEWKEYS`, "handshake", DISCONNECT_REASON.KEY_EXCHANGE_FAILED);
				}
			}
		}
		class Curve25519Exchange extends KeyExchange {
			constructor(hashName, ...args) {
				super(...args);
				this.type = "25519";
				this.hashName = hashName;
				this._keys = null;
			}
			generateKeys() {
				if (!this._keys) this._keys = generateKeyPairSync("x25519");
			}
			getPublicKey() {
				this.generateKeys();
				return this._keys.publicKey.export({
					type: "spki",
					format: "der"
				}).slice(-32);
			}
			convertPublicKey(key) {
				let newKey;
				let idx = 0;
				let len = key.length;
				while (key[idx] === 0) {
					++idx;
					--len;
				}
				if (key.length === 32) return key;
				if (len !== key.length) {
					newKey = Buffer.allocUnsafe(len);
					key.copy(newKey, 0, idx);
					key = newKey;
				}
				return key;
			}
			computeSecret(otherPublicKey) {
				this.generateKeys();
				try {
					const asnWriter = new Ber.Writer();
					asnWriter.startSequence();
					asnWriter.startSequence();
					asnWriter.writeOID("1.3.101.110");
					asnWriter.endSequence();
					asnWriter.startSequence(Ber.BitString);
					asnWriter.writeByte(0);
					asnWriter._ensure(otherPublicKey.length);
					otherPublicKey.copy(asnWriter._buf, asnWriter._offset, 0, otherPublicKey.length);
					asnWriter._offset += otherPublicKey.length;
					asnWriter.endSequence();
					asnWriter.endSequence();
					return convertToMpint(diffieHellman({
						privateKey: this._keys.privateKey,
						publicKey: createPublicKey({
							key: asnWriter.buffer,
							type: "spki",
							format: "der"
						})
					}));
				} catch (ex) {
					return ex;
				}
			}
		}
		class ECDHExchange extends KeyExchange {
			constructor(curveName, hashName, ...args) {
				super(...args);
				this.type = "ecdh";
				this.curveName = curveName;
				this.hashName = hashName;
			}
			generateKeys() {
				if (!this._dh) {
					this._dh = createECDH(this.curveName);
					this._public = this._dh.generateKeys();
				}
			}
		}
		class DHGroupExchange extends KeyExchange {
			constructor(hashName, ...args) {
				super(...args);
				this.type = "groupex";
				this.hashName = hashName;
				this._prime = null;
				this._generator = null;
				this._minBits = GEX_MIN_BITS;
				this._prefBits = dhEstimate(this.negotiated);
				if (this._protocol._compatFlags & COMPAT.BUG_DHGEX_LARGE) this._prefBits = Math.min(this._prefBits, 4096);
				this._maxBits = GEX_MAX_BITS;
			}
			start() {
				if (this._protocol._server) return;
				this._protocol._debug && this._protocol._debug("Outbound: Sending KEXDH_GEX_REQUEST");
				let p = this._protocol._packetRW.write.allocStartKEX;
				const packet = this._protocol._packetRW.write.alloc(13, true);
				packet[p] = MESSAGE.KEXDH_GEX_REQUEST;
				writeUInt32BE(packet, this._minBits, ++p);
				writeUInt32BE(packet, this._prefBits, p += 4);
				writeUInt32BE(packet, this._maxBits, p += 4);
				this._protocol._cipher.encrypt(this._protocol._packetRW.write.finalize(packet, true));
			}
			generateKeys() {
				if (!this._dh && this._prime && this._generator) {
					this._dh = createDiffieHellman(this._prime, this._generator);
					this._public = this._dh.generateKeys();
				}
			}
			setDHParams(prime, generator) {
				if (!Buffer.isBuffer(prime)) throw new Error("Invalid prime value");
				if (!Buffer.isBuffer(generator)) throw new Error("Invalid generator value");
				this._prime = prime;
				this._generator = generator;
			}
			getDHParams() {
				if (this._dh) return {
					prime: convertToMpint(this._dh.getPrime()),
					generator: convertToMpint(this._dh.getGenerator())
				};
			}
			parse(payload) {
				const type = payload[0];
				switch (this._step) {
					case 1: {
						if (this._protocol._server) {
							if (type !== MESSAGE.KEXDH_GEX_REQUEST) return doFatalError(this._protocol, `Received packet ${type} instead of ` + MESSAGE.KEXDH_GEX_REQUEST, "handshake", DISCONNECT_REASON.KEY_EXCHANGE_FAILED);
							return doFatalError(this._protocol, "Group exchange not implemented for server", "handshake", DISCONNECT_REASON.KEY_EXCHANGE_FAILED);
						}
						if (type !== MESSAGE.KEXDH_GEX_GROUP) return doFatalError(this._protocol, `Received packet ${type} instead of ${MESSAGE.KEXDH_GEX_GROUP}`, "handshake", DISCONNECT_REASON.KEY_EXCHANGE_FAILED);
						this._protocol._debug && this._protocol._debug("Received DH GEX Group");
						bufferParser.init(payload, 1);
						let prime;
						let gen;
						if ((prime = bufferParser.readString()) === void 0 || (gen = bufferParser.readString()) === void 0) {
							bufferParser.clear();
							return doFatalError(this._protocol, "Received malformed KEXDH_GEX_GROUP", "handshake", DISCONNECT_REASON.KEY_EXCHANGE_FAILED);
						}
						bufferParser.clear();
						this.setDHParams(prime, gen);
						this.generateKeys();
						const pubkey = this.getPublicKey();
						this._protocol._debug && this._protocol._debug("Outbound: Sending KEXDH_GEX_INIT");
						let p = this._protocol._packetRW.write.allocStartKEX;
						const packet = this._protocol._packetRW.write.alloc(5 + pubkey.length, true);
						packet[p] = MESSAGE.KEXDH_GEX_INIT;
						writeUInt32BE(packet, pubkey.length, ++p);
						packet.set(pubkey, p += 4);
						this._protocol._cipher.encrypt(this._protocol._packetRW.write.finalize(packet, true));
						++this._step;
						break;
					}
					case 2:
						if (this._protocol._server) {
							if (type !== MESSAGE.KEXDH_GEX_INIT) return doFatalError(this._protocol, `Received packet ${type} instead of ${MESSAGE.KEXDH_GEX_INIT}`, "handshake", DISCONNECT_REASON.KEY_EXCHANGE_FAILED);
							this._protocol._debug && this._protocol._debug("Received DH GEX Init");
							return doFatalError(this._protocol, "Group exchange not implemented for server", "handshake", DISCONNECT_REASON.KEY_EXCHANGE_FAILED);
						} else if (type !== MESSAGE.KEXDH_GEX_REPLY) return doFatalError(this._protocol, `Received packet ${type} instead of ${MESSAGE.KEXDH_GEX_REPLY}`, "handshake", DISCONNECT_REASON.KEY_EXCHANGE_FAILED);
						this._protocol._debug && this._protocol._debug("Received DH GEX Reply");
						this._step = 1;
						payload[0] = MESSAGE.KEXDH_REPLY;
						this.parse = KeyExchange.prototype.parse;
						this.parse(payload);
				}
			}
		}
		class DHExchange extends KeyExchange {
			constructor(groupName, hashName, ...args) {
				super(...args);
				this.type = "group";
				this.groupName = groupName;
				this.hashName = hashName;
			}
			start() {
				if (!this._protocol._server) {
					this._protocol._debug && this._protocol._debug("Outbound: Sending KEXDH_INIT");
					const pubKey = this.getPublicKey();
					let p = this._protocol._packetRW.write.allocStartKEX;
					const packet = this._protocol._packetRW.write.alloc(5 + pubKey.length, true);
					packet[p] = MESSAGE.KEXDH_INIT;
					writeUInt32BE(packet, pubKey.length, ++p);
					packet.set(pubKey, p += 4);
					this._protocol._cipher.encrypt(this._protocol._packetRW.write.finalize(packet, true));
				}
			}
			generateKeys() {
				if (!this._dh) {
					this._dh = createDiffieHellmanGroup(this.groupName);
					this._public = this._dh.generateKeys();
				}
			}
			getDHParams() {
				if (this._dh) return {
					prime: convertToMpint(this._dh.getPrime()),
					generator: convertToMpint(this._dh.getGenerator())
				};
			}
		}
		return (negotiated, ...args) => {
			if (typeof negotiated !== "object" || negotiated === null) throw new Error("Invalid negotiated argument");
			const kexType = negotiated.kex;
			if (typeof kexType === "string") {
				args = [negotiated, ...args];
				switch (kexType) {
					case "curve25519-sha256":
					case "curve25519-sha256@libssh.org":
						if (!curve25519Supported) break;
						return new Curve25519Exchange("sha256", ...args);
					case "ecdh-sha2-nistp256": return new ECDHExchange("prime256v1", "sha256", ...args);
					case "ecdh-sha2-nistp384": return new ECDHExchange("secp384r1", "sha384", ...args);
					case "ecdh-sha2-nistp521": return new ECDHExchange("secp521r1", "sha512", ...args);
					case "diffie-hellman-group1-sha1": return new DHExchange("modp2", "sha1", ...args);
					case "diffie-hellman-group14-sha1": return new DHExchange("modp14", "sha1", ...args);
					case "diffie-hellman-group14-sha256": return new DHExchange("modp14", "sha256", ...args);
					case "diffie-hellman-group15-sha512": return new DHExchange("modp15", "sha512", ...args);
					case "diffie-hellman-group16-sha512": return new DHExchange("modp16", "sha512", ...args);
					case "diffie-hellman-group17-sha512": return new DHExchange("modp17", "sha512", ...args);
					case "diffie-hellman-group18-sha512": return new DHExchange("modp18", "sha512", ...args);
					case "diffie-hellman-group-exchange-sha1": return new DHGroupExchange("sha1", ...args);
					case "diffie-hellman-group-exchange-sha256": return new DHGroupExchange("sha256", ...args);
				}
				throw new Error(`Unsupported key exchange algorithm: ${kexType}`);
			}
			throw new Error(`Invalid key exchange type: ${kexType}`);
		};
	})();
	const KexInit = (() => {
		const KEX_PROPERTY_NAMES = [
			"kex",
			"serverHostKey",
			["cs", "cipher"],
			["sc", "cipher"],
			["cs", "mac"],
			["sc", "mac"],
			["cs", "compress"],
			["sc", "compress"],
			["cs", "lang"],
			["sc", "lang"]
		];
		return class KexInit {
			constructor(obj) {
				if (typeof obj !== "object" || obj === null) throw new TypeError("Argument must be an object");
				const lists = {
					kex: void 0,
					serverHostKey: void 0,
					cs: {
						cipher: void 0,
						mac: void 0,
						compress: void 0,
						lang: void 0
					},
					sc: {
						cipher: void 0,
						mac: void 0,
						compress: void 0,
						lang: void 0
					},
					all: void 0
				};
				let totalSize = 0;
				for (const prop of KEX_PROPERTY_NAMES) {
					let base;
					let val;
					let desc;
					let key;
					if (typeof prop === "string") {
						base = lists;
						val = obj[prop];
						desc = key = prop;
					} else {
						const parent = prop[0];
						base = lists[parent];
						key = prop[1];
						val = obj[parent][key];
						desc = `${parent}.${key}`;
					}
					const entry = {
						array: void 0,
						buffer: void 0
					};
					if (Buffer.isBuffer(val)) {
						entry.array = ("" + val).split(",");
						entry.buffer = val;
						totalSize += 4 + val.length;
					} else {
						if (typeof val === "string") val = val.split(",");
						if (Array.isArray(val)) {
							entry.array = val;
							entry.buffer = Buffer.from(val.join(","));
						} else throw new TypeError(`Invalid \`${desc}\` type: ${typeof val}`);
						totalSize += 4 + entry.buffer.length;
					}
					base[key] = entry;
				}
				const all = Buffer.allocUnsafe(totalSize);
				lists.all = all;
				let allPos = 0;
				for (const prop of KEX_PROPERTY_NAMES) {
					let data;
					if (typeof prop === "string") data = lists[prop].buffer;
					else data = lists[prop[0]][prop[1]].buffer;
					allPos = writeUInt32BE(all, data.length, allPos);
					all.set(data, allPos);
					allPos += data.length;
				}
				this.totalSize = totalSize;
				this.lists = lists;
			}
			copyAllTo(buf, offset) {
				const src = this.lists.all;
				if (typeof offset !== "number") throw new TypeError(`Invalid offset value: ${typeof offset}`);
				if (buf.length - offset < src.length) throw new Error("Insufficient space to copy list");
				buf.set(src, offset);
				return src.length;
			}
		};
	})();
	const hashString = (() => {
		const LEN = Buffer.allocUnsafe(4);
		return (hash, buf) => {
			writeUInt32BE(LEN, buf.length, 0);
			hash.update(LEN);
			hash.update(buf);
		};
	})();
	function generateKEXVal(len, hashName, secret, exchangeHash, sessionID, char) {
		let ret;
		if (len) {
			let digest = createHash(hashName).update(secret).update(exchangeHash).update(char).update(sessionID).digest();
			while (digest.length < len) {
				const chunk = createHash(hashName).update(secret).update(exchangeHash).update(digest).digest();
				const extended = Buffer.allocUnsafe(digest.length + chunk.length);
				extended.set(digest, 0);
				extended.set(chunk, digest.length);
				digest = extended;
			}
			if (digest.length === len) ret = digest;
			else ret = new FastBuffer(digest.buffer, digest.byteOffset, len);
		} else ret = EMPTY_BUFFER;
		return ret;
	}
	function onKEXPayload(state, payload) {
		if (payload.length === 0) {
			this._debug && this._debug("Inbound: Skipping empty packet payload");
			return;
		}
		if (this._skipNextInboundPacket) {
			this._skipNextInboundPacket = false;
			return;
		}
		payload = this._packetRW.read.read(payload);
		const type = payload[0];
		if (!this._strictMode) switch (type) {
			case MESSAGE.IGNORE:
			case MESSAGE.UNIMPLEMENTED:
			case MESSAGE.DEBUG:
				if (!MESSAGE_HANDLERS) MESSAGE_HANDLERS = require_handlers();
				return MESSAGE_HANDLERS[type](this, payload);
		}
		switch (type) {
			case MESSAGE.DISCONNECT:
				if (!MESSAGE_HANDLERS) MESSAGE_HANDLERS = require_handlers();
				return MESSAGE_HANDLERS[type](this, payload);
			case MESSAGE.KEXINIT:
				if (!state.firstPacket) return doFatalError(this, "Received extra KEXINIT during handshake", "handshake", DISCONNECT_REASON.KEY_EXCHANGE_FAILED);
				state.firstPacket = false;
				return handleKexInit(this, payload);
			default: if (type < 20 || type > 49) return doFatalError(this, `Received unexpected packet type ${type}`, "handshake", DISCONNECT_REASON.KEY_EXCHANGE_FAILED);
		}
		return this._kex.parse(payload);
	}
	function dhEstimate(neg) {
		const csCipher = CIPHER_INFO[neg.cs.cipher];
		const scCipher = CIPHER_INFO[neg.sc.cipher];
		const bits = Math.max(0, csCipher.sslName === "des-ede3-cbc" ? 14 : csCipher.keyLen, csCipher.blockLen, csCipher.ivLen, scCipher.sslName === "des-ede3-cbc" ? 14 : scCipher.keyLen, scCipher.blockLen, scCipher.ivLen) * 8;
		if (bits <= 112) return 2048;
		if (bits <= 128) return 3072;
		if (bits <= 192) return 7680;
		return 8192;
	}
	function trySendNEWKEYS(kex) {
		if (!kex._sentNEWKEYS) {
			kex._protocol._debug && kex._protocol._debug("Outbound: Sending NEWKEYS");
			const p = kex._protocol._packetRW.write.allocStartKEX;
			const packet = kex._protocol._packetRW.write.alloc(1, true);
			packet[p] = MESSAGE.NEWKEYS;
			kex._protocol._cipher.encrypt(kex._protocol._packetRW.write.finalize(packet, true));
			kex._sentNEWKEYS = true;
			if (kex._protocol._strictMode) kex._protocol._cipher.outSeqno = 0;
		}
	}
	module.exports = {
		KexInit,
		kexinit,
		onKEXPayload,
		DEFAULT_KEXINIT_CLIENT: new KexInit({
			kex: DEFAULT_KEX.concat(["ext-info-c", "kex-strict-c-v00@openssh.com"]),
			serverHostKey: DEFAULT_SERVER_HOST_KEY,
			cs: {
				cipher: DEFAULT_CIPHER,
				mac: DEFAULT_MAC,
				compress: DEFAULT_COMPRESSION,
				lang: []
			},
			sc: {
				cipher: DEFAULT_CIPHER,
				mac: DEFAULT_MAC,
				compress: DEFAULT_COMPRESSION,
				lang: []
			}
		}),
		DEFAULT_KEXINIT_SERVER: new KexInit({
			kex: DEFAULT_KEX.concat(["kex-strict-s-v00@openssh.com"]),
			serverHostKey: DEFAULT_SERVER_HOST_KEY,
			cs: {
				cipher: DEFAULT_CIPHER,
				mac: DEFAULT_MAC,
				compress: DEFAULT_COMPRESSION,
				lang: []
			},
			sc: {
				cipher: DEFAULT_CIPHER,
				mac: DEFAULT_MAC,
				compress: DEFAULT_COMPRESSION,
				lang: []
			}
		}),
		HANDLERS: { [MESSAGE.KEXINIT]: handleKexInit }
	};
}));
// node_modules/ssh2/package.json
var require_package = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = {
		"name": "ssh2",
		"version": "1.17.0",
		"author": "Brian White <mscdex@mscdex.net>",
		"description": "SSH2 client and server modules written in pure JavaScript for node.js",
		"main": "./lib/index.js",
		"engines": { "node": ">=10.16.0" },
		"dependencies": {
			"asn1": "^0.2.6",
			"bcrypt-pbkdf": "^1.0.2"
		},
		"devDependencies": {
			"@mscdex/eslint-config": "^1.1.0",
			"eslint": "^7.32.0"
		},
		"optionalDependencies": {
			"cpu-features": "~0.0.10",
			"nan": "^2.23.0"
		},
		"scripts": {
			"install": "node install.js",
			"rebuild": "node install.js",
			"test": "node test/test.js",
			"lint": "eslint --cache --report-unused-disable-directives --ext=.js .eslintrc.js examples lib test",
			"lint:fix": "npm run lint -- --fix"
		},
		"keywords": [
			"ssh",
			"ssh2",
			"sftp",
			"secure",
			"shell",
			"exec",
			"remote",
			"client"
		],
		"licenses": [{
			"type": "MIT",
			"url": "http://github.com/mscdex/ssh2/raw/master/LICENSE"
		}],
		"repository": {
			"type": "git",
			"url": "http://github.com/mscdex/ssh2.git"
		}
	};
}));
// node_modules/ssh2/lib/protocol/Protocol.js
var require_Protocol = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const { inspect } = __require("util");
	const { bindingAvailable, NullCipher, NullDecipher } = require_crypto();
	const { COMPAT_CHECKS, DISCONNECT_REASON, eddsaSupported, MESSAGE, SIGNALS, TERMINAL_MODE } = require_constants();
	const { DEFAULT_KEXINIT_CLIENT, DEFAULT_KEXINIT_SERVER, KexInit, kexinit, onKEXPayload } = require_kex();
	const { parseKey } = require_keyParser();
	const MESSAGE_HANDLERS = require_handlers();
	const { bufferCopy, bufferFill, bufferSlice, convertSignature, sendPacket, writeUInt32BE } = require_utils$1();
	const { PacketReader, PacketWriter, ZlibPacketReader, ZlibPacketWriter } = require_zlib();
	const MODULE_VER = require_package().version;
	const VALID_DISCONNECT_REASONS = new Map(Object.values(DISCONNECT_REASON).map((n) => [n, 1]));
	const IDENT_RAW = Buffer.from(`SSH-2.0-ssh2js${MODULE_VER}`);
	const IDENT = Buffer.from(`${IDENT_RAW}\r\n`);
	const MAX_LINE_LEN = 8192;
	const MAX_LINES = 1024;
	const PING_PAYLOAD = Buffer.from([
		MESSAGE.GLOBAL_REQUEST,
		0,
		0,
		0,
		21,
		107,
		101,
		101,
		112,
		97,
		108,
		105,
		118,
		101,
		64,
		111,
		112,
		101,
		110,
		115,
		115,
		104,
		46,
		99,
		111,
		109,
		1
	]);
	const NO_TERMINAL_MODES_BUFFER = Buffer.from([TERMINAL_MODE.TTY_OP_END]);
	function noop() {}
	var Protocol = class {
		constructor(config) {
			const onWrite = config.onWrite;
			if (typeof onWrite !== "function") throw new Error("Missing onWrite function");
			this._onWrite = (data) => {
				onWrite(data);
			};
			const onError = config.onError;
			if (typeof onError !== "function") throw new Error("Missing onError function");
			this._onError = (err) => {
				onError(err);
			};
			const debug = config.debug;
			this._debug = typeof debug === "function" ? (msg) => {
				debug(msg);
			} : void 0;
			const onHeader = config.onHeader;
			this._onHeader = typeof onHeader === "function" ? (...args) => {
				onHeader(...args);
			} : noop;
			const onPacket = config.onPacket;
			this._onPacket = typeof onPacket === "function" ? () => {
				onPacket();
			} : noop;
			let onHandshakeComplete = config.onHandshakeComplete;
			if (typeof onHandshakeComplete !== "function") onHandshakeComplete = noop;
			let firstHandshake;
			this._onHandshakeComplete = (...args) => {
				this._debug && this._debug("Handshake completed");
				if (firstHandshake === void 0) firstHandshake = true;
				else firstHandshake = false;
				const oldQueue = this._queue;
				if (oldQueue) {
					this._queue = void 0;
					this._debug && this._debug(`Draining outbound queue (${oldQueue.length}) ...`);
					for (let i = 0; i < oldQueue.length; ++i) {
						const data = oldQueue[i];
						let finalized = this._packetRW.write.finalize(data);
						if (finalized === data) {
							const packet = this._cipher.allocPacket(data.length);
							packet.set(data, 5);
							finalized = packet;
						}
						sendPacket(this, finalized);
					}
					this._debug && this._debug("... finished draining outbound queue");
				}
				if (firstHandshake && this._server && this._kex.remoteExtInfoEnabled) sendExtInfo(this);
				onHandshakeComplete(...args);
			};
			this._queue = void 0;
			const messageHandlers = config.messageHandlers;
			if (typeof messageHandlers === "object" && messageHandlers !== null) this._handlers = messageHandlers;
			else this._handlers = {};
			this._onPayload = onPayload.bind(this);
			this._server = !!config.server;
			this._banner = void 0;
			let greeting;
			if (this._server) {
				if (typeof config.hostKeys !== "object" || config.hostKeys === null) throw new Error("Missing server host key(s)");
				this._hostKeys = config.hostKeys;
				if (typeof config.greeting === "string" && config.greeting.length) greeting = config.greeting.slice(-2) === "\r\n" ? config.greeting : `${config.greeting}\r\n`;
				if (typeof config.banner === "string" && config.banner.length) this._banner = config.banner.slice(-2) === "\r\n" ? config.banner : `${config.banner}\r\n`;
			} else this._hostKeys = void 0;
			let offer = config.offer;
			if (typeof offer !== "object" || offer === null) offer = this._server ? DEFAULT_KEXINIT_SERVER : DEFAULT_KEXINIT_CLIENT;
			else if (offer.constructor !== KexInit) {
				if (this._server) offer.kex = offer.kex.concat(["kex-strict-s-v00@openssh.com"]);
				else offer.kex = offer.kex.concat(["ext-info-c", "kex-strict-c-v00@openssh.com"]);
				offer = new KexInit(offer);
			}
			this._kex = void 0;
			this._strictMode = void 0;
			this._kexinit = void 0;
			this._offer = offer;
			this._cipher = new NullCipher(0, this._onWrite);
			this._decipher = void 0;
			this._skipNextInboundPacket = false;
			this._packetRW = {
				read: new PacketReader(),
				write: new PacketWriter(this)
			};
			this._hostVerifier = !this._server && typeof config.hostVerifier === "function" ? config.hostVerifier : void 0;
			this._parse = parseHeader;
			this._buffer = void 0;
			this._authsQueue = [];
			this._authenticated = false;
			this._remoteIdentRaw = void 0;
			let sentIdent;
			if (typeof config.ident === "string") {
				this._identRaw = Buffer.from(`SSH-2.0-${config.ident}`);
				sentIdent = Buffer.allocUnsafe(this._identRaw.length + 2);
				sentIdent.set(this._identRaw, 0);
				sentIdent[sentIdent.length - 2] = 13;
				sentIdent[sentIdent.length - 1] = 10;
			} else if (Buffer.isBuffer(config.ident)) {
				const fullIdent = Buffer.allocUnsafe(8 + config.ident.length);
				fullIdent.latin1Write("SSH-2.0-", 0, 8);
				fullIdent.set(config.ident, 8);
				this._identRaw = fullIdent;
				sentIdent = Buffer.allocUnsafe(fullIdent.length + 2);
				sentIdent.set(fullIdent, 0);
				sentIdent[sentIdent.length - 2] = 13;
				sentIdent[sentIdent.length - 1] = 10;
			} else {
				this._identRaw = IDENT_RAW;
				sentIdent = IDENT;
			}
			this._compatFlags = 0;
			if (this._debug) {
				if (bindingAvailable) this._debug("Custom crypto binding available");
				else this._debug("Custom crypto binding not available");
			}
			this._debug && this._debug(`Local ident: ${inspect(this._identRaw.toString())}`);
			this.start = () => {
				this.start = void 0;
				if (greeting) this._onWrite(greeting);
				this._onWrite(sentIdent);
			};
		}
		_destruct(reason) {
			this._packetRW.read.cleanup();
			this._packetRW.write.cleanup();
			this._cipher && this._cipher.free();
			this._decipher && this._decipher.free();
			if (typeof reason !== "string" || reason.length === 0) reason = "fatal error";
			this.parse = () => {
				throw new Error(`Instance unusable after ${reason}`);
			};
			this._onWrite = () => {
				throw new Error(`Instance unusable after ${reason}`);
			};
			this._destruct = void 0;
		}
		cleanup() {
			this._destruct && this._destruct();
		}
		parse(chunk, i, len) {
			while (i < len) i = this._parse(chunk, i, len);
		}
		disconnect(reason) {
			const pktLen = 13;
			let p = this._packetRW.write.allocStartKEX;
			const packet = this._packetRW.write.alloc(pktLen, true);
			const end = p + pktLen;
			if (!VALID_DISCONNECT_REASONS.has(reason)) reason = DISCONNECT_REASON.PROTOCOL_ERROR;
			packet[p] = MESSAGE.DISCONNECT;
			writeUInt32BE(packet, reason, ++p);
			packet.fill(0, p += 4, end);
			this._debug && this._debug(`Outbound: Sending DISCONNECT (${reason})`);
			sendPacket(this, this._packetRW.write.finalize(packet, true), true);
		}
		ping() {
			const p = this._packetRW.write.allocStart;
			const packet = this._packetRW.write.alloc(PING_PAYLOAD.length);
			packet.set(PING_PAYLOAD, p);
			this._debug && this._debug("Outbound: Sending ping (GLOBAL_REQUEST: keepalive@openssh.com)");
			sendPacket(this, this._packetRW.write.finalize(packet));
		}
		rekey() {
			if (this._kexinit === void 0) {
				this._debug && this._debug("Outbound: Initiated explicit rekey");
				this._queue = [];
				kexinit(this);
			} else this._debug && this._debug("Outbound: Ignoring rekey during handshake");
		}
		requestSuccess(data) {
			let p = this._packetRW.write.allocStart;
			let packet;
			if (Buffer.isBuffer(data)) {
				packet = this._packetRW.write.alloc(1 + data.length);
				packet[p] = MESSAGE.REQUEST_SUCCESS;
				packet.set(data, ++p);
			} else {
				packet = this._packetRW.write.alloc(1);
				packet[p] = MESSAGE.REQUEST_SUCCESS;
			}
			this._debug && this._debug("Outbound: Sending REQUEST_SUCCESS");
			sendPacket(this, this._packetRW.write.finalize(packet));
		}
		requestFailure() {
			const p = this._packetRW.write.allocStart;
			const packet = this._packetRW.write.alloc(1);
			packet[p] = MESSAGE.REQUEST_FAILURE;
			this._debug && this._debug("Outbound: Sending REQUEST_FAILURE");
			sendPacket(this, this._packetRW.write.finalize(packet));
		}
		channelSuccess(chan) {
			let p = this._packetRW.write.allocStart;
			const packet = this._packetRW.write.alloc(5);
			packet[p] = MESSAGE.CHANNEL_SUCCESS;
			writeUInt32BE(packet, chan, ++p);
			this._debug && this._debug(`Outbound: Sending CHANNEL_SUCCESS (r:${chan})`);
			sendPacket(this, this._packetRW.write.finalize(packet));
		}
		channelFailure(chan) {
			let p = this._packetRW.write.allocStart;
			const packet = this._packetRW.write.alloc(5);
			packet[p] = MESSAGE.CHANNEL_FAILURE;
			writeUInt32BE(packet, chan, ++p);
			this._debug && this._debug(`Outbound: Sending CHANNEL_FAILURE (r:${chan})`);
			sendPacket(this, this._packetRW.write.finalize(packet));
		}
		channelEOF(chan) {
			let p = this._packetRW.write.allocStart;
			const packet = this._packetRW.write.alloc(5);
			packet[p] = MESSAGE.CHANNEL_EOF;
			writeUInt32BE(packet, chan, ++p);
			this._debug && this._debug(`Outbound: Sending CHANNEL_EOF (r:${chan})`);
			sendPacket(this, this._packetRW.write.finalize(packet));
		}
		channelClose(chan) {
			let p = this._packetRW.write.allocStart;
			const packet = this._packetRW.write.alloc(5);
			packet[p] = MESSAGE.CHANNEL_CLOSE;
			writeUInt32BE(packet, chan, ++p);
			this._debug && this._debug(`Outbound: Sending CHANNEL_CLOSE (r:${chan})`);
			sendPacket(this, this._packetRW.write.finalize(packet));
		}
		channelWindowAdjust(chan, amount) {
			let p = this._packetRW.write.allocStart;
			const packet = this._packetRW.write.alloc(9);
			packet[p] = MESSAGE.CHANNEL_WINDOW_ADJUST;
			writeUInt32BE(packet, chan, ++p);
			writeUInt32BE(packet, amount, p += 4);
			this._debug && this._debug(`Outbound: Sending CHANNEL_WINDOW_ADJUST (r:${chan}, ${amount})`);
			sendPacket(this, this._packetRW.write.finalize(packet));
		}
		channelData(chan, data) {
			const isBuffer = Buffer.isBuffer(data);
			const dataLen = isBuffer ? data.length : Buffer.byteLength(data);
			let p = this._packetRW.write.allocStart;
			const packet = this._packetRW.write.alloc(9 + dataLen);
			packet[p] = MESSAGE.CHANNEL_DATA;
			writeUInt32BE(packet, chan, ++p);
			writeUInt32BE(packet, dataLen, p += 4);
			if (isBuffer) packet.set(data, p += 4);
			else packet.utf8Write(data, p += 4, dataLen);
			this._debug && this._debug(`Outbound: Sending CHANNEL_DATA (r:${chan}, ${dataLen})`);
			sendPacket(this, this._packetRW.write.finalize(packet));
		}
		channelExtData(chan, data, type) {
			const isBuffer = Buffer.isBuffer(data);
			const dataLen = isBuffer ? data.length : Buffer.byteLength(data);
			let p = this._packetRW.write.allocStart;
			const packet = this._packetRW.write.alloc(13 + dataLen);
			packet[p] = MESSAGE.CHANNEL_EXTENDED_DATA;
			writeUInt32BE(packet, chan, ++p);
			writeUInt32BE(packet, type, p += 4);
			writeUInt32BE(packet, dataLen, p += 4);
			if (isBuffer) packet.set(data, p += 4);
			else packet.utf8Write(data, p += 4, dataLen);
			this._debug && this._debug(`Outbound: Sending CHANNEL_EXTENDED_DATA (r:${chan})`);
			sendPacket(this, this._packetRW.write.finalize(packet));
		}
		channelOpenConfirm(remote, local, initWindow, maxPacket) {
			let p = this._packetRW.write.allocStart;
			const packet = this._packetRW.write.alloc(17);
			packet[p] = MESSAGE.CHANNEL_OPEN_CONFIRMATION;
			writeUInt32BE(packet, remote, ++p);
			writeUInt32BE(packet, local, p += 4);
			writeUInt32BE(packet, initWindow, p += 4);
			writeUInt32BE(packet, maxPacket, p += 4);
			this._debug && this._debug(`Outbound: Sending CHANNEL_OPEN_CONFIRMATION (r:${remote}, l:${local})`);
			sendPacket(this, this._packetRW.write.finalize(packet));
		}
		channelOpenFail(remote, reason, desc) {
			if (typeof desc !== "string") desc = "";
			const descLen = Buffer.byteLength(desc);
			let p = this._packetRW.write.allocStart;
			const packet = this._packetRW.write.alloc(13 + descLen + 4);
			packet[p] = MESSAGE.CHANNEL_OPEN_FAILURE;
			writeUInt32BE(packet, remote, ++p);
			writeUInt32BE(packet, reason, p += 4);
			writeUInt32BE(packet, descLen, p += 4);
			p += 4;
			if (descLen) {
				packet.utf8Write(desc, p, descLen);
				p += descLen;
			}
			writeUInt32BE(packet, 0, p);
			this._debug && this._debug(`Outbound: Sending CHANNEL_OPEN_FAILURE (r:${remote})`);
			sendPacket(this, this._packetRW.write.finalize(packet));
		}
		service(name) {
			if (this._server) throw new Error("Client-only method called in server mode");
			const nameLen = Buffer.byteLength(name);
			let p = this._packetRW.write.allocStart;
			const packet = this._packetRW.write.alloc(5 + nameLen);
			packet[p] = MESSAGE.SERVICE_REQUEST;
			writeUInt32BE(packet, nameLen, ++p);
			packet.utf8Write(name, p += 4, nameLen);
			this._debug && this._debug(`Outbound: Sending SERVICE_REQUEST (${name})`);
			sendPacket(this, this._packetRW.write.finalize(packet));
		}
		authPassword(username, password, newPassword) {
			if (this._server) throw new Error("Client-only method called in server mode");
			const userLen = Buffer.byteLength(username);
			const passLen = Buffer.byteLength(password);
			const newPassLen = newPassword ? Buffer.byteLength(newPassword) : 0;
			let p = this._packetRW.write.allocStart;
			const packet = this._packetRW.write.alloc(5 + userLen + 4 + 14 + 4 + 8 + 1 + 4 + passLen + (newPassword ? 4 + newPassLen : 0));
			packet[p] = MESSAGE.USERAUTH_REQUEST;
			writeUInt32BE(packet, userLen, ++p);
			packet.utf8Write(username, p += 4, userLen);
			writeUInt32BE(packet, 14, p += userLen);
			packet.utf8Write("ssh-connection", p += 4, 14);
			writeUInt32BE(packet, 8, p += 14);
			packet.utf8Write("password", p += 4, 8);
			packet[p += 8] = newPassword ? 1 : 0;
			writeUInt32BE(packet, passLen, ++p);
			if (Buffer.isBuffer(password)) bufferCopy(password, packet, 0, passLen, p += 4);
			else packet.utf8Write(password, p += 4, passLen);
			if (newPassword) {
				writeUInt32BE(packet, newPassLen, p += passLen);
				if (Buffer.isBuffer(newPassword)) bufferCopy(newPassword, packet, 0, newPassLen, p += 4);
				else packet.utf8Write(newPassword, p += 4, newPassLen);
				this._debug && this._debug("Outbound: Sending USERAUTH_REQUEST (changed password)");
			} else this._debug && this._debug("Outbound: Sending USERAUTH_REQUEST (password)");
			this._authsQueue.push("password");
			sendPacket(this, this._packetRW.write.finalize(packet));
		}
		authPK(username, pubKey, keyAlgo, cbSign) {
			if (this._server) throw new Error("Client-only method called in server mode");
			pubKey = parseKey(pubKey);
			if (pubKey instanceof Error) throw new Error("Invalid key");
			const keyType = pubKey.type;
			pubKey = pubKey.getPublicSSH();
			if (typeof keyAlgo === "function") {
				cbSign = keyAlgo;
				keyAlgo = void 0;
			}
			if (!keyAlgo) keyAlgo = keyType;
			const userLen = Buffer.byteLength(username);
			const algoLen = Buffer.byteLength(keyAlgo);
			const pubKeyLen = pubKey.length;
			const sessionID = this._kex.sessionID;
			const sesLen = sessionID.length;
			const payloadLen = (cbSign ? 4 + sesLen : 0) + 1 + 4 + userLen + 4 + 14 + 4 + 9 + 1 + 4 + algoLen + 4 + pubKeyLen;
			let packet;
			let p;
			if (cbSign) {
				packet = Buffer.allocUnsafe(payloadLen);
				p = 0;
				writeUInt32BE(packet, sesLen, p);
				packet.set(sessionID, p += 4);
				p += sesLen;
			} else {
				packet = this._packetRW.write.alloc(payloadLen);
				p = this._packetRW.write.allocStart;
			}
			packet[p] = MESSAGE.USERAUTH_REQUEST;
			writeUInt32BE(packet, userLen, ++p);
			packet.utf8Write(username, p += 4, userLen);
			writeUInt32BE(packet, 14, p += userLen);
			packet.utf8Write("ssh-connection", p += 4, 14);
			writeUInt32BE(packet, 9, p += 14);
			packet.utf8Write("publickey", p += 4, 9);
			packet[p += 9] = cbSign ? 1 : 0;
			writeUInt32BE(packet, algoLen, ++p);
			packet.utf8Write(keyAlgo, p += 4, algoLen);
			writeUInt32BE(packet, pubKeyLen, p += algoLen);
			packet.set(pubKey, p += 4);
			if (!cbSign) {
				this._authsQueue.push("publickey");
				this._debug && this._debug("Outbound: Sending USERAUTH_REQUEST (publickey -- check)");
				sendPacket(this, this._packetRW.write.finalize(packet));
				return;
			}
			cbSign(packet, (signature) => {
				signature = convertSignature(signature, keyType);
				if (signature === false) throw new Error("Error while converting handshake signature");
				const sigLen = signature.length;
				p = this._packetRW.write.allocStart;
				packet = this._packetRW.write.alloc(5 + userLen + 4 + 14 + 4 + 9 + 1 + 4 + algoLen + 4 + pubKeyLen + 4 + 4 + algoLen + 4 + sigLen);
				packet[p] = MESSAGE.USERAUTH_REQUEST;
				writeUInt32BE(packet, userLen, ++p);
				packet.utf8Write(username, p += 4, userLen);
				writeUInt32BE(packet, 14, p += userLen);
				packet.utf8Write("ssh-connection", p += 4, 14);
				writeUInt32BE(packet, 9, p += 14);
				packet.utf8Write("publickey", p += 4, 9);
				packet[p += 9] = 1;
				writeUInt32BE(packet, algoLen, ++p);
				packet.utf8Write(keyAlgo, p += 4, algoLen);
				writeUInt32BE(packet, pubKeyLen, p += algoLen);
				packet.set(pubKey, p += 4);
				writeUInt32BE(packet, 4 + algoLen + 4 + sigLen, p += pubKeyLen);
				writeUInt32BE(packet, algoLen, p += 4);
				packet.utf8Write(keyAlgo, p += 4, algoLen);
				writeUInt32BE(packet, sigLen, p += algoLen);
				packet.set(signature, p += 4);
				this._authsQueue.push("publickey");
				this._debug && this._debug("Outbound: Sending USERAUTH_REQUEST (publickey)");
				sendPacket(this, this._packetRW.write.finalize(packet));
			});
		}
		authHostbased(username, pubKey, hostname, userlocal, keyAlgo, cbSign) {
			if (this._server) throw new Error("Client-only method called in server mode");
			pubKey = parseKey(pubKey);
			if (pubKey instanceof Error) throw new Error("Invalid key");
			const keyType = pubKey.type;
			pubKey = pubKey.getPublicSSH();
			if (typeof keyAlgo === "function") {
				cbSign = keyAlgo;
				keyAlgo = void 0;
			}
			if (!keyAlgo) keyAlgo = keyType;
			const userLen = Buffer.byteLength(username);
			const algoLen = Buffer.byteLength(keyAlgo);
			const pubKeyLen = pubKey.length;
			const sessionID = this._kex.sessionID;
			const sesLen = sessionID.length;
			const hostnameLen = Buffer.byteLength(hostname);
			const userlocalLen = Buffer.byteLength(userlocal);
			const data = Buffer.allocUnsafe(4 + sesLen + 1 + 4 + userLen + 4 + 14 + 4 + 9 + 4 + algoLen + 4 + pubKeyLen + 4 + hostnameLen + 4 + userlocalLen);
			let p = 0;
			writeUInt32BE(data, sesLen, p);
			data.set(sessionID, p += 4);
			data[p += sesLen] = MESSAGE.USERAUTH_REQUEST;
			writeUInt32BE(data, userLen, ++p);
			data.utf8Write(username, p += 4, userLen);
			writeUInt32BE(data, 14, p += userLen);
			data.utf8Write("ssh-connection", p += 4, 14);
			writeUInt32BE(data, 9, p += 14);
			data.utf8Write("hostbased", p += 4, 9);
			writeUInt32BE(data, algoLen, p += 9);
			data.utf8Write(keyAlgo, p += 4, algoLen);
			writeUInt32BE(data, pubKeyLen, p += algoLen);
			data.set(pubKey, p += 4);
			writeUInt32BE(data, hostnameLen, p += pubKeyLen);
			data.utf8Write(hostname, p += 4, hostnameLen);
			writeUInt32BE(data, userlocalLen, p += hostnameLen);
			data.utf8Write(userlocal, p += 4, userlocalLen);
			cbSign(data, (signature) => {
				signature = convertSignature(signature, keyType);
				if (!signature) throw new Error("Error while converting handshake signature");
				const sigLen = signature.length;
				const reqDataLen = data.length - sesLen - 4;
				p = this._packetRW.write.allocStart;
				const packet = this._packetRW.write.alloc(reqDataLen + 4 + 4 + algoLen + 4 + sigLen);
				bufferCopy(data, packet, 4 + sesLen, data.length, p);
				writeUInt32BE(packet, 4 + algoLen + 4 + sigLen, p += reqDataLen);
				writeUInt32BE(packet, algoLen, p += 4);
				packet.utf8Write(keyAlgo, p += 4, algoLen);
				writeUInt32BE(packet, sigLen, p += algoLen);
				packet.set(signature, p += 4);
				this._authsQueue.push("hostbased");
				this._debug && this._debug("Outbound: Sending USERAUTH_REQUEST (hostbased)");
				sendPacket(this, this._packetRW.write.finalize(packet));
			});
		}
		authKeyboard(username) {
			if (this._server) throw new Error("Client-only method called in server mode");
			const userLen = Buffer.byteLength(username);
			let p = this._packetRW.write.allocStart;
			const packet = this._packetRW.write.alloc(5 + userLen + 4 + 14 + 4 + 20 + 4 + 4);
			packet[p] = MESSAGE.USERAUTH_REQUEST;
			writeUInt32BE(packet, userLen, ++p);
			packet.utf8Write(username, p += 4, userLen);
			writeUInt32BE(packet, 14, p += userLen);
			packet.utf8Write("ssh-connection", p += 4, 14);
			writeUInt32BE(packet, 20, p += 14);
			packet.utf8Write("keyboard-interactive", p += 4, 20);
			writeUInt32BE(packet, 0, p += 20);
			writeUInt32BE(packet, 0, p += 4);
			this._authsQueue.push("keyboard-interactive");
			this._debug && this._debug("Outbound: Sending USERAUTH_REQUEST (keyboard-interactive)");
			sendPacket(this, this._packetRW.write.finalize(packet));
		}
		authNone(username) {
			if (this._server) throw new Error("Client-only method called in server mode");
			const userLen = Buffer.byteLength(username);
			let p = this._packetRW.write.allocStart;
			const packet = this._packetRW.write.alloc(5 + userLen + 4 + 14 + 4 + 4);
			packet[p] = MESSAGE.USERAUTH_REQUEST;
			writeUInt32BE(packet, userLen, ++p);
			packet.utf8Write(username, p += 4, userLen);
			writeUInt32BE(packet, 14, p += userLen);
			packet.utf8Write("ssh-connection", p += 4, 14);
			writeUInt32BE(packet, 4, p += 14);
			packet.utf8Write("none", p += 4, 4);
			this._authsQueue.push("none");
			this._debug && this._debug("Outbound: Sending USERAUTH_REQUEST (none)");
			sendPacket(this, this._packetRW.write.finalize(packet));
		}
		authInfoRes(responses) {
			if (this._server) throw new Error("Client-only method called in server mode");
			let responsesTotalLen = 0;
			let responseLens;
			if (responses) {
				responseLens = new Array(responses.length);
				for (let i = 0; i < responses.length; ++i) {
					const len = Buffer.byteLength(responses[i]);
					responseLens[i] = len;
					responsesTotalLen += 4 + len;
				}
			}
			let p = this._packetRW.write.allocStart;
			const packet = this._packetRW.write.alloc(5 + responsesTotalLen);
			packet[p] = MESSAGE.USERAUTH_INFO_RESPONSE;
			if (responses) {
				writeUInt32BE(packet, responses.length, ++p);
				p += 4;
				for (let i = 0; i < responses.length; ++i) {
					const len = responseLens[i];
					writeUInt32BE(packet, len, p);
					p += 4;
					if (len) {
						packet.utf8Write(responses[i], p, len);
						p += len;
					}
				}
			} else writeUInt32BE(packet, 0, ++p);
			this._debug && this._debug("Outbound: Sending USERAUTH_INFO_RESPONSE");
			sendPacket(this, this._packetRW.write.finalize(packet));
		}
		tcpipForward(bindAddr, bindPort, wantReply) {
			if (this._server) throw new Error("Client-only method called in server mode");
			const addrLen = Buffer.byteLength(bindAddr);
			let p = this._packetRW.write.allocStart;
			const packet = this._packetRW.write.alloc(23 + addrLen + 4);
			packet[p] = MESSAGE.GLOBAL_REQUEST;
			writeUInt32BE(packet, 13, ++p);
			packet.utf8Write("tcpip-forward", p += 4, 13);
			packet[p += 13] = wantReply === void 0 || wantReply === true ? 1 : 0;
			writeUInt32BE(packet, addrLen, ++p);
			packet.utf8Write(bindAddr, p += 4, addrLen);
			writeUInt32BE(packet, bindPort, p += addrLen);
			this._debug && this._debug("Outbound: Sending GLOBAL_REQUEST (tcpip-forward)");
			sendPacket(this, this._packetRW.write.finalize(packet));
		}
		cancelTcpipForward(bindAddr, bindPort, wantReply) {
			if (this._server) throw new Error("Client-only method called in server mode");
			const addrLen = Buffer.byteLength(bindAddr);
			let p = this._packetRW.write.allocStart;
			const packet = this._packetRW.write.alloc(30 + addrLen + 4);
			packet[p] = MESSAGE.GLOBAL_REQUEST;
			writeUInt32BE(packet, 20, ++p);
			packet.utf8Write("cancel-tcpip-forward", p += 4, 20);
			packet[p += 20] = wantReply === void 0 || wantReply === true ? 1 : 0;
			writeUInt32BE(packet, addrLen, ++p);
			packet.utf8Write(bindAddr, p += 4, addrLen);
			writeUInt32BE(packet, bindPort, p += addrLen);
			this._debug && this._debug("Outbound: Sending GLOBAL_REQUEST (cancel-tcpip-forward)");
			sendPacket(this, this._packetRW.write.finalize(packet));
		}
		openssh_streamLocalForward(socketPath, wantReply) {
			if (this._server) throw new Error("Client-only method called in server mode");
			const socketPathLen = Buffer.byteLength(socketPath);
			let p = this._packetRW.write.allocStart;
			const packet = this._packetRW.write.alloc(41 + socketPathLen);
			packet[p] = MESSAGE.GLOBAL_REQUEST;
			writeUInt32BE(packet, 31, ++p);
			packet.utf8Write("streamlocal-forward@openssh.com", p += 4, 31);
			packet[p += 31] = wantReply === void 0 || wantReply === true ? 1 : 0;
			writeUInt32BE(packet, socketPathLen, ++p);
			packet.utf8Write(socketPath, p += 4, socketPathLen);
			this._debug && this._debug("Outbound: Sending GLOBAL_REQUEST (streamlocal-forward@openssh.com)");
			sendPacket(this, this._packetRW.write.finalize(packet));
		}
		openssh_cancelStreamLocalForward(socketPath, wantReply) {
			if (this._server) throw new Error("Client-only method called in server mode");
			const socketPathLen = Buffer.byteLength(socketPath);
			let p = this._packetRW.write.allocStart;
			const packet = this._packetRW.write.alloc(48 + socketPathLen);
			packet[p] = MESSAGE.GLOBAL_REQUEST;
			writeUInt32BE(packet, 38, ++p);
			packet.utf8Write("cancel-streamlocal-forward@openssh.com", p += 4, 38);
			packet[p += 38] = wantReply === void 0 || wantReply === true ? 1 : 0;
			writeUInt32BE(packet, socketPathLen, ++p);
			packet.utf8Write(socketPath, p += 4, socketPathLen);
			if (this._debug) this._debug("Outbound: Sending GLOBAL_REQUEST (cancel-streamlocal-forward@openssh.com)");
			sendPacket(this, this._packetRW.write.finalize(packet));
		}
		directTcpip(chan, initWindow, maxPacket, cfg) {
			if (this._server) throw new Error("Client-only method called in server mode");
			const srcLen = Buffer.byteLength(cfg.srcIP);
			const dstLen = Buffer.byteLength(cfg.dstIP);
			let p = this._packetRW.write.allocStart;
			const packet = this._packetRW.write.alloc(33 + srcLen + 4 + 4 + dstLen + 4);
			packet[p] = MESSAGE.CHANNEL_OPEN;
			writeUInt32BE(packet, 12, ++p);
			packet.utf8Write("direct-tcpip", p += 4, 12);
			writeUInt32BE(packet, chan, p += 12);
			writeUInt32BE(packet, initWindow, p += 4);
			writeUInt32BE(packet, maxPacket, p += 4);
			writeUInt32BE(packet, dstLen, p += 4);
			packet.utf8Write(cfg.dstIP, p += 4, dstLen);
			writeUInt32BE(packet, cfg.dstPort, p += dstLen);
			writeUInt32BE(packet, srcLen, p += 4);
			packet.utf8Write(cfg.srcIP, p += 4, srcLen);
			writeUInt32BE(packet, cfg.srcPort, p += srcLen);
			this._debug && this._debug(`Outbound: Sending CHANNEL_OPEN (r:${chan}, direct-tcpip)`);
			sendPacket(this, this._packetRW.write.finalize(packet));
		}
		openssh_directStreamLocal(chan, initWindow, maxPacket, cfg) {
			if (this._server) throw new Error("Client-only method called in server mode");
			const pathLen = Buffer.byteLength(cfg.socketPath);
			let p = this._packetRW.write.allocStart;
			const packet = this._packetRW.write.alloc(51 + pathLen + 4 + 4);
			packet[p] = MESSAGE.CHANNEL_OPEN;
			writeUInt32BE(packet, 30, ++p);
			packet.utf8Write("direct-streamlocal@openssh.com", p += 4, 30);
			writeUInt32BE(packet, chan, p += 30);
			writeUInt32BE(packet, initWindow, p += 4);
			writeUInt32BE(packet, maxPacket, p += 4);
			writeUInt32BE(packet, pathLen, p += 4);
			packet.utf8Write(cfg.socketPath, p += 4, pathLen);
			bufferFill(packet, 0, p += pathLen, p + 8);
			if (this._debug) this._debug(`Outbound: Sending CHANNEL_OPEN (r:${chan}, direct-streamlocal@openssh.com)`);
			sendPacket(this, this._packetRW.write.finalize(packet));
		}
		openssh_noMoreSessions(wantReply) {
			if (this._server) throw new Error("Client-only method called in server mode");
			let p = this._packetRW.write.allocStart;
			const packet = this._packetRW.write.alloc(34);
			packet[p] = MESSAGE.GLOBAL_REQUEST;
			writeUInt32BE(packet, 28, ++p);
			packet.utf8Write("no-more-sessions@openssh.com", p += 4, 28);
			packet[p += 28] = wantReply === void 0 || wantReply === true ? 1 : 0;
			this._debug && this._debug("Outbound: Sending GLOBAL_REQUEST (no-more-sessions@openssh.com)");
			sendPacket(this, this._packetRW.write.finalize(packet));
		}
		session(chan, initWindow, maxPacket) {
			if (this._server) throw new Error("Client-only method called in server mode");
			let p = this._packetRW.write.allocStart;
			const packet = this._packetRW.write.alloc(24);
			packet[p] = MESSAGE.CHANNEL_OPEN;
			writeUInt32BE(packet, 7, ++p);
			packet.utf8Write("session", p += 4, 7);
			writeUInt32BE(packet, chan, p += 7);
			writeUInt32BE(packet, initWindow, p += 4);
			writeUInt32BE(packet, maxPacket, p += 4);
			this._debug && this._debug(`Outbound: Sending CHANNEL_OPEN (r:${chan}, session)`);
			sendPacket(this, this._packetRW.write.finalize(packet));
		}
		windowChange(chan, rows, cols, height, width) {
			if (this._server) throw new Error("Client-only method called in server mode");
			let p = this._packetRW.write.allocStart;
			const packet = this._packetRW.write.alloc(39);
			packet[p] = MESSAGE.CHANNEL_REQUEST;
			writeUInt32BE(packet, chan, ++p);
			writeUInt32BE(packet, 13, p += 4);
			packet.utf8Write("window-change", p += 4, 13);
			packet[p += 13] = 0;
			writeUInt32BE(packet, cols, ++p);
			writeUInt32BE(packet, rows, p += 4);
			writeUInt32BE(packet, width, p += 4);
			writeUInt32BE(packet, height, p += 4);
			this._debug && this._debug(`Outbound: Sending CHANNEL_REQUEST (r:${chan}, window-change)`);
			sendPacket(this, this._packetRW.write.finalize(packet));
		}
		pty(chan, rows, cols, height, width, term, modes, wantReply) {
			if (this._server) throw new Error("Client-only method called in server mode");
			if (!term || !term.length) term = "vt100";
			if (modes && !Buffer.isBuffer(modes) && !Array.isArray(modes) && typeof modes === "object" && modes !== null) modes = modesToBytes(modes);
			if (!modes || !modes.length) modes = NO_TERMINAL_MODES_BUFFER;
			const termLen = term.length;
			const modesLen = modes.length;
			let p = this._packetRW.write.allocStart;
			const packet = this._packetRW.write.alloc(21 + termLen + 4 + 4 + 4 + 4 + 4 + modesLen);
			packet[p] = MESSAGE.CHANNEL_REQUEST;
			writeUInt32BE(packet, chan, ++p);
			writeUInt32BE(packet, 7, p += 4);
			packet.utf8Write("pty-req", p += 4, 7);
			packet[p += 7] = wantReply === void 0 || wantReply === true ? 1 : 0;
			writeUInt32BE(packet, termLen, ++p);
			packet.utf8Write(term, p += 4, termLen);
			writeUInt32BE(packet, cols, p += termLen);
			writeUInt32BE(packet, rows, p += 4);
			writeUInt32BE(packet, width, p += 4);
			writeUInt32BE(packet, height, p += 4);
			writeUInt32BE(packet, modesLen, p += 4);
			p += 4;
			if (Array.isArray(modes)) for (let i = 0; i < modesLen; ++i) packet[p++] = modes[i];
			else if (Buffer.isBuffer(modes)) packet.set(modes, p);
			this._debug && this._debug(`Outbound: Sending CHANNEL_REQUEST (r:${chan}, pty-req)`);
			sendPacket(this, this._packetRW.write.finalize(packet));
		}
		shell(chan, wantReply) {
			if (this._server) throw new Error("Client-only method called in server mode");
			let p = this._packetRW.write.allocStart;
			const packet = this._packetRW.write.alloc(15);
			packet[p] = MESSAGE.CHANNEL_REQUEST;
			writeUInt32BE(packet, chan, ++p);
			writeUInt32BE(packet, 5, p += 4);
			packet.utf8Write("shell", p += 4, 5);
			packet[p += 5] = wantReply === void 0 || wantReply === true ? 1 : 0;
			this._debug && this._debug(`Outbound: Sending CHANNEL_REQUEST (r:${chan}, shell)`);
			sendPacket(this, this._packetRW.write.finalize(packet));
		}
		exec(chan, cmd, wantReply) {
			if (this._server) throw new Error("Client-only method called in server mode");
			const isBuf = Buffer.isBuffer(cmd);
			const cmdLen = isBuf ? cmd.length : Buffer.byteLength(cmd);
			let p = this._packetRW.write.allocStart;
			const packet = this._packetRW.write.alloc(18 + cmdLen);
			packet[p] = MESSAGE.CHANNEL_REQUEST;
			writeUInt32BE(packet, chan, ++p);
			writeUInt32BE(packet, 4, p += 4);
			packet.utf8Write("exec", p += 4, 4);
			packet[p += 4] = wantReply === void 0 || wantReply === true ? 1 : 0;
			writeUInt32BE(packet, cmdLen, ++p);
			if (isBuf) packet.set(cmd, p += 4);
			else packet.utf8Write(cmd, p += 4, cmdLen);
			this._debug && this._debug(`Outbound: Sending CHANNEL_REQUEST (r:${chan}, exec: ${cmd})`);
			sendPacket(this, this._packetRW.write.finalize(packet));
		}
		signal(chan, signal) {
			if (this._server) throw new Error("Client-only method called in server mode");
			const origSignal = signal;
			signal = signal.toUpperCase();
			if (signal.slice(0, 3) === "SIG") signal = signal.slice(3);
			if (SIGNALS[signal] !== 1) throw new Error(`Invalid signal: ${origSignal}`);
			const signalLen = signal.length;
			let p = this._packetRW.write.allocStart;
			const packet = this._packetRW.write.alloc(20 + signalLen);
			packet[p] = MESSAGE.CHANNEL_REQUEST;
			writeUInt32BE(packet, chan, ++p);
			writeUInt32BE(packet, 6, p += 4);
			packet.utf8Write("signal", p += 4, 6);
			packet[p += 6] = 0;
			writeUInt32BE(packet, signalLen, ++p);
			packet.utf8Write(signal, p += 4, signalLen);
			this._debug && this._debug(`Outbound: Sending CHANNEL_REQUEST (r:${chan}, signal: ${signal})`);
			sendPacket(this, this._packetRW.write.finalize(packet));
		}
		env(chan, key, val, wantReply) {
			if (this._server) throw new Error("Client-only method called in server mode");
			const keyLen = Buffer.byteLength(key);
			const isBuf = Buffer.isBuffer(val);
			const valLen = isBuf ? val.length : Buffer.byteLength(val);
			let p = this._packetRW.write.allocStart;
			const packet = this._packetRW.write.alloc(17 + keyLen + 4 + valLen);
			packet[p] = MESSAGE.CHANNEL_REQUEST;
			writeUInt32BE(packet, chan, ++p);
			writeUInt32BE(packet, 3, p += 4);
			packet.utf8Write("env", p += 4, 3);
			packet[p += 3] = wantReply === void 0 || wantReply === true ? 1 : 0;
			writeUInt32BE(packet, keyLen, ++p);
			packet.utf8Write(key, p += 4, keyLen);
			writeUInt32BE(packet, valLen, p += keyLen);
			if (isBuf) packet.set(val, p += 4);
			else packet.utf8Write(val, p += 4, valLen);
			this._debug && this._debug(`Outbound: Sending CHANNEL_REQUEST (r:${chan}, env: ${key}=${val})`);
			sendPacket(this, this._packetRW.write.finalize(packet));
		}
		x11Forward(chan, cfg, wantReply) {
			if (this._server) throw new Error("Client-only method called in server mode");
			const protocol = cfg.protocol;
			const cookie = cfg.cookie;
			const isBufProto = Buffer.isBuffer(protocol);
			const protoLen = isBufProto ? protocol.length : Buffer.byteLength(protocol);
			const isBufCookie = Buffer.isBuffer(cookie);
			const cookieLen = isBufCookie ? cookie.length : Buffer.byteLength(cookie);
			let p = this._packetRW.write.allocStart;
			const packet = this._packetRW.write.alloc(22 + protoLen + 4 + cookieLen + 4);
			packet[p] = MESSAGE.CHANNEL_REQUEST;
			writeUInt32BE(packet, chan, ++p);
			writeUInt32BE(packet, 7, p += 4);
			packet.utf8Write("x11-req", p += 4, 7);
			packet[p += 7] = wantReply === void 0 || wantReply === true ? 1 : 0;
			packet[++p] = cfg.single ? 1 : 0;
			writeUInt32BE(packet, protoLen, ++p);
			if (isBufProto) packet.set(protocol, p += 4);
			else packet.utf8Write(protocol, p += 4, protoLen);
			writeUInt32BE(packet, cookieLen, p += protoLen);
			if (isBufCookie) packet.set(cookie, p += 4);
			else packet.latin1Write(cookie, p += 4, cookieLen);
			writeUInt32BE(packet, cfg.screen || 0, p += cookieLen);
			this._debug && this._debug(`Outbound: Sending CHANNEL_REQUEST (r:${chan}, x11-req)`);
			sendPacket(this, this._packetRW.write.finalize(packet));
		}
		subsystem(chan, name, wantReply) {
			if (this._server) throw new Error("Client-only method called in server mode");
			const nameLen = Buffer.byteLength(name);
			let p = this._packetRW.write.allocStart;
			const packet = this._packetRW.write.alloc(23 + nameLen);
			packet[p] = MESSAGE.CHANNEL_REQUEST;
			writeUInt32BE(packet, chan, ++p);
			writeUInt32BE(packet, 9, p += 4);
			packet.utf8Write("subsystem", p += 4, 9);
			packet[p += 9] = wantReply === void 0 || wantReply === true ? 1 : 0;
			writeUInt32BE(packet, nameLen, ++p);
			packet.utf8Write(name, p += 4, nameLen);
			this._debug && this._debug(`Outbound: Sending CHANNEL_REQUEST (r:${chan}, subsystem: ${name})`);
			sendPacket(this, this._packetRW.write.finalize(packet));
		}
		openssh_agentForward(chan, wantReply) {
			if (this._server) throw new Error("Client-only method called in server mode");
			let p = this._packetRW.write.allocStart;
			const packet = this._packetRW.write.alloc(36);
			packet[p] = MESSAGE.CHANNEL_REQUEST;
			writeUInt32BE(packet, chan, ++p);
			writeUInt32BE(packet, 26, p += 4);
			packet.utf8Write("auth-agent-req@openssh.com", p += 4, 26);
			packet[p += 26] = wantReply === void 0 || wantReply === true ? 1 : 0;
			if (this._debug) this._debug(`Outbound: Sending CHANNEL_REQUEST (r:${chan}, auth-agent-req@openssh.com)`);
			sendPacket(this, this._packetRW.write.finalize(packet));
		}
		openssh_hostKeysProve(keys) {
			if (this._server) throw new Error("Client-only method called in server mode");
			let keysTotal = 0;
			const publicKeys = [];
			for (const key of keys) {
				const publicKey = key.getPublicSSH();
				keysTotal += 4 + publicKey.length;
				publicKeys.push(publicKey);
			}
			let p = this._packetRW.write.allocStart;
			const packet = this._packetRW.write.alloc(35 + keysTotal);
			packet[p] = MESSAGE.GLOBAL_REQUEST;
			writeUInt32BE(packet, 29, ++p);
			packet.utf8Write("hostkeys-prove-00@openssh.com", p += 4, 29);
			packet[p += 29] = 1;
			++p;
			for (const buf of publicKeys) {
				writeUInt32BE(packet, buf.length, p);
				bufferCopy(buf, packet, 0, buf.length, p += 4);
				p += buf.length;
			}
			if (this._debug) this._debug("Outbound: Sending GLOBAL_REQUEST (hostkeys-prove-00@openssh.com)");
			sendPacket(this, this._packetRW.write.finalize(packet));
		}
		serviceAccept(svcName) {
			if (!this._server) throw new Error("Server-only method called in client mode");
			const svcNameLen = Buffer.byteLength(svcName);
			let p = this._packetRW.write.allocStart;
			const packet = this._packetRW.write.alloc(5 + svcNameLen);
			packet[p] = MESSAGE.SERVICE_ACCEPT;
			writeUInt32BE(packet, svcNameLen, ++p);
			packet.utf8Write(svcName, p += 4, svcNameLen);
			this._debug && this._debug(`Outbound: Sending SERVICE_ACCEPT (${svcName})`);
			sendPacket(this, this._packetRW.write.finalize(packet));
			if (this._server && this._banner && svcName === "ssh-userauth") {
				const banner = this._banner;
				this._banner = void 0;
				const bannerLen = Buffer.byteLength(banner);
				p = this._packetRW.write.allocStart;
				const packet = this._packetRW.write.alloc(5 + bannerLen + 4);
				packet[p] = MESSAGE.USERAUTH_BANNER;
				writeUInt32BE(packet, bannerLen, ++p);
				packet.utf8Write(banner, p += 4, bannerLen);
				writeUInt32BE(packet, 0, p += bannerLen);
				this._debug && this._debug("Outbound: Sending USERAUTH_BANNER");
				sendPacket(this, this._packetRW.write.finalize(packet));
			}
		}
		forwardedTcpip(chan, initWindow, maxPacket, cfg) {
			if (!this._server) throw new Error("Server-only method called in client mode");
			const boundAddrLen = Buffer.byteLength(cfg.boundAddr);
			const remoteAddrLen = Buffer.byteLength(cfg.remoteAddr);
			let p = this._packetRW.write.allocStart;
			const packet = this._packetRW.write.alloc(36 + boundAddrLen + 4 + 4 + remoteAddrLen + 4);
			packet[p] = MESSAGE.CHANNEL_OPEN;
			writeUInt32BE(packet, 15, ++p);
			packet.utf8Write("forwarded-tcpip", p += 4, 15);
			writeUInt32BE(packet, chan, p += 15);
			writeUInt32BE(packet, initWindow, p += 4);
			writeUInt32BE(packet, maxPacket, p += 4);
			writeUInt32BE(packet, boundAddrLen, p += 4);
			packet.utf8Write(cfg.boundAddr, p += 4, boundAddrLen);
			writeUInt32BE(packet, cfg.boundPort, p += boundAddrLen);
			writeUInt32BE(packet, remoteAddrLen, p += 4);
			packet.utf8Write(cfg.remoteAddr, p += 4, remoteAddrLen);
			writeUInt32BE(packet, cfg.remotePort, p += remoteAddrLen);
			this._debug && this._debug(`Outbound: Sending CHANNEL_OPEN (r:${chan}, forwarded-tcpip)`);
			sendPacket(this, this._packetRW.write.finalize(packet));
		}
		x11(chan, initWindow, maxPacket, cfg) {
			if (!this._server) throw new Error("Server-only method called in client mode");
			const addrLen = Buffer.byteLength(cfg.originAddr);
			let p = this._packetRW.write.allocStart;
			const packet = this._packetRW.write.alloc(24 + addrLen + 4);
			packet[p] = MESSAGE.CHANNEL_OPEN;
			writeUInt32BE(packet, 3, ++p);
			packet.utf8Write("x11", p += 4, 3);
			writeUInt32BE(packet, chan, p += 3);
			writeUInt32BE(packet, initWindow, p += 4);
			writeUInt32BE(packet, maxPacket, p += 4);
			writeUInt32BE(packet, addrLen, p += 4);
			packet.utf8Write(cfg.originAddr, p += 4, addrLen);
			writeUInt32BE(packet, cfg.originPort, p += addrLen);
			this._debug && this._debug(`Outbound: Sending CHANNEL_OPEN (r:${chan}, x11)`);
			sendPacket(this, this._packetRW.write.finalize(packet));
		}
		openssh_authAgent(chan, initWindow, maxPacket) {
			if (!this._server) throw new Error("Server-only method called in client mode");
			let p = this._packetRW.write.allocStart;
			const packet = this._packetRW.write.alloc(39);
			packet[p] = MESSAGE.CHANNEL_OPEN;
			writeUInt32BE(packet, 22, ++p);
			packet.utf8Write("auth-agent@openssh.com", p += 4, 22);
			writeUInt32BE(packet, chan, p += 22);
			writeUInt32BE(packet, initWindow, p += 4);
			writeUInt32BE(packet, maxPacket, p += 4);
			this._debug && this._debug(`Outbound: Sending CHANNEL_OPEN (r:${chan}, auth-agent@openssh.com)`);
			sendPacket(this, this._packetRW.write.finalize(packet));
		}
		openssh_forwardedStreamLocal(chan, initWindow, maxPacket, cfg) {
			if (!this._server) throw new Error("Server-only method called in client mode");
			const pathLen = Buffer.byteLength(cfg.socketPath);
			let p = this._packetRW.write.allocStart;
			const packet = this._packetRW.write.alloc(54 + pathLen + 4);
			packet[p] = MESSAGE.CHANNEL_OPEN;
			writeUInt32BE(packet, 33, ++p);
			packet.utf8Write("forwarded-streamlocal@openssh.com", p += 4, 33);
			writeUInt32BE(packet, chan, p += 33);
			writeUInt32BE(packet, initWindow, p += 4);
			writeUInt32BE(packet, maxPacket, p += 4);
			writeUInt32BE(packet, pathLen, p += 4);
			packet.utf8Write(cfg.socketPath, p += 4, pathLen);
			writeUInt32BE(packet, 0, p += pathLen);
			if (this._debug) this._debug(`Outbound: Sending CHANNEL_OPEN (r:${chan}, forwarded-streamlocal@openssh.com)`);
			sendPacket(this, this._packetRW.write.finalize(packet));
		}
		exitStatus(chan, status) {
			if (!this._server) throw new Error("Server-only method called in client mode");
			let p = this._packetRW.write.allocStart;
			const packet = this._packetRW.write.alloc(25);
			packet[p] = MESSAGE.CHANNEL_REQUEST;
			writeUInt32BE(packet, chan, ++p);
			writeUInt32BE(packet, 11, p += 4);
			packet.utf8Write("exit-status", p += 4, 11);
			packet[p += 11] = 0;
			writeUInt32BE(packet, status, ++p);
			this._debug && this._debug(`Outbound: Sending CHANNEL_REQUEST (r:${chan}, exit-status: ${status})`);
			sendPacket(this, this._packetRW.write.finalize(packet));
		}
		exitSignal(chan, name, coreDumped, msg) {
			if (!this._server) throw new Error("Server-only method called in client mode");
			const origSignal = name;
			if (typeof origSignal !== "string" || !origSignal) throw new Error(`Invalid signal: ${origSignal}`);
			let signal = name.toUpperCase();
			if (signal.slice(0, 3) === "SIG") signal = signal.slice(3);
			if (SIGNALS[signal] !== 1) throw new Error(`Invalid signal: ${origSignal}`);
			const nameLen = Buffer.byteLength(signal);
			const msgLen = msg ? Buffer.byteLength(msg) : 0;
			let p = this._packetRW.write.allocStart;
			const packet = this._packetRW.write.alloc(25 + nameLen + 1 + 4 + msgLen + 4);
			packet[p] = MESSAGE.CHANNEL_REQUEST;
			writeUInt32BE(packet, chan, ++p);
			writeUInt32BE(packet, 11, p += 4);
			packet.utf8Write("exit-signal", p += 4, 11);
			packet[p += 11] = 0;
			writeUInt32BE(packet, nameLen, ++p);
			packet.utf8Write(signal, p += 4, nameLen);
			packet[p += nameLen] = coreDumped ? 1 : 0;
			writeUInt32BE(packet, msgLen, ++p);
			p += 4;
			if (msgLen) {
				packet.utf8Write(msg, p, msgLen);
				p += msgLen;
			}
			writeUInt32BE(packet, 0, p);
			this._debug && this._debug(`Outbound: Sending CHANNEL_REQUEST (r:${chan}, exit-signal: ${name})`);
			sendPacket(this, this._packetRW.write.finalize(packet));
		}
		authFailure(authMethods, isPartial) {
			if (!this._server) throw new Error("Server-only method called in client mode");
			if (this._authsQueue.length === 0) throw new Error("No auth in progress");
			let methods;
			if (typeof authMethods === "boolean") {
				isPartial = authMethods;
				authMethods = void 0;
			}
			if (authMethods) {
				methods = [];
				for (let i = 0; i < authMethods.length; ++i) {
					if (authMethods[i].toLowerCase() === "none") continue;
					methods.push(authMethods[i]);
				}
				methods = methods.join(",");
			} else methods = "";
			const methodsLen = methods.length;
			let p = this._packetRW.write.allocStart;
			const packet = this._packetRW.write.alloc(5 + methodsLen + 1);
			packet[p] = MESSAGE.USERAUTH_FAILURE;
			writeUInt32BE(packet, methodsLen, ++p);
			packet.utf8Write(methods, p += 4, methodsLen);
			packet[p += methodsLen] = isPartial === true ? 1 : 0;
			this._authsQueue.shift();
			this._debug && this._debug("Outbound: Sending USERAUTH_FAILURE");
			sendPacket(this, this._packetRW.write.finalize(packet));
		}
		authSuccess() {
			if (!this._server) throw new Error("Server-only method called in client mode");
			if (this._authsQueue.length === 0) throw new Error("No auth in progress");
			const p = this._packetRW.write.allocStart;
			const packet = this._packetRW.write.alloc(1);
			packet[p] = MESSAGE.USERAUTH_SUCCESS;
			this._authsQueue.shift();
			this._authenticated = true;
			this._debug && this._debug("Outbound: Sending USERAUTH_SUCCESS");
			sendPacket(this, this._packetRW.write.finalize(packet));
			if (this._kex.negotiated.cs.compress === "zlib@openssh.com") this._packetRW.read = new ZlibPacketReader();
			if (this._kex.negotiated.sc.compress === "zlib@openssh.com") this._packetRW.write = new ZlibPacketWriter(this);
		}
		authPKOK(keyAlgo, key) {
			if (!this._server) throw new Error("Server-only method called in client mode");
			if (this._authsQueue.length === 0 || this._authsQueue[0] !== "publickey") throw new Error("\"publickey\" auth not in progress");
			const keyAlgoLen = Buffer.byteLength(keyAlgo);
			const keyLen = key.length;
			let p = this._packetRW.write.allocStart;
			const packet = this._packetRW.write.alloc(5 + keyAlgoLen + 4 + keyLen);
			packet[p] = MESSAGE.USERAUTH_PK_OK;
			writeUInt32BE(packet, keyAlgoLen, ++p);
			packet.utf8Write(keyAlgo, p += 4, keyAlgoLen);
			writeUInt32BE(packet, keyLen, p += keyAlgoLen);
			packet.set(key, p += 4);
			this._authsQueue.shift();
			this._debug && this._debug("Outbound: Sending USERAUTH_PK_OK");
			sendPacket(this, this._packetRW.write.finalize(packet));
		}
		authPasswdChg(prompt) {
			if (!this._server) throw new Error("Server-only method called in client mode");
			const promptLen = Buffer.byteLength(prompt);
			let p = this._packetRW.write.allocStart;
			const packet = this._packetRW.write.alloc(5 + promptLen + 4);
			packet[p] = MESSAGE.USERAUTH_PASSWD_CHANGEREQ;
			writeUInt32BE(packet, promptLen, ++p);
			packet.utf8Write(prompt, p += 4, promptLen);
			writeUInt32BE(packet, 0, p += promptLen);
			this._debug && this._debug("Outbound: Sending USERAUTH_PASSWD_CHANGEREQ");
			sendPacket(this, this._packetRW.write.finalize(packet));
		}
		authInfoReq(name, instructions, prompts) {
			if (!this._server) throw new Error("Server-only method called in client mode");
			let promptsLen = 0;
			const nameLen = name ? Buffer.byteLength(name) : 0;
			const instrLen = instructions ? Buffer.byteLength(instructions) : 0;
			for (let i = 0; i < prompts.length; ++i) promptsLen += 4 + Buffer.byteLength(prompts[i].prompt) + 1;
			let p = this._packetRW.write.allocStart;
			const packet = this._packetRW.write.alloc(5 + nameLen + 4 + instrLen + 4 + 4 + promptsLen);
			packet[p] = MESSAGE.USERAUTH_INFO_REQUEST;
			writeUInt32BE(packet, nameLen, ++p);
			p += 4;
			if (name) {
				packet.utf8Write(name, p, nameLen);
				p += nameLen;
			}
			writeUInt32BE(packet, instrLen, p);
			p += 4;
			if (instructions) {
				packet.utf8Write(instructions, p, instrLen);
				p += instrLen;
			}
			writeUInt32BE(packet, 0, p);
			writeUInt32BE(packet, prompts.length, p += 4);
			p += 4;
			for (let i = 0; i < prompts.length; ++i) {
				const prompt = prompts[i];
				const promptLen = Buffer.byteLength(prompt.prompt);
				writeUInt32BE(packet, promptLen, p);
				p += 4;
				if (promptLen) {
					packet.utf8Write(prompt.prompt, p, promptLen);
					p += promptLen;
				}
				packet[p++] = prompt.echo ? 1 : 0;
			}
			this._debug && this._debug("Outbound: Sending USERAUTH_INFO_REQUEST");
			sendPacket(this, this._packetRW.write.finalize(packet));
		}
	};
	const RE_IDENT = /^SSH-(2\.0|1\.99)-([^ ]+)(?: (.*))?$/;
	function parseHeader(chunk, p, len) {
		let data;
		let chunkOffset;
		if (this._buffer) {
			data = Buffer.allocUnsafe(this._buffer.length + (len - p));
			data.set(this._buffer, 0);
			if (p === 0) data.set(chunk, this._buffer.length);
			else data.set(new Uint8Array(chunk.buffer, chunk.byteOffset + p, len - p), this._buffer.length);
			chunkOffset = this._buffer.length;
			p = 0;
		} else {
			data = chunk;
			chunkOffset = 0;
		}
		const op = p;
		let start = p;
		let end = p;
		let needNL = false;
		let lineLen = 0;
		let lines = 0;
		for (; p < data.length; ++p) {
			const ch = data[p];
			if (ch === 13) {
				needNL = true;
				continue;
			}
			if (ch === 10) {
				if (end > start && end - start > 4 && data[start] === 83 && data[start + 1] === 83 && data[start + 2] === 72 && data[start + 3] === 45) {
					const full = data.latin1Slice(op, end + 1);
					const identRaw = start === op ? full : full.slice(start - op);
					const m = RE_IDENT.exec(identRaw);
					if (!m) throw new Error("Invalid identification string");
					const header = {
						greeting: start === op ? "" : full.slice(0, start - op),
						identRaw,
						versions: {
							protocol: m[1],
							software: m[2]
						},
						comments: m[3]
					};
					this._remoteIdentRaw = Buffer.from(identRaw);
					this._debug && this._debug(`Remote ident: ${inspect(identRaw)}`);
					this._compatFlags = getCompatFlags(header);
					this._buffer = void 0;
					this._decipher = new NullDecipher(0, onKEXPayload.bind(this, { firstPacket: true }));
					this._parse = parsePacket;
					this._onHeader(header);
					if (!this._destruct) return len;
					kexinit(this);
					return p + 1 - chunkOffset;
				}
				if (this._server) throw new Error("Greetings from clients not permitted");
				if (++lines > MAX_LINES) throw new Error("Max greeting lines exceeded");
				needNL = false;
				start = p + 1;
				lineLen = 0;
			} else if (needNL) throw new Error("Invalid header: expected newline");
			else if (++lineLen >= MAX_LINE_LEN) throw new Error("Header line too long");
			end = p;
		}
		if (!this._buffer) this._buffer = bufferSlice(data, op);
		return p - chunkOffset;
	}
	function parsePacket(chunk, p, len) {
		return this._decipher.decrypt(chunk, p, len);
	}
	function onPayload(payload) {
		this._onPacket();
		if (payload.length === 0) {
			this._debug && this._debug("Inbound: Skipping empty packet payload");
			return;
		}
		payload = this._packetRW.read.read(payload);
		const type = payload[0];
		if (type === MESSAGE.USERAUTH_SUCCESS && !this._server && !this._authenticated) {
			this._authenticated = true;
			if (this._kex.negotiated.cs.compress === "zlib@openssh.com") this._packetRW.write = new ZlibPacketWriter(this);
			if (this._kex.negotiated.sc.compress === "zlib@openssh.com") this._packetRW.read = new ZlibPacketReader();
		}
		const handler = MESSAGE_HANDLERS[type];
		if (handler === void 0) {
			this._debug && this._debug(`Inbound: Unsupported message type: ${type}`);
			return;
		}
		return handler(this, payload);
	}
	function getCompatFlags(header) {
		const software = header.versions.software;
		let flags = 0;
		for (const rule of COMPAT_CHECKS) if (typeof rule[0] === "string") {
			if (software === rule[0]) flags |= rule[1];
		} else if (rule[0].test(software)) flags |= rule[1];
		return flags;
	}
	function modesToBytes(modes) {
		const keys = Object.keys(modes);
		const bytes = Buffer.allocUnsafe(5 * keys.length + 1);
		let b = 0;
		for (let i = 0; i < keys.length; ++i) {
			const key = keys[i];
			if (key === "TTY_OP_END") continue;
			const opcode = TERMINAL_MODE[key];
			if (opcode === void 0) continue;
			const val = modes[key];
			if (typeof val === "number" && isFinite(val)) {
				bytes[b++] = opcode;
				bytes[b++] = val >>> 24;
				bytes[b++] = val >>> 16;
				bytes[b++] = val >>> 8;
				bytes[b++] = val;
			}
		}
		bytes[b++] = TERMINAL_MODE.TTY_OP_END;
		if (b < bytes.length) return bufferSlice(bytes, 0, b);
		return bytes;
	}
	function sendExtInfo(proto) {
		let serverSigAlgs = "ecdsa-sha2-nistp256,ecdsa-sha2-nistp384,ecdsa-sha2-nistp521rsa-sha2-512,rsa-sha2-256,ssh-rsa,ssh-dss";
		if (eddsaSupported) serverSigAlgs = `ssh-ed25519,${serverSigAlgs}`;
		const algsLen = Buffer.byteLength(serverSigAlgs);
		let p = proto._packetRW.write.allocStart;
		const packet = proto._packetRW.write.alloc(28 + algsLen);
		packet[p] = MESSAGE.EXT_INFO;
		writeUInt32BE(packet, 1, ++p);
		writeUInt32BE(packet, 15, p += 4);
		packet.utf8Write("server-sig-algs", p += 4, 15);
		writeUInt32BE(packet, algsLen, p += 15);
		packet.utf8Write(serverSigAlgs, p += 4, algsLen);
		proto._debug && proto._debug("Outbound: Sending EXT_INFO");
		sendPacket(proto, proto._packetRW.write.finalize(packet));
	}
	module.exports = Protocol;
}));
// node_modules/ssh2/lib/protocol/node-fs-compat.js
var require_node_fs_compat = /* @__PURE__ */ __commonJSMin(((exports) => {
	const assert = __require("assert");
	const { inspect } = __require("util");
	function addNumericalSeparator(val) {
		let res = "";
		let i = val.length;
		const start = val[0] === "-" ? 1 : 0;
		for (; i >= start + 4; i -= 3) res = `_${val.slice(i - 3, i)}${res}`;
		return `${val.slice(0, i)}${res}`;
	}
	function oneOf(expected, thing) {
		assert(typeof thing === "string", "`thing` has to be of type string");
		if (Array.isArray(expected)) {
			const len = expected.length;
			assert(len > 0, "At least one expected value needs to be specified");
			expected = expected.map((i) => String(i));
			if (len > 2) return `one of ${thing} ${expected.slice(0, len - 1).join(", ")}, or ` + expected[len - 1];
			else if (len === 2) return `one of ${thing} ${expected[0]} or ${expected[1]}`;
			return `of ${thing} ${expected[0]}`;
		}
		return `of ${thing} ${String(expected)}`;
	}
	exports.ERR_INTERNAL_ASSERTION = class ERR_INTERNAL_ASSERTION extends Error {
		constructor(message) {
			super();
			Error.captureStackTrace(this, ERR_INTERNAL_ASSERTION);
			const suffix = "This is caused by either a bug in ssh2 or incorrect usage of ssh2 internals.\nPlease open an issue with this stack trace at https://github.com/mscdex/ssh2/issues\n";
			this.message = message === void 0 ? suffix : `${message}\n${suffix}`;
		}
	};
	const MAX_32BIT_INT = 2 ** 32;
	const MAX_32BIT_BIGINT = (() => {
		try {
			return new Function("return 2n ** 32n")();
		} catch {}
	})();
	exports.ERR_OUT_OF_RANGE = class ERR_OUT_OF_RANGE extends RangeError {
		constructor(str, range, input, replaceDefaultBoolean) {
			super();
			Error.captureStackTrace(this, ERR_OUT_OF_RANGE);
			assert(range, "Missing \"range\" argument");
			let msg = replaceDefaultBoolean ? str : `The value of "${str}" is out of range.`;
			let received;
			if (Number.isInteger(input) && Math.abs(input) > MAX_32BIT_INT) received = addNumericalSeparator(String(input));
			else if (typeof input === "bigint") {
				received = String(input);
				if (input > MAX_32BIT_BIGINT || input < -MAX_32BIT_BIGINT) received = addNumericalSeparator(received);
				received += "n";
			} else received = inspect(input);
			msg += ` It must be ${range}. Received ${received}`;
			this.message = msg;
		}
	};
	var ERR_INVALID_ARG_TYPE = class ERR_INVALID_ARG_TYPE extends TypeError {
		constructor(name, expected, actual) {
			super();
			Error.captureStackTrace(this, ERR_INVALID_ARG_TYPE);
			assert(typeof name === "string", `'name' must be a string`);
			let determiner;
			if (typeof expected === "string" && expected.startsWith("not ")) {
				determiner = "must not be";
				expected = expected.replace(/^not /, "");
			} else determiner = "must be";
			let msg;
			if (name.endsWith(" argument")) msg = `The ${name} ${determiner} ${oneOf(expected, "type")}`;
			else msg = `The "${name}" ${name.includes(".") ? "property" : "argument"} ${determiner} ${oneOf(expected, "type")}`;
			msg += `. Received type ${typeof actual}`;
			this.message = msg;
		}
	};
	exports.ERR_INVALID_ARG_TYPE = ERR_INVALID_ARG_TYPE;
	exports.validateNumber = function validateNumber(value, name) {
		if (typeof value !== "number") throw new ERR_INVALID_ARG_TYPE(name, "number", value);
	};
}));
// node_modules/ssh2/lib/protocol/SFTP.js
var require_SFTP = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const EventEmitter = __require("events");
	const fs = __require("fs");
	const { constants } = fs;
	const { Readable: ReadableStream, Writable: WritableStream } = __require("stream");
	const { inherits, types: { isDate } } = __require("util");
	const FastBuffer = Buffer[Symbol.species];
	const { bufferCopy, bufferSlice, makeBufferParser, writeUInt32BE } = require_utils$1();
	const ATTR = {
		SIZE: 1,
		UIDGID: 2,
		PERMISSIONS: 4,
		ACMODTIME: 8,
		EXTENDED: 0x80000000
	};
	const ATTRS_BUF = Buffer.alloc(28);
	const STATUS_CODE = {
		OK: 0,
		EOF: 1,
		NO_SUCH_FILE: 2,
		PERMISSION_DENIED: 3,
		FAILURE: 4,
		BAD_MESSAGE: 5,
		NO_CONNECTION: 6,
		CONNECTION_LOST: 7,
		OP_UNSUPPORTED: 8
	};
	const VALID_STATUS_CODES = new Map(Object.values(STATUS_CODE).map((n) => [n, 1]));
	const STATUS_CODE_STR = {
		[STATUS_CODE.OK]: "No error",
		[STATUS_CODE.EOF]: "End of file",
		[STATUS_CODE.NO_SUCH_FILE]: "No such file or directory",
		[STATUS_CODE.PERMISSION_DENIED]: "Permission denied",
		[STATUS_CODE.FAILURE]: "Failure",
		[STATUS_CODE.BAD_MESSAGE]: "Bad message",
		[STATUS_CODE.NO_CONNECTION]: "No connection",
		[STATUS_CODE.CONNECTION_LOST]: "Connection lost",
		[STATUS_CODE.OP_UNSUPPORTED]: "Operation unsupported"
	};
	const REQUEST = {
		INIT: 1,
		OPEN: 3,
		CLOSE: 4,
		READ: 5,
		WRITE: 6,
		LSTAT: 7,
		FSTAT: 8,
		SETSTAT: 9,
		FSETSTAT: 10,
		OPENDIR: 11,
		READDIR: 12,
		REMOVE: 13,
		MKDIR: 14,
		RMDIR: 15,
		REALPATH: 16,
		STAT: 17,
		RENAME: 18,
		READLINK: 19,
		SYMLINK: 20,
		EXTENDED: 200
	};
	const RESPONSE = {
		VERSION: 2,
		STATUS: 101,
		HANDLE: 102,
		DATA: 103,
		NAME: 104,
		ATTRS: 105,
		EXTENDED: 201
	};
	const OPEN_MODE = {
		READ: 1,
		WRITE: 2,
		APPEND: 4,
		CREAT: 8,
		TRUNC: 16,
		EXCL: 32
	};
	const PKT_RW_OVERHEAD = 2048;
	const MAX_REQID = 2 ** 32 - 1;
	const CLIENT_VERSION_BUFFER = Buffer.from([
		0,
		0,
		0,
		5,
		REQUEST.INIT,
		0,
		0,
		0,
		3
	]);
	const SERVER_VERSION_BUFFER = Buffer.from([
		0,
		0,
		0,
		5,
		RESPONSE.VERSION,
		0,
		0,
		0,
		3
	]);
	const RE_OPENSSH = /^SSH-2.0-(?:OpenSSH|dropbear)/;
	const OPENSSH_MAX_PKT_LEN = 262144;
	const bufferParser = makeBufferParser();
	const fakeStderr = {
		readable: false,
		writable: false,
		push: (data) => {},
		once: () => {},
		on: () => {},
		emit: () => {},
		end: () => {}
	};
	function noop() {}
	var SFTP = class extends EventEmitter {
		constructor(client, chanInfo, cfg) {
			super();
			if (typeof cfg !== "object" || !cfg) cfg = {};
			const remoteIdentRaw = client._protocol._remoteIdentRaw;
			this.server = !!cfg.server;
			this._debug = typeof cfg.debug === "function" ? cfg.debug : void 0;
			this._isOpenSSH = remoteIdentRaw && RE_OPENSSH.test(remoteIdentRaw);
			this._version = -1;
			this._extensions = {};
			this._biOpt = cfg.biOpt;
			this._pktLenBytes = 0;
			this._pktLen = 0;
			this._pktPos = 0;
			this._pktType = 0;
			this._pktData = void 0;
			this._writeReqid = -1;
			this._requests = {};
			this._maxInPktLen = OPENSSH_MAX_PKT_LEN;
			this._maxOutPktLen = 34e3;
			this._maxReadLen = (this._isOpenSSH ? OPENSSH_MAX_PKT_LEN : 34e3) - PKT_RW_OVERHEAD;
			this._maxWriteLen = (this._isOpenSSH ? OPENSSH_MAX_PKT_LEN : 34e3) - PKT_RW_OVERHEAD;
			this.maxOpenHandles = void 0;
			this._client = client;
			this._protocol = client._protocol;
			this._callbacks = [];
			this._hasX11 = false;
			this._exit = {
				code: void 0,
				signal: void 0,
				dump: void 0,
				desc: void 0
			};
			this._waitWindow = false;
			this._chunkcb = void 0;
			this._buffer = [];
			this.type = chanInfo.type;
			this.subtype = void 0;
			this.incoming = chanInfo.incoming;
			this.outgoing = chanInfo.outgoing;
			this.stderr = fakeStderr;
			this.readable = true;
		}
		push(data) {
			if (data === null) {
				cleanupRequests(this);
				if (!this.readable) return;
				this.readable = false;
				this.emit("end");
				return;
			}
			let p = 0;
			while (p < data.length) {
				if (this._pktLenBytes < 4) {
					let nb = Math.min(4 - this._pktLenBytes, data.length - p);
					this._pktLenBytes += nb;
					while (nb--) this._pktLen = (this._pktLen << 8) + data[p++];
					if (this._pktLenBytes < 4) return;
					if (this._pktLen === 0) return doFatalSFTPError(this, "Invalid packet length");
					if (this._pktLen > this._maxInPktLen) {
						const max = this._maxInPktLen;
						return doFatalSFTPError(this, `Packet length ${this._pktLen} exceeds max length of ${max}`);
					}
					if (p >= data.length) return;
				}
				if (this._pktPos < this._pktLen) {
					const nb = Math.min(this._pktLen - this._pktPos, data.length - p);
					if (p !== 0 || nb !== data.length) {
						if (nb === this._pktLen) this._pkt = new FastBuffer(data.buffer, data.byteOffset + p, nb);
						else {
							if (!this._pkt) this._pkt = Buffer.allocUnsafe(this._pktLen);
							this._pkt.set(new Uint8Array(data.buffer, data.byteOffset + p, nb), this._pktPos);
						}
					} else if (nb === this._pktLen) this._pkt = data;
					else {
						if (!this._pkt) this._pkt = Buffer.allocUnsafe(this._pktLen);
						this._pkt.set(data, this._pktPos);
					}
					p += nb;
					this._pktPos += nb;
					if (this._pktPos < this._pktLen) return;
				}
				const type = this._pkt[0];
				const payload = this._pkt;
				this._pktLen = 0;
				this._pktLenBytes = 0;
				this._pkt = void 0;
				this._pktPos = 0;
				const handler = this.server ? SERVER_HANDLERS[type] : CLIENT_HANDLERS[type];
				if (!handler) return doFatalSFTPError(this, `Unknown packet type ${type}`);
				if (this._version === -1) {
					if (this.server) {
						if (type !== REQUEST.INIT) return doFatalSFTPError(this, `Expected INIT packet, got ${type}`);
					} else if (type !== RESPONSE.VERSION) return doFatalSFTPError(this, `Expected VERSION packet, got ${type}`);
				}
				if (handler(this, payload) === false) return;
			}
		}
		end() {
			this.destroy();
		}
		destroy() {
			if (this.outgoing.state === "open" || this.outgoing.state === "eof") {
				this.outgoing.state = "closing";
				this._protocol.channelClose(this.outgoing.id);
			}
		}
		_init() {
			this._init = noop;
			if (!this.server) sendOrBuffer(this, CLIENT_VERSION_BUFFER);
		}
		createReadStream(path, options) {
			if (this.server) throw new Error("Client-only method called in server mode");
			return new ReadStream(this, path, options);
		}
		createWriteStream(path, options) {
			if (this.server) throw new Error("Client-only method called in server mode");
			return new WriteStream(this, path, options);
		}
		open(path, flags_, attrs, cb) {
			if (this.server) throw new Error("Client-only method called in server mode");
			if (typeof attrs === "function") {
				cb = attrs;
				attrs = void 0;
			}
			const flags = typeof flags_ === "number" ? flags_ : stringToFlags(flags_);
			if (flags === null) throw new Error(`Unknown flags string: ${flags_}`);
			let attrsFlags = 0;
			let attrsLen = 0;
			if (typeof attrs === "string" || typeof attrs === "number") attrs = { mode: attrs };
			if (typeof attrs === "object" && attrs !== null) {
				attrs = attrsToBytes(attrs);
				attrsFlags = attrs.flags;
				attrsLen = attrs.nb;
			}
			const pathLen = Buffer.byteLength(path);
			let p = 9;
			const buf = Buffer.allocUnsafe(13 + pathLen + 4 + 4 + attrsLen);
			writeUInt32BE(buf, buf.length - 4, 0);
			buf[4] = REQUEST.OPEN;
			const reqid = this._writeReqid = this._writeReqid + 1 & MAX_REQID;
			writeUInt32BE(buf, reqid, 5);
			writeUInt32BE(buf, pathLen, p);
			buf.utf8Write(path, p += 4, pathLen);
			writeUInt32BE(buf, flags, p += pathLen);
			writeUInt32BE(buf, attrsFlags, p += 4);
			if (attrsLen) {
				p += 4;
				if (attrsLen === ATTRS_BUF.length) buf.set(ATTRS_BUF, p);
				else bufferCopy(ATTRS_BUF, buf, 0, attrsLen, p);
				p += attrsLen;
			}
			this._requests[reqid] = { cb };
			const isBuffered = sendOrBuffer(this, buf);
			this._debug && this._debug(`SFTP: Outbound: ${isBuffered ? "Buffered" : "Sending"} OPEN`);
		}
		close(handle, cb) {
			if (this.server) throw new Error("Client-only method called in server mode");
			if (!Buffer.isBuffer(handle)) throw new Error("handle is not a Buffer");
			const handleLen = handle.length;
			let p = 9;
			const buf = Buffer.allocUnsafe(13 + handleLen);
			writeUInt32BE(buf, buf.length - 4, 0);
			buf[4] = REQUEST.CLOSE;
			const reqid = this._writeReqid = this._writeReqid + 1 & MAX_REQID;
			writeUInt32BE(buf, reqid, 5);
			writeUInt32BE(buf, handleLen, p);
			buf.set(handle, p += 4);
			this._requests[reqid] = { cb };
			const isBuffered = sendOrBuffer(this, buf);
			this._debug && this._debug(`SFTP: Outbound: ${isBuffered ? "Buffered" : "Sending"} CLOSE`);
		}
		read(handle, buf, off, len, position, cb) {
			if (this.server) throw new Error("Client-only method called in server mode");
			if (!Buffer.isBuffer(handle)) throw new Error("handle is not a Buffer");
			if (!Buffer.isBuffer(buf)) throw new Error("buffer is not a Buffer");
			if (off >= buf.length) throw new Error("offset is out of bounds");
			if (off + len > buf.length) throw new Error("length extends beyond buffer");
			if (position === null) throw new Error("null position currently unsupported");
			read_(this, handle, buf, off, len, position, cb);
		}
		readData(handle, buf, off, len, position, cb) {
			this.read(handle, buf, off, len, position, cb);
		}
		write(handle, buf, off, len, position, cb) {
			if (this.server) throw new Error("Client-only method called in server mode");
			if (!Buffer.isBuffer(handle)) throw new Error("handle is not a Buffer");
			if (!Buffer.isBuffer(buf)) throw new Error("buffer is not a Buffer");
			if (off > buf.length) throw new Error("offset is out of bounds");
			if (off + len > buf.length) throw new Error("length extends beyond buffer");
			if (position === null) throw new Error("null position currently unsupported");
			if (!len) {
				cb && process.nextTick(cb, void 0, 0);
				return;
			}
			const maxDataLen = this._maxWriteLen;
			const overflow = Math.max(len - maxDataLen, 0);
			const origPosition = position;
			if (overflow) len = maxDataLen;
			const handleLen = handle.length;
			let p = 9;
			const out = Buffer.allocUnsafe(13 + handleLen + 8 + 4 + len);
			writeUInt32BE(out, out.length - 4, 0);
			out[4] = REQUEST.WRITE;
			const reqid = this._writeReqid = this._writeReqid + 1 & MAX_REQID;
			writeUInt32BE(out, reqid, 5);
			writeUInt32BE(out, handleLen, p);
			out.set(handle, p += 4);
			p += handleLen;
			for (let i = 7; i >= 0; --i) {
				out[p + i] = position & 255;
				position /= 256;
			}
			writeUInt32BE(out, len, p += 8);
			bufferCopy(buf, out, off, off + len, p += 4);
			this._requests[reqid] = { cb: (err) => {
				if (err) {
					if (typeof cb === "function") cb(err);
				} else if (overflow) this.write(handle, buf, off + len, overflow, origPosition + len, cb);
				else if (typeof cb === "function") cb(void 0, off + len);
			} };
			const isSent = sendOrBuffer(this, out);
			if (this._debug) {
				const how = isSent ? "Sent" : "Buffered";
				this._debug(`SFTP: Outbound: ${how} WRITE (id:${reqid})`);
			}
		}
		writeData(handle, buf, off, len, position, cb) {
			this.write(handle, buf, off, len, position, cb);
		}
		fastGet(remotePath, localPath, opts, cb) {
			if (this.server) throw new Error("Client-only method called in server mode");
			fastXfer(this, fs, remotePath, localPath, opts, cb);
		}
		fastPut(localPath, remotePath, opts, cb) {
			if (this.server) throw new Error("Client-only method called in server mode");
			fastXfer(fs, this, localPath, remotePath, opts, cb);
		}
		readFile(path, options, callback_) {
			if (this.server) throw new Error("Client-only method called in server mode");
			let callback;
			if (typeof callback_ === "function") callback = callback_;
			else if (typeof options === "function") {
				callback = options;
				options = void 0;
			}
			if (typeof options === "string") options = {
				encoding: options,
				flag: "r"
			};
			else if (!options) options = {
				encoding: null,
				flag: "r"
			};
			else if (typeof options !== "object") throw new TypeError("Bad arguments");
			const encoding = options.encoding;
			if (encoding && !Buffer.isEncoding(encoding)) throw new Error(`Unknown encoding: ${encoding}`);
			let size;
			let buffer;
			let buffers;
			let pos = 0;
			let handle;
			let bytesRead = 0;
			const flag = options.flag || "r";
			const read = () => {
				if (size === 0) {
					buffer = Buffer.allocUnsafe(8192);
					this.read(handle, buffer, 0, 8192, bytesRead, afterRead);
				} else this.read(handle, buffer, pos, size - pos, bytesRead, afterRead);
			};
			const afterRead = (er, nbytes) => {
				let eof;
				if (er) {
					eof = er.code === STATUS_CODE.EOF;
					if (!eof) return this.close(handle, () => {
						return callback && callback(er);
					});
				} else eof = false;
				if (eof || size === 0 && nbytes === 0) return close();
				bytesRead += nbytes;
				pos += nbytes;
				if (size !== 0) {
					if (pos === size) close();
					else read();
				} else {
					buffers.push(bufferSlice(buffer, 0, nbytes));
					read();
				}
			};
			afterRead._wantEOFError = true;
			const close = () => {
				this.close(handle, (er) => {
					if (size === 0) buffer = Buffer.concat(buffers, pos);
					else if (pos < size) buffer = bufferSlice(buffer, 0, pos);
					if (encoding) buffer = buffer.toString(encoding);
					return callback && callback(er, buffer);
				});
			};
			this.open(path, flag, 438, (er, handle_) => {
				if (er) return callback && callback(er);
				handle = handle_;
				const tryStat = (er, st) => {
					if (er) {
						this.stat(path, (er_, st_) => {
							if (er_) return this.close(handle, () => {
								callback && callback(er);
							});
							tryStat(null, st_);
						});
						return;
					}
					size = st.size || 0;
					if (size === 0) {
						buffers = [];
						return read();
					}
					buffer = Buffer.allocUnsafe(size);
					read();
				};
				this.fstat(handle, tryStat);
			});
		}
		writeFile(path, data, options, callback_) {
			if (this.server) throw new Error("Client-only method called in server mode");
			let callback;
			if (typeof callback_ === "function") callback = callback_;
			else if (typeof options === "function") {
				callback = options;
				options = void 0;
			}
			if (typeof options === "string") options = {
				encoding: options,
				mode: 438,
				flag: "w"
			};
			else if (!options) options = {
				encoding: "utf8",
				mode: 438,
				flag: "w"
			};
			else if (typeof options !== "object") throw new TypeError("Bad arguments");
			if (options.encoding && !Buffer.isEncoding(options.encoding)) throw new Error(`Unknown encoding: ${options.encoding}`);
			const flag = options.flag || "w";
			this.open(path, flag, options.mode, (openErr, handle) => {
				if (openErr) callback && callback(openErr);
				else {
					const buffer = Buffer.isBuffer(data) ? data : Buffer.from("" + data, options.encoding || "utf8");
					const position = /a/.test(flag) ? null : 0;
					if (position === null) {
						const tryStat = (er, st) => {
							if (er) {
								this.stat(path, (er_, st_) => {
									if (er_) return this.close(handle, () => {
										callback && callback(er);
									});
									tryStat(null, st_);
								});
								return;
							}
							writeAll(this, handle, buffer, 0, buffer.length, st.size, callback);
						};
						this.fstat(handle, tryStat);
						return;
					}
					writeAll(this, handle, buffer, 0, buffer.length, position, callback);
				}
			});
		}
		appendFile(path, data, options, callback_) {
			if (this.server) throw new Error("Client-only method called in server mode");
			let callback;
			if (typeof callback_ === "function") callback = callback_;
			else if (typeof options === "function") {
				callback = options;
				options = void 0;
			}
			if (typeof options === "string") options = {
				encoding: options,
				mode: 438,
				flag: "a"
			};
			else if (!options) options = {
				encoding: "utf8",
				mode: 438,
				flag: "a"
			};
			else if (typeof options !== "object") throw new TypeError("Bad arguments");
			if (!options.flag) options = Object.assign({ flag: "a" }, options);
			this.writeFile(path, data, options, callback);
		}
		exists(path, cb) {
			if (this.server) throw new Error("Client-only method called in server mode");
			this.stat(path, (err) => {
				cb && cb(err ? false : true);
			});
		}
		unlink(filename, cb) {
			if (this.server) throw new Error("Client-only method called in server mode");
			const fnameLen = Buffer.byteLength(filename);
			let p = 9;
			const buf = Buffer.allocUnsafe(13 + fnameLen);
			writeUInt32BE(buf, buf.length - 4, 0);
			buf[4] = REQUEST.REMOVE;
			const reqid = this._writeReqid = this._writeReqid + 1 & MAX_REQID;
			writeUInt32BE(buf, reqid, 5);
			writeUInt32BE(buf, fnameLen, p);
			buf.utf8Write(filename, p += 4, fnameLen);
			this._requests[reqid] = { cb };
			const isBuffered = sendOrBuffer(this, buf);
			this._debug && this._debug(`SFTP: Outbound: ${isBuffered ? "Buffered" : "Sending"} REMOVE`);
		}
		rename(oldPath, newPath, cb) {
			if (this.server) throw new Error("Client-only method called in server mode");
			const oldLen = Buffer.byteLength(oldPath);
			const newLen = Buffer.byteLength(newPath);
			let p = 9;
			const buf = Buffer.allocUnsafe(13 + oldLen + 4 + newLen);
			writeUInt32BE(buf, buf.length - 4, 0);
			buf[4] = REQUEST.RENAME;
			const reqid = this._writeReqid = this._writeReqid + 1 & MAX_REQID;
			writeUInt32BE(buf, reqid, 5);
			writeUInt32BE(buf, oldLen, p);
			buf.utf8Write(oldPath, p += 4, oldLen);
			writeUInt32BE(buf, newLen, p += oldLen);
			buf.utf8Write(newPath, p += 4, newLen);
			this._requests[reqid] = { cb };
			const isBuffered = sendOrBuffer(this, buf);
			this._debug && this._debug(`SFTP: Outbound: ${isBuffered ? "Buffered" : "Sending"} RENAME`);
		}
		mkdir(path, attrs, cb) {
			if (this.server) throw new Error("Client-only method called in server mode");
			let flags = 0;
			let attrsLen = 0;
			if (typeof attrs === "function") {
				cb = attrs;
				attrs = void 0;
			}
			if (typeof attrs === "object" && attrs !== null) {
				attrs = attrsToBytes(attrs);
				flags = attrs.flags;
				attrsLen = attrs.nb;
			}
			const pathLen = Buffer.byteLength(path);
			let p = 9;
			const buf = Buffer.allocUnsafe(13 + pathLen + 4 + attrsLen);
			writeUInt32BE(buf, buf.length - 4, 0);
			buf[4] = REQUEST.MKDIR;
			const reqid = this._writeReqid = this._writeReqid + 1 & MAX_REQID;
			writeUInt32BE(buf, reqid, 5);
			writeUInt32BE(buf, pathLen, p);
			buf.utf8Write(path, p += 4, pathLen);
			writeUInt32BE(buf, flags, p += pathLen);
			if (attrsLen) {
				p += 4;
				if (attrsLen === ATTRS_BUF.length) buf.set(ATTRS_BUF, p);
				else bufferCopy(ATTRS_BUF, buf, 0, attrsLen, p);
				p += attrsLen;
			}
			this._requests[reqid] = { cb };
			const isBuffered = sendOrBuffer(this, buf);
			this._debug && this._debug(`SFTP: Outbound: ${isBuffered ? "Buffered" : "Sending"} MKDIR`);
		}
		rmdir(path, cb) {
			if (this.server) throw new Error("Client-only method called in server mode");
			const pathLen = Buffer.byteLength(path);
			let p = 9;
			const buf = Buffer.allocUnsafe(13 + pathLen);
			writeUInt32BE(buf, buf.length - 4, 0);
			buf[4] = REQUEST.RMDIR;
			const reqid = this._writeReqid = this._writeReqid + 1 & MAX_REQID;
			writeUInt32BE(buf, reqid, 5);
			writeUInt32BE(buf, pathLen, p);
			buf.utf8Write(path, p += 4, pathLen);
			this._requests[reqid] = { cb };
			const isBuffered = sendOrBuffer(this, buf);
			this._debug && this._debug(`SFTP: Outbound: ${isBuffered ? "Buffered" : "Sending"} RMDIR`);
		}
		readdir(where, opts, cb) {
			if (this.server) throw new Error("Client-only method called in server mode");
			if (typeof opts === "function") {
				cb = opts;
				opts = {};
			}
			if (typeof opts !== "object" || opts === null) opts = {};
			const doFilter = opts && opts.full ? false : true;
			if (!Buffer.isBuffer(where) && typeof where !== "string") throw new Error("missing directory handle or path");
			if (typeof where === "string") {
				const entries = [];
				let e = 0;
				const reread = (err, handle) => {
					if (err) return cb(err);
					this.readdir(handle, opts, (err, list) => {
						const eof = err && err.code === STATUS_CODE.EOF;
						if (err && !eof) return this.close(handle, () => cb(err));
						if (eof) return this.close(handle, (err) => {
							if (err) return cb(err);
							cb(void 0, entries);
						});
						for (let i = 0; i < list.length; ++i, ++e) entries[e] = list[i];
						reread(void 0, handle);
					});
				};
				return this.opendir(where, reread);
			}
			const handleLen = where.length;
			let p = 9;
			const buf = Buffer.allocUnsafe(13 + handleLen);
			writeUInt32BE(buf, buf.length - 4, 0);
			buf[4] = REQUEST.READDIR;
			const reqid = this._writeReqid = this._writeReqid + 1 & MAX_REQID;
			writeUInt32BE(buf, reqid, 5);
			writeUInt32BE(buf, handleLen, p);
			buf.set(where, p += 4);
			this._requests[reqid] = { cb: doFilter ? (err, list) => {
				if (typeof cb !== "function") return;
				if (err) return cb(err);
				for (let i = list.length - 1; i >= 0; --i) if (list[i].filename === "." || list[i].filename === "..") list.splice(i, 1);
				cb(void 0, list);
			} : cb };
			const isBuffered = sendOrBuffer(this, buf);
			this._debug && this._debug(`SFTP: Outbound: ${isBuffered ? "Buffered" : "Sending"} READDIR`);
		}
		fstat(handle, cb) {
			if (this.server) throw new Error("Client-only method called in server mode");
			if (!Buffer.isBuffer(handle)) throw new Error("handle is not a Buffer");
			const handleLen = handle.length;
			let p = 9;
			const buf = Buffer.allocUnsafe(13 + handleLen);
			writeUInt32BE(buf, buf.length - 4, 0);
			buf[4] = REQUEST.FSTAT;
			const reqid = this._writeReqid = this._writeReqid + 1 & MAX_REQID;
			writeUInt32BE(buf, reqid, 5);
			writeUInt32BE(buf, handleLen, p);
			buf.set(handle, p += 4);
			this._requests[reqid] = { cb };
			const isBuffered = sendOrBuffer(this, buf);
			this._debug && this._debug(`SFTP: Outbound: ${isBuffered ? "Buffered" : "Sending"} FSTAT`);
		}
		stat(path, cb) {
			if (this.server) throw new Error("Client-only method called in server mode");
			const pathLen = Buffer.byteLength(path);
			let p = 9;
			const buf = Buffer.allocUnsafe(13 + pathLen);
			writeUInt32BE(buf, buf.length - 4, 0);
			buf[4] = REQUEST.STAT;
			const reqid = this._writeReqid = this._writeReqid + 1 & MAX_REQID;
			writeUInt32BE(buf, reqid, 5);
			writeUInt32BE(buf, pathLen, p);
			buf.utf8Write(path, p += 4, pathLen);
			this._requests[reqid] = { cb };
			const isBuffered = sendOrBuffer(this, buf);
			this._debug && this._debug(`SFTP: Outbound: ${isBuffered ? "Buffered" : "Sending"} STAT`);
		}
		lstat(path, cb) {
			if (this.server) throw new Error("Client-only method called in server mode");
			const pathLen = Buffer.byteLength(path);
			let p = 9;
			const buf = Buffer.allocUnsafe(13 + pathLen);
			writeUInt32BE(buf, buf.length - 4, 0);
			buf[4] = REQUEST.LSTAT;
			const reqid = this._writeReqid = this._writeReqid + 1 & MAX_REQID;
			writeUInt32BE(buf, reqid, 5);
			writeUInt32BE(buf, pathLen, p);
			buf.utf8Write(path, p += 4, pathLen);
			this._requests[reqid] = { cb };
			const isBuffered = sendOrBuffer(this, buf);
			this._debug && this._debug(`SFTP: Outbound: ${isBuffered ? "Buffered" : "Sending"} LSTAT`);
		}
		opendir(path, cb) {
			if (this.server) throw new Error("Client-only method called in server mode");
			const pathLen = Buffer.byteLength(path);
			let p = 9;
			const buf = Buffer.allocUnsafe(13 + pathLen);
			writeUInt32BE(buf, buf.length - 4, 0);
			buf[4] = REQUEST.OPENDIR;
			const reqid = this._writeReqid = this._writeReqid + 1 & MAX_REQID;
			writeUInt32BE(buf, reqid, 5);
			writeUInt32BE(buf, pathLen, p);
			buf.utf8Write(path, p += 4, pathLen);
			this._requests[reqid] = { cb };
			const isBuffered = sendOrBuffer(this, buf);
			this._debug && this._debug(`SFTP: Outbound: ${isBuffered ? "Buffered" : "Sending"} OPENDIR`);
		}
		setstat(path, attrs, cb) {
			if (this.server) throw new Error("Client-only method called in server mode");
			let flags = 0;
			let attrsLen = 0;
			if (typeof attrs === "object" && attrs !== null) {
				attrs = attrsToBytes(attrs);
				flags = attrs.flags;
				attrsLen = attrs.nb;
			} else if (typeof attrs === "function") cb = attrs;
			const pathLen = Buffer.byteLength(path);
			let p = 9;
			const buf = Buffer.allocUnsafe(13 + pathLen + 4 + attrsLen);
			writeUInt32BE(buf, buf.length - 4, 0);
			buf[4] = REQUEST.SETSTAT;
			const reqid = this._writeReqid = this._writeReqid + 1 & MAX_REQID;
			writeUInt32BE(buf, reqid, 5);
			writeUInt32BE(buf, pathLen, p);
			buf.utf8Write(path, p += 4, pathLen);
			writeUInt32BE(buf, flags, p += pathLen);
			if (attrsLen) {
				p += 4;
				if (attrsLen === ATTRS_BUF.length) buf.set(ATTRS_BUF, p);
				else bufferCopy(ATTRS_BUF, buf, 0, attrsLen, p);
				p += attrsLen;
			}
			this._requests[reqid] = { cb };
			const isBuffered = sendOrBuffer(this, buf);
			this._debug && this._debug(`SFTP: Outbound: ${isBuffered ? "Buffered" : "Sending"} SETSTAT`);
		}
		fsetstat(handle, attrs, cb) {
			if (this.server) throw new Error("Client-only method called in server mode");
			if (!Buffer.isBuffer(handle)) throw new Error("handle is not a Buffer");
			let flags = 0;
			let attrsLen = 0;
			if (typeof attrs === "object" && attrs !== null) {
				attrs = attrsToBytes(attrs);
				flags = attrs.flags;
				attrsLen = attrs.nb;
			} else if (typeof attrs === "function") cb = attrs;
			const handleLen = handle.length;
			let p = 9;
			const buf = Buffer.allocUnsafe(13 + handleLen + 4 + attrsLen);
			writeUInt32BE(buf, buf.length - 4, 0);
			buf[4] = REQUEST.FSETSTAT;
			const reqid = this._writeReqid = this._writeReqid + 1 & MAX_REQID;
			writeUInt32BE(buf, reqid, 5);
			writeUInt32BE(buf, handleLen, p);
			buf.set(handle, p += 4);
			writeUInt32BE(buf, flags, p += handleLen);
			if (attrsLen) {
				p += 4;
				if (attrsLen === ATTRS_BUF.length) buf.set(ATTRS_BUF, p);
				else bufferCopy(ATTRS_BUF, buf, 0, attrsLen, p);
				p += attrsLen;
			}
			this._requests[reqid] = { cb };
			const isBuffered = sendOrBuffer(this, buf);
			this._debug && this._debug(`SFTP: Outbound: ${isBuffered ? "Buffered" : "Sending"} FSETSTAT`);
		}
		futimes(handle, atime, mtime, cb) {
			return this.fsetstat(handle, {
				atime: toUnixTimestamp(atime),
				mtime: toUnixTimestamp(mtime)
			}, cb);
		}
		utimes(path, atime, mtime, cb) {
			return this.setstat(path, {
				atime: toUnixTimestamp(atime),
				mtime: toUnixTimestamp(mtime)
			}, cb);
		}
		fchown(handle, uid, gid, cb) {
			return this.fsetstat(handle, {
				uid,
				gid
			}, cb);
		}
		chown(path, uid, gid, cb) {
			return this.setstat(path, {
				uid,
				gid
			}, cb);
		}
		fchmod(handle, mode, cb) {
			return this.fsetstat(handle, { mode }, cb);
		}
		chmod(path, mode, cb) {
			return this.setstat(path, { mode }, cb);
		}
		readlink(path, cb) {
			if (this.server) throw new Error("Client-only method called in server mode");
			const pathLen = Buffer.byteLength(path);
			let p = 9;
			const buf = Buffer.allocUnsafe(13 + pathLen);
			writeUInt32BE(buf, buf.length - 4, 0);
			buf[4] = REQUEST.READLINK;
			const reqid = this._writeReqid = this._writeReqid + 1 & MAX_REQID;
			writeUInt32BE(buf, reqid, 5);
			writeUInt32BE(buf, pathLen, p);
			buf.utf8Write(path, p += 4, pathLen);
			this._requests[reqid] = { cb: (err, names) => {
				if (typeof cb !== "function") return;
				if (err) return cb(err);
				if (!names || !names.length) return cb(/* @__PURE__ */ new Error("Response missing link info"));
				cb(void 0, names[0].filename);
			} };
			const isBuffered = sendOrBuffer(this, buf);
			this._debug && this._debug(`SFTP: Outbound: ${isBuffered ? "Buffered" : "Sending"} READLINK`);
		}
		symlink(targetPath, linkPath, cb) {
			if (this.server) throw new Error("Client-only method called in server mode");
			const linkLen = Buffer.byteLength(linkPath);
			const targetLen = Buffer.byteLength(targetPath);
			let p = 9;
			const buf = Buffer.allocUnsafe(13 + linkLen + 4 + targetLen);
			writeUInt32BE(buf, buf.length - 4, 0);
			buf[4] = REQUEST.SYMLINK;
			const reqid = this._writeReqid = this._writeReqid + 1 & MAX_REQID;
			writeUInt32BE(buf, reqid, 5);
			if (this._isOpenSSH) {
				writeUInt32BE(buf, targetLen, p);
				buf.utf8Write(targetPath, p += 4, targetLen);
				writeUInt32BE(buf, linkLen, p += targetLen);
				buf.utf8Write(linkPath, p += 4, linkLen);
			} else {
				writeUInt32BE(buf, linkLen, p);
				buf.utf8Write(linkPath, p += 4, linkLen);
				writeUInt32BE(buf, targetLen, p += linkLen);
				buf.utf8Write(targetPath, p += 4, targetLen);
			}
			this._requests[reqid] = { cb };
			const isBuffered = sendOrBuffer(this, buf);
			this._debug && this._debug(`SFTP: Outbound: ${isBuffered ? "Buffered" : "Sending"} SYMLINK`);
		}
		realpath(path, cb) {
			if (this.server) throw new Error("Client-only method called in server mode");
			const pathLen = Buffer.byteLength(path);
			let p = 9;
			const buf = Buffer.allocUnsafe(13 + pathLen);
			writeUInt32BE(buf, buf.length - 4, 0);
			buf[4] = REQUEST.REALPATH;
			const reqid = this._writeReqid = this._writeReqid + 1 & MAX_REQID;
			writeUInt32BE(buf, reqid, 5);
			writeUInt32BE(buf, pathLen, p);
			buf.utf8Write(path, p += 4, pathLen);
			this._requests[reqid] = { cb: (err, names) => {
				if (typeof cb !== "function") return;
				if (err) return cb(err);
				if (!names || !names.length) return cb(/* @__PURE__ */ new Error("Response missing path info"));
				cb(void 0, names[0].filename);
			} };
			const isBuffered = sendOrBuffer(this, buf);
			this._debug && this._debug(`SFTP: Outbound: ${isBuffered ? "Buffered" : "Sending"} REALPATH`);
		}
		ext_openssh_rename(oldPath, newPath, cb) {
			if (this.server) throw new Error("Client-only method called in server mode");
			const ext = this._extensions["posix-rename@openssh.com"];
			if (!ext || ext !== "1") throw new Error("Server does not support this extended request");
			const oldLen = Buffer.byteLength(oldPath);
			const newLen = Buffer.byteLength(newPath);
			let p = 9;
			const buf = Buffer.allocUnsafe(41 + oldLen + 4 + newLen);
			writeUInt32BE(buf, buf.length - 4, 0);
			buf[4] = REQUEST.EXTENDED;
			const reqid = this._writeReqid = this._writeReqid + 1 & MAX_REQID;
			writeUInt32BE(buf, reqid, 5);
			writeUInt32BE(buf, 24, p);
			buf.utf8Write("posix-rename@openssh.com", p += 4, 24);
			writeUInt32BE(buf, oldLen, p += 24);
			buf.utf8Write(oldPath, p += 4, oldLen);
			writeUInt32BE(buf, newLen, p += oldLen);
			buf.utf8Write(newPath, p += 4, newLen);
			this._requests[reqid] = { cb };
			const isBuffered = sendOrBuffer(this, buf);
			if (this._debug) {
				const which = isBuffered ? "Buffered" : "Sending";
				this._debug(`SFTP: Outbound: ${which} posix-rename@openssh.com`);
			}
		}
		ext_openssh_statvfs(path, cb) {
			if (this.server) throw new Error("Client-only method called in server mode");
			const ext = this._extensions["statvfs@openssh.com"];
			if (!ext || ext !== "2") throw new Error("Server does not support this extended request");
			const pathLen = Buffer.byteLength(path);
			let p = 9;
			const buf = Buffer.allocUnsafe(36 + pathLen);
			writeUInt32BE(buf, buf.length - 4, 0);
			buf[4] = REQUEST.EXTENDED;
			const reqid = this._writeReqid = this._writeReqid + 1 & MAX_REQID;
			writeUInt32BE(buf, reqid, 5);
			writeUInt32BE(buf, 19, p);
			buf.utf8Write("statvfs@openssh.com", p += 4, 19);
			writeUInt32BE(buf, pathLen, p += 19);
			buf.utf8Write(path, p += 4, pathLen);
			this._requests[reqid] = {
				extended: "statvfs@openssh.com",
				cb
			};
			const isBuffered = sendOrBuffer(this, buf);
			if (this._debug) {
				const which = isBuffered ? "Buffered" : "Sending";
				this._debug(`SFTP: Outbound: ${which} statvfs@openssh.com`);
			}
		}
		ext_openssh_fstatvfs(handle, cb) {
			if (this.server) throw new Error("Client-only method called in server mode");
			const ext = this._extensions["fstatvfs@openssh.com"];
			if (!ext || ext !== "2") throw new Error("Server does not support this extended request");
			if (!Buffer.isBuffer(handle)) throw new Error("handle is not a Buffer");
			const handleLen = handle.length;
			let p = 9;
			const buf = Buffer.allocUnsafe(37 + handleLen);
			writeUInt32BE(buf, buf.length - 4, 0);
			buf[4] = REQUEST.EXTENDED;
			const reqid = this._writeReqid = this._writeReqid + 1 & MAX_REQID;
			writeUInt32BE(buf, reqid, 5);
			writeUInt32BE(buf, 20, p);
			buf.utf8Write("fstatvfs@openssh.com", p += 4, 20);
			writeUInt32BE(buf, handleLen, p += 20);
			buf.set(handle, p += 4);
			this._requests[reqid] = {
				extended: "fstatvfs@openssh.com",
				cb
			};
			const isBuffered = sendOrBuffer(this, buf);
			if (this._debug) {
				const which = isBuffered ? "Buffered" : "Sending";
				this._debug(`SFTP: Outbound: ${which} fstatvfs@openssh.com`);
			}
		}
		ext_openssh_hardlink(oldPath, newPath, cb) {
			if (this.server) throw new Error("Client-only method called in server mode");
			if (this._extensions["hardlink@openssh.com"] !== "1") throw new Error("Server does not support this extended request");
			const oldLen = Buffer.byteLength(oldPath);
			const newLen = Buffer.byteLength(newPath);
			let p = 9;
			const buf = Buffer.allocUnsafe(37 + oldLen + 4 + newLen);
			writeUInt32BE(buf, buf.length - 4, 0);
			buf[4] = REQUEST.EXTENDED;
			const reqid = this._writeReqid = this._writeReqid + 1 & MAX_REQID;
			writeUInt32BE(buf, reqid, 5);
			writeUInt32BE(buf, 20, p);
			buf.utf8Write("hardlink@openssh.com", p += 4, 20);
			writeUInt32BE(buf, oldLen, p += 20);
			buf.utf8Write(oldPath, p += 4, oldLen);
			writeUInt32BE(buf, newLen, p += oldLen);
			buf.utf8Write(newPath, p += 4, newLen);
			this._requests[reqid] = { cb };
			const isBuffered = sendOrBuffer(this, buf);
			if (this._debug) {
				const which = isBuffered ? "Buffered" : "Sending";
				this._debug(`SFTP: Outbound: ${which} hardlink@openssh.com`);
			}
		}
		ext_openssh_fsync(handle, cb) {
			if (this.server) throw new Error("Client-only method called in server mode");
			if (this._extensions["fsync@openssh.com"] !== "1") throw new Error("Server does not support this extended request");
			if (!Buffer.isBuffer(handle)) throw new Error("handle is not a Buffer");
			const handleLen = handle.length;
			let p = 9;
			const buf = Buffer.allocUnsafe(34 + handleLen);
			writeUInt32BE(buf, buf.length - 4, 0);
			buf[4] = REQUEST.EXTENDED;
			const reqid = this._writeReqid = this._writeReqid + 1 & MAX_REQID;
			writeUInt32BE(buf, reqid, 5);
			writeUInt32BE(buf, 17, p);
			buf.utf8Write("fsync@openssh.com", p += 4, 17);
			writeUInt32BE(buf, handleLen, p += 17);
			buf.set(handle, p += 4);
			this._requests[reqid] = { cb };
			const isBuffered = sendOrBuffer(this, buf);
			this._debug && this._debug(`SFTP: Outbound: ${isBuffered ? "Buffered" : "Sending"} fsync@openssh.com`);
		}
		ext_openssh_lsetstat(path, attrs, cb) {
			if (this.server) throw new Error("Client-only method called in server mode");
			if (this._extensions["lsetstat@openssh.com"] !== "1") throw new Error("Server does not support this extended request");
			let flags = 0;
			let attrsLen = 0;
			if (typeof attrs === "object" && attrs !== null) {
				attrs = attrsToBytes(attrs);
				flags = attrs.flags;
				attrsLen = attrs.nb;
			} else if (typeof attrs === "function") cb = attrs;
			const pathLen = Buffer.byteLength(path);
			let p = 9;
			const buf = Buffer.allocUnsafe(37 + pathLen + 4 + attrsLen);
			writeUInt32BE(buf, buf.length - 4, 0);
			buf[4] = REQUEST.EXTENDED;
			const reqid = this._writeReqid = this._writeReqid + 1 & MAX_REQID;
			writeUInt32BE(buf, reqid, 5);
			writeUInt32BE(buf, 20, p);
			buf.utf8Write("lsetstat@openssh.com", p += 4, 20);
			writeUInt32BE(buf, pathLen, p += 20);
			buf.utf8Write(path, p += 4, pathLen);
			writeUInt32BE(buf, flags, p += pathLen);
			if (attrsLen) {
				p += 4;
				if (attrsLen === ATTRS_BUF.length) buf.set(ATTRS_BUF, p);
				else bufferCopy(ATTRS_BUF, buf, 0, attrsLen, p);
				p += attrsLen;
			}
			this._requests[reqid] = { cb };
			const isBuffered = sendOrBuffer(this, buf);
			if (this._debug) {
				const status = isBuffered ? "Buffered" : "Sending";
				this._debug(`SFTP: Outbound: ${status} lsetstat@openssh.com`);
			}
		}
		ext_openssh_expandPath(path, cb) {
			if (this.server) throw new Error("Client-only method called in server mode");
			if (this._extensions["expand-path@openssh.com"] !== "1") throw new Error("Server does not support this extended request");
			const pathLen = Buffer.byteLength(path);
			let p = 9;
			const buf = Buffer.allocUnsafe(40 + pathLen);
			writeUInt32BE(buf, buf.length - 4, 0);
			buf[4] = REQUEST.EXTENDED;
			const reqid = this._writeReqid = this._writeReqid + 1 & MAX_REQID;
			writeUInt32BE(buf, reqid, 5);
			writeUInt32BE(buf, 23, p);
			buf.utf8Write("expand-path@openssh.com", p += 4, 23);
			writeUInt32BE(buf, pathLen, p += 20);
			buf.utf8Write(path, p += 4, pathLen);
			this._requests[reqid] = { cb: (err, names) => {
				if (typeof cb !== "function") return;
				if (err) return cb(err);
				if (!names || !names.length) return cb(/* @__PURE__ */ new Error("Response missing expanded path"));
				cb(void 0, names[0].filename);
			} };
			const isBuffered = sendOrBuffer(this, buf);
			if (this._debug) {
				const status = isBuffered ? "Buffered" : "Sending";
				this._debug(`SFTP: Outbound: ${status} expand-path@openssh.com`);
			}
		}
		ext_copy_data(srcHandle, srcOffset, len, dstHandle, dstOffset, cb) {
			if (this.server) throw new Error("Client-only method called in server mode");
			if (this._extensions["copy-data"] !== "1") throw new Error("Server does not support this extended request");
			if (!Buffer.isBuffer(srcHandle)) throw new Error("Source handle is not a Buffer");
			if (!Buffer.isBuffer(dstHandle)) throw new Error("Destination handle is not a Buffer");
			let p = 0;
			const buf = Buffer.allocUnsafe(26 + srcHandle.length + 8 + 8 + 4 + dstHandle.length + 8);
			writeUInt32BE(buf, buf.length - 4, p);
			p += 4;
			buf[p] = REQUEST.EXTENDED;
			++p;
			const reqid = this._writeReqid = this._writeReqid + 1 & MAX_REQID;
			writeUInt32BE(buf, reqid, p);
			p += 4;
			writeUInt32BE(buf, 9, p);
			p += 4;
			buf.utf8Write("copy-data", p, 9);
			p += 9;
			writeUInt32BE(buf, srcHandle.length, p);
			p += 4;
			buf.set(srcHandle, p);
			p += srcHandle.length;
			for (let i = 7; i >= 0; --i) {
				buf[p + i] = srcOffset & 255;
				srcOffset /= 256;
			}
			p += 8;
			for (let i = 7; i >= 0; --i) {
				buf[p + i] = len & 255;
				len /= 256;
			}
			p += 8;
			writeUInt32BE(buf, dstHandle.length, p);
			p += 4;
			buf.set(dstHandle, p);
			p += dstHandle.length;
			for (let i = 7; i >= 0; --i) {
				buf[p + i] = dstOffset & 255;
				dstOffset /= 256;
			}
			this._requests[reqid] = { cb };
			const isBuffered = sendOrBuffer(this, buf);
			if (this._debug) {
				const status = isBuffered ? "Buffered" : "Sending";
				this._debug(`SFTP: Outbound: ${status} copy-data`);
			}
		}
		ext_home_dir(username, cb) {
			if (this.server) throw new Error("Client-only method called in server mode");
			if (this._extensions["home-directory"] !== "1") throw new Error("Server does not support this extended request");
			if (typeof username !== "string") throw new TypeError("username is not a string");
			let p = 0;
			const usernameLen = Buffer.byteLength(username);
			const buf = Buffer.allocUnsafe(31 + usernameLen);
			writeUInt32BE(buf, buf.length - 4, p);
			p += 4;
			buf[p] = REQUEST.EXTENDED;
			++p;
			const reqid = this._writeReqid = this._writeReqid + 1 & MAX_REQID;
			writeUInt32BE(buf, reqid, p);
			p += 4;
			writeUInt32BE(buf, 14, p);
			p += 4;
			buf.utf8Write("home-directory", p, 14);
			p += 14;
			writeUInt32BE(buf, usernameLen, p);
			p += 4;
			buf.utf8Write(username, p, usernameLen);
			p += usernameLen;
			this._requests[reqid] = { cb: (err, names) => {
				if (typeof cb !== "function") return;
				if (err) return cb(err);
				if (!names || !names.length) return cb(/* @__PURE__ */ new Error("Response missing home directory"));
				cb(void 0, names[0].filename);
			} };
			const isBuffered = sendOrBuffer(this, buf);
			if (this._debug) {
				const status = isBuffered ? "Buffered" : "Sending";
				this._debug(`SFTP: Outbound: ${status} home-directory`);
			}
		}
		ext_users_groups(uids, gids, cb) {
			if (this.server) throw new Error("Client-only method called in server mode");
			if (this._extensions["users-groups-by-id@openssh.com"] !== "1") throw new Error("Server does not support this extended request");
			if (!Array.isArray(uids)) throw new TypeError("uids is not an array");
			for (const val of uids) if (!Number.isInteger(val) || val < 0 || val > 2 ** 32 - 1) throw new Error("uid values must all be 32-bit unsigned integers");
			if (!Array.isArray(gids)) throw new TypeError("gids is not an array");
			for (const val of gids) if (!Number.isInteger(val) || val < 0 || val > 2 ** 32 - 1) throw new Error("gid values must all be 32-bit unsigned integers");
			let p = 0;
			const buf = Buffer.allocUnsafe(47 + 4 * uids.length + 4 + 4 * gids.length);
			writeUInt32BE(buf, buf.length - 4, p);
			p += 4;
			buf[p] = REQUEST.EXTENDED;
			++p;
			const reqid = this._writeReqid = this._writeReqid + 1 & MAX_REQID;
			writeUInt32BE(buf, reqid, p);
			p += 4;
			writeUInt32BE(buf, 30, p);
			p += 4;
			buf.utf8Write("users-groups-by-id@openssh.com", p, 30);
			p += 30;
			writeUInt32BE(buf, 4 * uids.length, p);
			p += 4;
			for (const val of uids) {
				writeUInt32BE(buf, val, p);
				p += 4;
			}
			writeUInt32BE(buf, 4 * gids.length, p);
			p += 4;
			for (const val of gids) {
				writeUInt32BE(buf, val, p);
				p += 4;
			}
			this._requests[reqid] = {
				extended: "users-groups-by-id@openssh.com",
				cb
			};
			const isBuffered = sendOrBuffer(this, buf);
			if (this._debug) {
				const status = isBuffered ? "Buffered" : "Sending";
				this._debug(`SFTP: Outbound: ${status} users-groups-by-id@openssh.com`);
			}
		}
		handle(reqid, handle) {
			if (!this.server) throw new Error("Server-only method called in client mode");
			if (!Buffer.isBuffer(handle)) throw new Error("handle is not a Buffer");
			const handleLen = handle.length;
			if (handleLen > 256) throw new Error("handle too large (> 256 bytes)");
			let p = 9;
			const buf = Buffer.allocUnsafe(13 + handleLen);
			writeUInt32BE(buf, buf.length - 4, 0);
			buf[4] = RESPONSE.HANDLE;
			writeUInt32BE(buf, reqid, 5);
			writeUInt32BE(buf, handleLen, p);
			if (handleLen) buf.set(handle, p += 4);
			const isBuffered = sendOrBuffer(this, buf);
			this._debug && this._debug(`SFTP: Outbound: ${isBuffered ? "Buffered" : "Sending"} HANDLE`);
		}
		status(reqid, code, message) {
			if (!this.server) throw new Error("Server-only method called in client mode");
			if (!VALID_STATUS_CODES.has(code)) throw new Error(`Bad status code: ${code}`);
			message || (message = "");
			const msgLen = Buffer.byteLength(message);
			let p = 9;
			const buf = Buffer.allocUnsafe(17 + msgLen + 4);
			writeUInt32BE(buf, buf.length - 4, 0);
			buf[4] = RESPONSE.STATUS;
			writeUInt32BE(buf, reqid, 5);
			writeUInt32BE(buf, code, p);
			writeUInt32BE(buf, msgLen, p += 4);
			p += 4;
			if (msgLen) {
				buf.utf8Write(message, p, msgLen);
				p += msgLen;
			}
			writeUInt32BE(buf, 0, p);
			const isBuffered = sendOrBuffer(this, buf);
			this._debug && this._debug(`SFTP: Outbound: ${isBuffered ? "Buffered" : "Sending"} STATUS`);
		}
		data(reqid, data, encoding) {
			if (!this.server) throw new Error("Server-only method called in client mode");
			const isBuffer = Buffer.isBuffer(data);
			if (!isBuffer && typeof data !== "string") throw new Error("data is not a Buffer or string");
			let isUTF8;
			if (!isBuffer && !encoding) {
				encoding = void 0;
				isUTF8 = true;
			}
			const dataLen = isBuffer ? data.length : Buffer.byteLength(data, encoding);
			let p = 9;
			const buf = Buffer.allocUnsafe(13 + dataLen);
			writeUInt32BE(buf, buf.length - 4, 0);
			buf[4] = RESPONSE.DATA;
			writeUInt32BE(buf, reqid, 5);
			writeUInt32BE(buf, dataLen, p);
			if (dataLen) {
				if (isBuffer) buf.set(data, p += 4);
				else if (isUTF8) buf.utf8Write(data, p += 4, dataLen);
				else buf.write(data, p += 4, dataLen, encoding);
			}
			const isBuffered = sendOrBuffer(this, buf);
			this._debug && this._debug(`SFTP: Outbound: ${isBuffered ? "Buffered" : "Sending"} DATA`);
		}
		name(reqid, names) {
			if (!this.server) throw new Error("Server-only method called in client mode");
			if (!Array.isArray(names)) {
				if (typeof names !== "object" || names === null) throw new Error("names is not an object or array");
				names = [names];
			}
			const count = names.length;
			let namesLen = 0;
			let nameAttrs;
			const attrs = [];
			for (let i = 0; i < count; ++i) {
				const name = names[i];
				const filename = !name || !name.filename || typeof name.filename !== "string" ? "" : name.filename;
				namesLen += 4 + Buffer.byteLength(filename);
				const longname = !name || !name.longname || typeof name.longname !== "string" ? "" : name.longname;
				namesLen += 4 + Buffer.byteLength(longname);
				if (typeof name.attrs === "object" && name.attrs !== null) {
					nameAttrs = attrsToBytes(name.attrs);
					namesLen += 4 + nameAttrs.nb;
					if (nameAttrs.nb) {
						let bytes;
						if (nameAttrs.nb === ATTRS_BUF.length) bytes = new Uint8Array(ATTRS_BUF);
						else {
							bytes = new Uint8Array(nameAttrs.nb);
							bufferCopy(ATTRS_BUF, bytes, 0, nameAttrs.nb, 0);
						}
						nameAttrs.bytes = bytes;
					}
					attrs.push(nameAttrs);
				} else {
					namesLen += 4;
					attrs.push(null);
				}
			}
			let p = 9;
			const buf = Buffer.allocUnsafe(13 + namesLen);
			writeUInt32BE(buf, buf.length - 4, 0);
			buf[4] = RESPONSE.NAME;
			writeUInt32BE(buf, reqid, 5);
			writeUInt32BE(buf, count, p);
			p += 4;
			for (let i = 0; i < count; ++i) {
				const name = names[i];
				{
					const filename = !name || !name.filename || typeof name.filename !== "string" ? "" : name.filename;
					const len = Buffer.byteLength(filename);
					writeUInt32BE(buf, len, p);
					p += 4;
					if (len) {
						buf.utf8Write(filename, p, len);
						p += len;
					}
				}
				{
					const longname = !name || !name.longname || typeof name.longname !== "string" ? "" : name.longname;
					const len = Buffer.byteLength(longname);
					writeUInt32BE(buf, len, p);
					p += 4;
					if (len) {
						buf.utf8Write(longname, p, len);
						p += len;
					}
				}
				const attr = attrs[i];
				if (attr) {
					writeUInt32BE(buf, attr.flags, p);
					p += 4;
					if (attr.flags && attr.bytes) {
						buf.set(attr.bytes, p);
						p += attr.nb;
					}
				} else {
					writeUInt32BE(buf, 0, p);
					p += 4;
				}
			}
			const isBuffered = sendOrBuffer(this, buf);
			this._debug && this._debug(`SFTP: Outbound: ${isBuffered ? "Buffered" : "Sending"} NAME`);
		}
		attrs(reqid, attrs) {
			if (!this.server) throw new Error("Server-only method called in client mode");
			if (typeof attrs !== "object" || attrs === null) throw new Error("attrs is not an object");
			attrs = attrsToBytes(attrs);
			const flags = attrs.flags;
			const attrsLen = attrs.nb;
			let p = 9;
			const buf = Buffer.allocUnsafe(13 + attrsLen);
			writeUInt32BE(buf, buf.length - 4, 0);
			buf[4] = RESPONSE.ATTRS;
			writeUInt32BE(buf, reqid, 5);
			writeUInt32BE(buf, flags, p);
			if (attrsLen) {
				p += 4;
				if (attrsLen === ATTRS_BUF.length) buf.set(ATTRS_BUF, p);
				else bufferCopy(ATTRS_BUF, buf, 0, attrsLen, p);
				p += attrsLen;
			}
			const isBuffered = sendOrBuffer(this, buf);
			this._debug && this._debug(`SFTP: Outbound: ${isBuffered ? "Buffered" : "Sending"} ATTRS`);
		}
	};
	function tryCreateBuffer(size) {
		try {
			return Buffer.allocUnsafe(size);
		} catch (ex) {
			return ex;
		}
	}
	function read_(self, handle, buf, off, len, position, cb, req_) {
		const maxDataLen = self._maxReadLen;
		const overflow = Math.max(len - maxDataLen, 0);
		if (overflow) len = maxDataLen;
		const handleLen = handle.length;
		let p = 9;
		let pos = position;
		const out = Buffer.allocUnsafe(13 + handleLen + 8 + 4);
		writeUInt32BE(out, out.length - 4, 0);
		out[4] = REQUEST.READ;
		const reqid = self._writeReqid = self._writeReqid + 1 & MAX_REQID;
		writeUInt32BE(out, reqid, 5);
		writeUInt32BE(out, handleLen, p);
		out.set(handle, p += 4);
		p += handleLen;
		for (let i = 7; i >= 0; --i) {
			out[p + i] = pos & 255;
			pos /= 256;
		}
		writeUInt32BE(out, len, p += 8);
		if (typeof cb !== "function") cb = noop;
		const req = req_ || {
			nb: 0,
			position,
			off,
			origOff: off,
			len: void 0,
			overflow: void 0,
			cb: (err, data, nb) => {
				const len = req.len;
				const overflow = req.overflow;
				if (err) {
					if (cb._wantEOFError || err.code !== STATUS_CODE.EOF) return cb(err);
				} else if (nb > len) return cb(/* @__PURE__ */ new Error("Received more data than requested"));
				else if (nb === len && overflow) {
					req.nb += nb;
					req.position += nb;
					req.off += nb;
					read_(self, handle, buf, req.off, overflow, req.position, cb, req);
					return;
				}
				nb = nb || 0;
				if (req.origOff === 0 && buf.length === req.nb) data = buf;
				else data = bufferSlice(buf, req.origOff, req.origOff + req.nb + nb);
				cb(void 0, req.nb + nb, data, req.position);
			},
			buffer: void 0
		};
		req.len = len;
		req.overflow = overflow;
		req.buffer = bufferSlice(buf, off, off + len);
		self._requests[reqid] = req;
		const isBuffered = sendOrBuffer(self, out);
		self._debug && self._debug(`SFTP: Outbound: ${isBuffered ? "Buffered" : "Sending"} READ`);
	}
	function fastXfer(src, dst, srcPath, dstPath, opts, cb) {
		let concurrency = 64;
		let chunkSize = 32768;
		let onstep;
		let mode;
		let fileSize;
		if (typeof opts === "function") cb = opts;
		else if (typeof opts === "object" && opts !== null) {
			if (typeof opts.concurrency === "number" && opts.concurrency > 0 && !isNaN(opts.concurrency)) concurrency = opts.concurrency;
			if (typeof opts.chunkSize === "number" && opts.chunkSize > 0 && !isNaN(opts.chunkSize)) chunkSize = opts.chunkSize;
			if (typeof opts.fileSize === "number" && opts.fileSize > 0 && !isNaN(opts.fileSize)) fileSize = opts.fileSize;
			if (typeof opts.step === "function") onstep = opts.step;
			if (typeof opts.mode === "string" || typeof opts.mode === "number") mode = modeNum(opts.mode);
		}
		let fsize;
		let pdst = 0;
		let total = 0;
		let hadError = false;
		let srcHandle;
		let dstHandle;
		let readbuf;
		let bufsize = chunkSize * concurrency;
		function onerror(err) {
			if (hadError) return;
			hadError = true;
			let left = 0;
			let cbfinal;
			if (srcHandle || dstHandle) {
				cbfinal = () => {
					if (--left === 0) cb(err);
				};
				if (srcHandle && (src === fs || src.outgoing.state === "open")) ++left;
				if (dstHandle && (dst === fs || dst.outgoing.state === "open")) ++left;
				if (srcHandle && (src === fs || src.outgoing.state === "open")) src.close(srcHandle, cbfinal);
				if (dstHandle && (dst === fs || dst.outgoing.state === "open")) dst.close(dstHandle, cbfinal);
			} else cb(err);
		}
		src.open(srcPath, "r", (err, sourceHandle) => {
			if (err) return onerror(err);
			srcHandle = sourceHandle;
			if (fileSize === void 0) src.fstat(srcHandle, tryStat);
			else tryStat(null, { size: fileSize });
			function tryStat(err, attrs) {
				if (err) {
					if (src !== fs) {
						src.stat(srcPath, (err_, attrs_) => {
							if (err_) return onerror(err);
							tryStat(null, attrs_);
						});
						return;
					}
					return onerror(err);
				}
				fsize = attrs.size;
				dst.open(dstPath, "w", (err, destHandle) => {
					if (err) return onerror(err);
					dstHandle = destHandle;
					if (fsize <= 0) return onerror();
					while (bufsize > fsize) {
						if (concurrency === 1) {
							bufsize = fsize;
							break;
						}
						bufsize -= chunkSize;
						--concurrency;
					}
					readbuf = tryCreateBuffer(bufsize);
					if (readbuf instanceof Error) return onerror(readbuf);
					if (mode !== void 0) dst.fchmod(dstHandle, mode, function tryAgain(err) {
						if (err) {
							dst.chmod(dstPath, mode, (err_) => tryAgain());
							return;
						}
						startReads();
					});
					else startReads();
					function onread(err, nb, data, dstpos, datapos, origChunkLen) {
						if (err) return onerror(err);
						datapos = datapos || 0;
						dst.write(dstHandle, readbuf, datapos, nb, dstpos, writeCb);
						function writeCb(err) {
							if (err) return onerror(err);
							total += nb;
							onstep && onstep(total, nb, fsize);
							if (nb < origChunkLen) return singleRead(datapos, dstpos + nb, origChunkLen - nb);
							if (total === fsize) {
								dst.close(dstHandle, (err) => {
									dstHandle = void 0;
									if (err) return onerror(err);
									src.close(srcHandle, (err) => {
										srcHandle = void 0;
										if (err) return onerror(err);
										cb();
									});
								});
								return;
							}
							if (pdst >= fsize) return;
							const chunk = pdst + chunkSize > fsize ? fsize - pdst : chunkSize;
							singleRead(datapos, pdst, chunk);
							pdst += chunk;
						}
					}
					function makeCb(psrc, pdst, chunk) {
						return (err, nb, data) => {
							onread(err, nb, data, pdst, psrc, chunk);
						};
					}
					function singleRead(psrc, pdst, chunk) {
						src.read(srcHandle, readbuf, psrc, chunk, pdst, makeCb(psrc, pdst, chunk));
					}
					function startReads() {
						let reads = 0;
						let psrc = 0;
						while (pdst < fsize && reads < concurrency) {
							const chunk = pdst + chunkSize > fsize ? fsize - pdst : chunkSize;
							singleRead(psrc, pdst, chunk);
							psrc += chunk;
							pdst += chunk;
							++reads;
						}
					}
				});
			}
		});
	}
	function writeAll(sftp, handle, buffer, offset, length, position, callback_) {
		const callback = typeof callback_ === "function" ? callback_ : void 0;
		sftp.write(handle, buffer, offset, length, position, (writeErr, written) => {
			if (writeErr) return sftp.close(handle, () => {
				callback && callback(writeErr);
			});
			if (written === length) sftp.close(handle, callback);
			else {
				offset += written;
				length -= written;
				position += written;
				writeAll(sftp, handle, buffer, offset, length, position, callback);
			}
		});
	}
	var Stats = class {
		constructor(initial) {
			this.mode = initial && initial.mode;
			this.uid = initial && initial.uid;
			this.gid = initial && initial.gid;
			this.size = initial && initial.size;
			this.atime = initial && initial.atime;
			this.mtime = initial && initial.mtime;
			this.extended = initial && initial.extended;
		}
		isDirectory() {
			return (this.mode & constants.S_IFMT) === constants.S_IFDIR;
		}
		isFile() {
			return (this.mode & constants.S_IFMT) === constants.S_IFREG;
		}
		isBlockDevice() {
			return (this.mode & constants.S_IFMT) === constants.S_IFBLK;
		}
		isCharacterDevice() {
			return (this.mode & constants.S_IFMT) === constants.S_IFCHR;
		}
		isSymbolicLink() {
			return (this.mode & constants.S_IFMT) === constants.S_IFLNK;
		}
		isFIFO() {
			return (this.mode & constants.S_IFMT) === constants.S_IFIFO;
		}
		isSocket() {
			return (this.mode & constants.S_IFMT) === constants.S_IFSOCK;
		}
	};
	function attrsToBytes(attrs) {
		let flags = 0;
		let nb = 0;
		if (typeof attrs === "object" && attrs !== null) {
			if (typeof attrs.size === "number") {
				flags |= ATTR.SIZE;
				const val = attrs.size;
				ATTRS_BUF[nb++] = val / 0x100000000000000;
				ATTRS_BUF[nb++] = val / 0x1000000000000;
				ATTRS_BUF[nb++] = val / 0x10000000000;
				ATTRS_BUF[nb++] = val / 4294967296;
				ATTRS_BUF[nb++] = val / 16777216;
				ATTRS_BUF[nb++] = val / 65536;
				ATTRS_BUF[nb++] = val / 256;
				ATTRS_BUF[nb++] = val;
			}
			if (typeof attrs.uid === "number" && typeof attrs.gid === "number") {
				flags |= ATTR.UIDGID;
				const uid = attrs.uid;
				const gid = attrs.gid;
				ATTRS_BUF[nb++] = uid >>> 24;
				ATTRS_BUF[nb++] = uid >>> 16;
				ATTRS_BUF[nb++] = uid >>> 8;
				ATTRS_BUF[nb++] = uid;
				ATTRS_BUF[nb++] = gid >>> 24;
				ATTRS_BUF[nb++] = gid >>> 16;
				ATTRS_BUF[nb++] = gid >>> 8;
				ATTRS_BUF[nb++] = gid;
			}
			if (typeof attrs.mode === "number" || typeof attrs.mode === "string") {
				const mode = modeNum(attrs.mode);
				flags |= ATTR.PERMISSIONS;
				ATTRS_BUF[nb++] = mode >>> 24;
				ATTRS_BUF[nb++] = mode >>> 16;
				ATTRS_BUF[nb++] = mode >>> 8;
				ATTRS_BUF[nb++] = mode;
			}
			if ((typeof attrs.atime === "number" || isDate(attrs.atime)) && (typeof attrs.mtime === "number" || isDate(attrs.mtime))) {
				const atime = toUnixTimestamp(attrs.atime);
				const mtime = toUnixTimestamp(attrs.mtime);
				flags |= ATTR.ACMODTIME;
				ATTRS_BUF[nb++] = atime >>> 24;
				ATTRS_BUF[nb++] = atime >>> 16;
				ATTRS_BUF[nb++] = atime >>> 8;
				ATTRS_BUF[nb++] = atime;
				ATTRS_BUF[nb++] = mtime >>> 24;
				ATTRS_BUF[nb++] = mtime >>> 16;
				ATTRS_BUF[nb++] = mtime >>> 8;
				ATTRS_BUF[nb++] = mtime;
			}
		}
		return {
			flags,
			nb
		};
	}
	function toUnixTimestamp(time) {
		if (typeof time === "number" && time === time) return time;
		if (isDate(time)) return parseInt(time.getTime() / 1e3, 10);
		throw new Error(`Cannot parse time: ${time}`);
	}
	function modeNum(mode) {
		if (typeof mode === "number" && mode === mode) return mode;
		if (typeof mode === "string") return modeNum(parseInt(mode, 8));
		throw new Error(`Cannot parse mode: ${mode}`);
	}
	const stringFlagMap = {
		"r": OPEN_MODE.READ,
		"r+": OPEN_MODE.READ | OPEN_MODE.WRITE,
		"w": OPEN_MODE.TRUNC | OPEN_MODE.CREAT | OPEN_MODE.WRITE,
		"wx": OPEN_MODE.TRUNC | OPEN_MODE.CREAT | OPEN_MODE.WRITE | OPEN_MODE.EXCL,
		"xw": OPEN_MODE.TRUNC | OPEN_MODE.CREAT | OPEN_MODE.WRITE | OPEN_MODE.EXCL,
		"w+": OPEN_MODE.TRUNC | OPEN_MODE.CREAT | OPEN_MODE.READ | OPEN_MODE.WRITE,
		"wx+": OPEN_MODE.TRUNC | OPEN_MODE.CREAT | OPEN_MODE.READ | OPEN_MODE.WRITE | OPEN_MODE.EXCL,
		"xw+": OPEN_MODE.TRUNC | OPEN_MODE.CREAT | OPEN_MODE.READ | OPEN_MODE.WRITE | OPEN_MODE.EXCL,
		"a": OPEN_MODE.APPEND | OPEN_MODE.CREAT | OPEN_MODE.WRITE,
		"ax": OPEN_MODE.APPEND | OPEN_MODE.CREAT | OPEN_MODE.WRITE | OPEN_MODE.EXCL,
		"xa": OPEN_MODE.APPEND | OPEN_MODE.CREAT | OPEN_MODE.WRITE | OPEN_MODE.EXCL,
		"a+": OPEN_MODE.APPEND | OPEN_MODE.CREAT | OPEN_MODE.READ | OPEN_MODE.WRITE,
		"ax+": OPEN_MODE.APPEND | OPEN_MODE.CREAT | OPEN_MODE.READ | OPEN_MODE.WRITE | OPEN_MODE.EXCL,
		"xa+": OPEN_MODE.APPEND | OPEN_MODE.CREAT | OPEN_MODE.READ | OPEN_MODE.WRITE | OPEN_MODE.EXCL
	};
	function stringToFlags(str) {
		const flags = stringFlagMap[str];
		return flags !== void 0 ? flags : null;
	}
	const flagsToString = (() => {
		const stringFlagMapKeys = Object.keys(stringFlagMap);
		return (flags) => {
			for (let i = 0; i < stringFlagMapKeys.length; ++i) {
				const key = stringFlagMapKeys[i];
				if (stringFlagMap[key] === flags) return key;
			}
			return null;
		};
	})();
	function readAttrs(biOpt) {
		const flags = bufferParser.readUInt32BE();
		if (flags === void 0) return;
		const attrs = new Stats();
		if (flags & ATTR.SIZE) {
			const size = bufferParser.readUInt64BE(biOpt);
			if (size === void 0) return;
			attrs.size = size;
		}
		if (flags & ATTR.UIDGID) {
			const uid = bufferParser.readUInt32BE();
			const gid = bufferParser.readUInt32BE();
			if (gid === void 0) return;
			attrs.uid = uid;
			attrs.gid = gid;
		}
		if (flags & ATTR.PERMISSIONS) {
			const mode = bufferParser.readUInt32BE();
			if (mode === void 0) return;
			attrs.mode = mode;
		}
		if (flags & ATTR.ACMODTIME) {
			const atime = bufferParser.readUInt32BE();
			const mtime = bufferParser.readUInt32BE();
			if (mtime === void 0) return;
			attrs.atime = atime;
			attrs.mtime = mtime;
		}
		if (flags & ATTR.EXTENDED) {
			const count = bufferParser.readUInt32BE();
			if (count === void 0) return;
			const extended = {};
			for (let i = 0; i < count; ++i) {
				const type = bufferParser.readString(true);
				const data = bufferParser.readString();
				if (data === void 0) return;
				extended[type] = data;
			}
			attrs.extended = extended;
		}
		return attrs;
	}
	function sendOrBuffer(sftp, payload) {
		const ret = tryWritePayload(sftp, payload);
		if (ret !== void 0) {
			sftp._buffer.push(ret);
			return false;
		}
		return true;
	}
	function tryWritePayload(sftp, payload) {
		const outgoing = sftp.outgoing;
		if (outgoing.state !== "open") return;
		if (outgoing.window === 0) {
			sftp._waitWindow = true;
			sftp._chunkcb = drainBuffer;
			return payload;
		}
		let ret;
		const len = payload.length;
		let p = 0;
		while (len - p > 0 && outgoing.window > 0) {
			const actualLen = Math.min(len - p, outgoing.window, outgoing.packetSize);
			outgoing.window -= actualLen;
			if (outgoing.window === 0) {
				sftp._waitWindow = true;
				sftp._chunkcb = drainBuffer;
			}
			if (p === 0 && actualLen === len) sftp._protocol.channelData(sftp.outgoing.id, payload);
			else sftp._protocol.channelData(sftp.outgoing.id, bufferSlice(payload, p, p + actualLen));
			p += actualLen;
		}
		if (len - p > 0) {
			if (p > 0) ret = bufferSlice(payload, p, len);
			else ret = payload;
		}
		return ret;
	}
	function drainBuffer() {
		this._chunkcb = void 0;
		const buffer = this._buffer;
		let i = 0;
		while (i < buffer.length) {
			const payload = buffer[i];
			const ret = tryWritePayload(this, payload);
			if (ret !== void 0) {
				if (ret !== payload) buffer[i] = ret;
				if (i > 0) this._buffer = buffer.slice(i);
				return;
			}
			++i;
		}
		if (i > 0) this._buffer = [];
	}
	function doFatalSFTPError(sftp, msg, noDebug) {
		const err = new Error(msg);
		err.level = "sftp-protocol";
		if (!noDebug && sftp._debug) sftp._debug(`SFTP: Inbound: ${msg}`);
		sftp.emit("error", err);
		sftp.destroy();
		cleanupRequests(sftp);
		return false;
	}
	function cleanupRequests(sftp) {
		const keys = Object.keys(sftp._requests);
		if (keys.length === 0) return;
		const reqs = sftp._requests;
		sftp._requests = {};
		const err = /* @__PURE__ */ new Error("No response from server");
		for (let i = 0; i < keys.length; ++i) {
			const req = reqs[keys[i]];
			if (typeof req.cb === "function") req.cb(err);
		}
	}
	function requestLimits(sftp, cb) {
		let p = 9;
		const buf = Buffer.allocUnsafe(31);
		writeUInt32BE(buf, buf.length - 4, 0);
		buf[4] = REQUEST.EXTENDED;
		const reqid = sftp._writeReqid = sftp._writeReqid + 1 & MAX_REQID;
		writeUInt32BE(buf, reqid, 5);
		writeUInt32BE(buf, 18, p);
		buf.utf8Write("limits@openssh.com", p += 4, 18);
		sftp._requests[reqid] = {
			extended: "limits@openssh.com",
			cb
		};
		const isBuffered = sendOrBuffer(sftp, buf);
		if (sftp._debug) {
			const which = isBuffered ? "Buffered" : "Sending";
			sftp._debug(`SFTP: Outbound: ${which} limits@openssh.com`);
		}
	}
	const CLIENT_HANDLERS = {
		[RESPONSE.VERSION]: (sftp, payload) => {
			if (sftp._version !== -1) return doFatalSFTPError(sftp, "Duplicate VERSION packet");
			const extensions = {};
			bufferParser.init(payload, 1);
			let version = bufferParser.readUInt32BE();
			while (bufferParser.avail()) {
				const extName = bufferParser.readString(true);
				const extData = bufferParser.readString(true);
				if (extData === void 0) {
					version = void 0;
					break;
				}
				extensions[extName] = extData;
			}
			bufferParser.clear();
			if (version === void 0) return doFatalSFTPError(sftp, "Malformed VERSION packet");
			if (sftp._debug) {
				const names = Object.keys(extensions);
				if (names.length) sftp._debug(`SFTP: Inbound: Received VERSION (v${version}, exts:${names})`);
				else sftp._debug(`SFTP: Inbound: Received VERSION (v${version})`);
			}
			sftp._version = version;
			sftp._extensions = extensions;
			if (extensions["limits@openssh.com"] === "1") return requestLimits(sftp, (err, limits) => {
				if (!err) {
					if (limits.maxPktLen > 0) sftp._maxOutPktLen = limits.maxPktLen;
					if (limits.maxReadLen > 0) sftp._maxReadLen = limits.maxReadLen;
					if (limits.maxWriteLen > 0) sftp._maxWriteLen = limits.maxWriteLen;
					sftp.maxOpenHandles = limits.maxOpenHandles > 0 ? limits.maxOpenHandles : 1e400;
				}
				sftp.emit("ready");
			});
			sftp.emit("ready");
		},
		[RESPONSE.STATUS]: (sftp, payload) => {
			bufferParser.init(payload, 1);
			const reqID = bufferParser.readUInt32BE();
			const errorCode = bufferParser.readUInt32BE();
			const errorMsg = bufferParser.readString(true);
			bufferParser.clear();
			if (sftp._debug) {
				const jsonMsg = JSON.stringify(errorMsg);
				sftp._debug(`SFTP: Inbound: Received STATUS (id:${reqID}, ${errorCode}, ${jsonMsg})`);
			}
			const req = sftp._requests[reqID];
			delete sftp._requests[reqID];
			if (req && typeof req.cb === "function") {
				if (errorCode === STATUS_CODE.OK) {
					req.cb();
					return;
				}
				const err = new Error(errorMsg || STATUS_CODE_STR[errorCode] || "Unknown status");
				err.code = errorCode;
				req.cb(err);
			}
		},
		[RESPONSE.HANDLE]: (sftp, payload) => {
			bufferParser.init(payload, 1);
			const reqID = bufferParser.readUInt32BE();
			const handle = bufferParser.readString();
			bufferParser.clear();
			if (handle === void 0) {
				if (reqID !== void 0) delete sftp._requests[reqID];
				return doFatalSFTPError(sftp, "Malformed HANDLE packet");
			}
			sftp._debug && sftp._debug(`SFTP: Inbound: Received HANDLE (id:${reqID})`);
			const req = sftp._requests[reqID];
			delete sftp._requests[reqID];
			if (req && typeof req.cb === "function") req.cb(void 0, handle);
		},
		[RESPONSE.DATA]: (sftp, payload) => {
			bufferParser.init(payload, 1);
			const reqID = bufferParser.readUInt32BE();
			let req;
			if (reqID !== void 0) {
				req = sftp._requests[reqID];
				delete sftp._requests[reqID];
			}
			if (req && typeof req.cb === "function") {
				if (req.buffer) {
					const nb = bufferParser.readString(req.buffer);
					bufferParser.clear();
					if (nb !== void 0) {
						sftp._debug && sftp._debug(`SFTP: Inbound: Received DATA (id:${reqID}, ${nb})`);
						req.cb(void 0, req.buffer, nb);
						return;
					}
				} else {
					const data = bufferParser.readString();
					bufferParser.clear();
					if (data !== void 0) {
						sftp._debug && sftp._debug(`SFTP: Inbound: Received DATA (id:${reqID}, ${data.length})`);
						req.cb(void 0, data);
						return;
					}
				}
			} else {
				const nb = bufferParser.skipString();
				bufferParser.clear();
				if (nb !== void 0) {
					sftp._debug && sftp._debug(`SFTP: Inbound: Received DATA (id:${reqID}, ${nb})`);
					return;
				}
			}
			return doFatalSFTPError(sftp, "Malformed DATA packet");
		},
		[RESPONSE.NAME]: (sftp, payload) => {
			bufferParser.init(payload, 1);
			const reqID = bufferParser.readUInt32BE();
			let req;
			if (reqID !== void 0) {
				req = sftp._requests[reqID];
				delete sftp._requests[reqID];
			}
			const count = bufferParser.readUInt32BE();
			if (count !== void 0) {
				let names = [];
				for (let i = 0; i < count; ++i) {
					const filename = bufferParser.readString(true);
					const longname = bufferParser.readString(true);
					const attrs = readAttrs(sftp._biOpt);
					if (attrs === void 0) {
						names = void 0;
						break;
					}
					names.push({
						filename,
						longname,
						attrs
					});
				}
				if (names !== void 0) {
					sftp._debug && sftp._debug(`SFTP: Inbound: Received NAME (id:${reqID}, ${names.length})`);
					bufferParser.clear();
					if (req && typeof req.cb === "function") req.cb(void 0, names);
					return;
				}
			}
			bufferParser.clear();
			return doFatalSFTPError(sftp, "Malformed NAME packet");
		},
		[RESPONSE.ATTRS]: (sftp, payload) => {
			bufferParser.init(payload, 1);
			const reqID = bufferParser.readUInt32BE();
			let req;
			if (reqID !== void 0) {
				req = sftp._requests[reqID];
				delete sftp._requests[reqID];
			}
			const attrs = readAttrs(sftp._biOpt);
			bufferParser.clear();
			if (attrs !== void 0) {
				sftp._debug && sftp._debug(`SFTP: Inbound: Received ATTRS (id:${reqID})`);
				if (req && typeof req.cb === "function") req.cb(void 0, attrs);
				return;
			}
			return doFatalSFTPError(sftp, "Malformed ATTRS packet");
		},
		[RESPONSE.EXTENDED]: (sftp, payload) => {
			bufferParser.init(payload, 1);
			const reqID = bufferParser.readUInt32BE();
			if (reqID !== void 0) {
				const req = sftp._requests[reqID];
				if (req) {
					delete sftp._requests[reqID];
					switch (req.extended) {
						case "statvfs@openssh.com":
						case "fstatvfs@openssh.com": {
							const biOpt = sftp._biOpt;
							const stats = {
								f_bsize: bufferParser.readUInt64BE(biOpt),
								f_frsize: bufferParser.readUInt64BE(biOpt),
								f_blocks: bufferParser.readUInt64BE(biOpt),
								f_bfree: bufferParser.readUInt64BE(biOpt),
								f_bavail: bufferParser.readUInt64BE(biOpt),
								f_files: bufferParser.readUInt64BE(biOpt),
								f_ffree: bufferParser.readUInt64BE(biOpt),
								f_favail: bufferParser.readUInt64BE(biOpt),
								f_sid: bufferParser.readUInt64BE(biOpt),
								f_flag: bufferParser.readUInt64BE(biOpt),
								f_namemax: bufferParser.readUInt64BE(biOpt)
							};
							if (stats.f_namemax === void 0) break;
							if (sftp._debug) sftp._debug(`SFTP: Inbound: Received EXTENDED_REPLY (id:${reqID}, ${req.extended})`);
							bufferParser.clear();
							if (typeof req.cb === "function") req.cb(void 0, stats);
							return;
						}
						case "limits@openssh.com": {
							const limits = {
								maxPktLen: bufferParser.readUInt64BE(),
								maxReadLen: bufferParser.readUInt64BE(),
								maxWriteLen: bufferParser.readUInt64BE(),
								maxOpenHandles: bufferParser.readUInt64BE()
							};
							if (limits.maxOpenHandles === void 0) break;
							if (sftp._debug) sftp._debug(`SFTP: Inbound: Received EXTENDED_REPLY (id:${reqID}, ${req.extended})`);
							bufferParser.clear();
							if (typeof req.cb === "function") req.cb(void 0, limits);
							return;
						}
						case "users-groups-by-id@openssh.com": {
							const usernameCount = bufferParser.readUInt32BE();
							if (usernameCount === void 0) break;
							const usernames = new Array(usernameCount);
							for (let i = 0; i < usernames.length; ++i) usernames[i] = bufferParser.readString(true);
							const groupnameCount = bufferParser.readUInt32BE();
							if (groupnameCount === void 0) break;
							const groupnames = new Array(groupnameCount);
							for (let i = 0; i < groupnames.length; ++i) groupnames[i] = bufferParser.readString(true);
							if (groupnames.length > 0 && groupnames[groupnames.length - 1] === void 0) break;
							if (sftp._debug) sftp._debug(`SFTP: Inbound: Received EXTENDED_REPLY (id:${reqID}, ${req.extended})`);
							bufferParser.clear();
							if (typeof req.cb === "function") req.cb(void 0, usernames, groupnames);
							return;
						}
						default:
							sftp._debug && sftp._debug(`SFTP: Inbound: Received EXTENDED_REPLY (id:${reqID}, ???)`);
							bufferParser.clear();
							if (typeof req.cb === "function") req.cb();
							return;
					}
				} else {
					sftp._debug && sftp._debug(`SFTP: Inbound: Received EXTENDED_REPLY (id:${reqID}, ???)`);
					bufferParser.clear();
					return;
				}
			}
			bufferParser.clear();
			return doFatalSFTPError(sftp, "Malformed EXTENDED_REPLY packet");
		}
	};
	const SERVER_HANDLERS = {
		[REQUEST.INIT]: (sftp, payload) => {
			if (sftp._version !== -1) return doFatalSFTPError(sftp, "Duplicate INIT packet");
			const extensions = {};
			bufferParser.init(payload, 1);
			let version = bufferParser.readUInt32BE();
			while (bufferParser.avail()) {
				const extName = bufferParser.readString(true);
				const extData = bufferParser.readString(true);
				if (extData === void 0) {
					version = void 0;
					break;
				}
				extensions[extName] = extData;
			}
			bufferParser.clear();
			if (version === void 0) return doFatalSFTPError(sftp, "Malformed INIT packet");
			if (sftp._debug) {
				const names = Object.keys(extensions);
				if (names.length) sftp._debug(`SFTP: Inbound: Received INIT (v${version}, exts:${names})`);
				else sftp._debug(`SFTP: Inbound: Received INIT (v${version})`);
			}
			sendOrBuffer(sftp, SERVER_VERSION_BUFFER);
			sftp._version = version;
			sftp._extensions = extensions;
			sftp.emit("ready");
		},
		[REQUEST.OPEN]: (sftp, payload) => {
			bufferParser.init(payload, 1);
			const reqID = bufferParser.readUInt32BE();
			const filename = bufferParser.readString(true);
			const pflags = bufferParser.readUInt32BE();
			const attrs = readAttrs(sftp._biOpt);
			bufferParser.clear();
			if (attrs === void 0) return doFatalSFTPError(sftp, "Malformed OPEN packet");
			sftp._debug && sftp._debug(`SFTP: Inbound: Received OPEN (id:${reqID})`);
			if (!sftp.emit("OPEN", reqID, filename, pflags, attrs)) sftp.status(reqID, STATUS_CODE.OP_UNSUPPORTED);
		},
		[REQUEST.CLOSE]: (sftp, payload) => {
			bufferParser.init(payload, 1);
			const reqID = bufferParser.readUInt32BE();
			const handle = bufferParser.readString();
			bufferParser.clear();
			if (handle === void 0 || handle.length > 256) return doFatalSFTPError(sftp, "Malformed CLOSE packet");
			sftp._debug && sftp._debug(`SFTP: Inbound: Received CLOSE (id:${reqID})`);
			if (!sftp.emit("CLOSE", reqID, handle)) sftp.status(reqID, STATUS_CODE.OP_UNSUPPORTED);
		},
		[REQUEST.READ]: (sftp, payload) => {
			bufferParser.init(payload, 1);
			const reqID = bufferParser.readUInt32BE();
			const handle = bufferParser.readString();
			const offset = bufferParser.readUInt64BE(sftp._biOpt);
			const len = bufferParser.readUInt32BE();
			bufferParser.clear();
			if (len === void 0 || handle.length > 256) return doFatalSFTPError(sftp, "Malformed READ packet");
			sftp._debug && sftp._debug(`SFTP: Inbound: Received READ (id:${reqID})`);
			if (!sftp.emit("READ", reqID, handle, offset, len)) sftp.status(reqID, STATUS_CODE.OP_UNSUPPORTED);
		},
		[REQUEST.WRITE]: (sftp, payload) => {
			bufferParser.init(payload, 1);
			const reqID = bufferParser.readUInt32BE();
			const handle = bufferParser.readString();
			const offset = bufferParser.readUInt64BE(sftp._biOpt);
			const data = bufferParser.readString();
			bufferParser.clear();
			if (data === void 0 || handle.length > 256) return doFatalSFTPError(sftp, "Malformed WRITE packet");
			sftp._debug && sftp._debug(`SFTP: Inbound: Received WRITE (id:${reqID})`);
			if (!sftp.emit("WRITE", reqID, handle, offset, data)) sftp.status(reqID, STATUS_CODE.OP_UNSUPPORTED);
		},
		[REQUEST.LSTAT]: (sftp, payload) => {
			bufferParser.init(payload, 1);
			const reqID = bufferParser.readUInt32BE();
			const path = bufferParser.readString(true);
			bufferParser.clear();
			if (path === void 0) return doFatalSFTPError(sftp, "Malformed LSTAT packet");
			sftp._debug && sftp._debug(`SFTP: Inbound: Received LSTAT (id:${reqID})`);
			if (!sftp.emit("LSTAT", reqID, path)) sftp.status(reqID, STATUS_CODE.OP_UNSUPPORTED);
		},
		[REQUEST.FSTAT]: (sftp, payload) => {
			bufferParser.init(payload, 1);
			const reqID = bufferParser.readUInt32BE();
			const handle = bufferParser.readString();
			bufferParser.clear();
			if (handle === void 0 || handle.length > 256) return doFatalSFTPError(sftp, "Malformed FSTAT packet");
			sftp._debug && sftp._debug(`SFTP: Inbound: Received FSTAT (id:${reqID})`);
			if (!sftp.emit("FSTAT", reqID, handle)) sftp.status(reqID, STATUS_CODE.OP_UNSUPPORTED);
		},
		[REQUEST.SETSTAT]: (sftp, payload) => {
			bufferParser.init(payload, 1);
			const reqID = bufferParser.readUInt32BE();
			const path = bufferParser.readString(true);
			const attrs = readAttrs(sftp._biOpt);
			bufferParser.clear();
			if (attrs === void 0) return doFatalSFTPError(sftp, "Malformed SETSTAT packet");
			sftp._debug && sftp._debug(`SFTP: Inbound: Received SETSTAT (id:${reqID})`);
			if (!sftp.emit("SETSTAT", reqID, path, attrs)) sftp.status(reqID, STATUS_CODE.OP_UNSUPPORTED);
		},
		[REQUEST.FSETSTAT]: (sftp, payload) => {
			bufferParser.init(payload, 1);
			const reqID = bufferParser.readUInt32BE();
			const handle = bufferParser.readString();
			const attrs = readAttrs(sftp._biOpt);
			bufferParser.clear();
			if (attrs === void 0 || handle.length > 256) return doFatalSFTPError(sftp, "Malformed FSETSTAT packet");
			sftp._debug && sftp._debug(`SFTP: Inbound: Received FSETSTAT (id:${reqID})`);
			if (!sftp.emit("FSETSTAT", reqID, handle, attrs)) sftp.status(reqID, STATUS_CODE.OP_UNSUPPORTED);
		},
		[REQUEST.OPENDIR]: (sftp, payload) => {
			bufferParser.init(payload, 1);
			const reqID = bufferParser.readUInt32BE();
			const path = bufferParser.readString(true);
			bufferParser.clear();
			if (path === void 0) return doFatalSFTPError(sftp, "Malformed OPENDIR packet");
			sftp._debug && sftp._debug(`SFTP: Inbound: Received OPENDIR (id:${reqID})`);
			if (!sftp.emit("OPENDIR", reqID, path)) sftp.status(reqID, STATUS_CODE.OP_UNSUPPORTED);
		},
		[REQUEST.READDIR]: (sftp, payload) => {
			bufferParser.init(payload, 1);
			const reqID = bufferParser.readUInt32BE();
			const handle = bufferParser.readString();
			bufferParser.clear();
			if (handle === void 0 || handle.length > 256) return doFatalSFTPError(sftp, "Malformed READDIR packet");
			sftp._debug && sftp._debug(`SFTP: Inbound: Received READDIR (id:${reqID})`);
			if (!sftp.emit("READDIR", reqID, handle)) sftp.status(reqID, STATUS_CODE.OP_UNSUPPORTED);
		},
		[REQUEST.REMOVE]: (sftp, payload) => {
			bufferParser.init(payload, 1);
			const reqID = bufferParser.readUInt32BE();
			const path = bufferParser.readString(true);
			bufferParser.clear();
			if (path === void 0) return doFatalSFTPError(sftp, "Malformed REMOVE packet");
			sftp._debug && sftp._debug(`SFTP: Inbound: Received REMOVE (id:${reqID})`);
			if (!sftp.emit("REMOVE", reqID, path)) sftp.status(reqID, STATUS_CODE.OP_UNSUPPORTED);
		},
		[REQUEST.MKDIR]: (sftp, payload) => {
			bufferParser.init(payload, 1);
			const reqID = bufferParser.readUInt32BE();
			const path = bufferParser.readString(true);
			const attrs = readAttrs(sftp._biOpt);
			bufferParser.clear();
			if (attrs === void 0) return doFatalSFTPError(sftp, "Malformed MKDIR packet");
			sftp._debug && sftp._debug(`SFTP: Inbound: Received MKDIR (id:${reqID})`);
			if (!sftp.emit("MKDIR", reqID, path, attrs)) sftp.status(reqID, STATUS_CODE.OP_UNSUPPORTED);
		},
		[REQUEST.RMDIR]: (sftp, payload) => {
			bufferParser.init(payload, 1);
			const reqID = bufferParser.readUInt32BE();
			const path = bufferParser.readString(true);
			bufferParser.clear();
			if (path === void 0) return doFatalSFTPError(sftp, "Malformed RMDIR packet");
			sftp._debug && sftp._debug(`SFTP: Inbound: Received RMDIR (id:${reqID})`);
			if (!sftp.emit("RMDIR", reqID, path)) sftp.status(reqID, STATUS_CODE.OP_UNSUPPORTED);
		},
		[REQUEST.REALPATH]: (sftp, payload) => {
			bufferParser.init(payload, 1);
			const reqID = bufferParser.readUInt32BE();
			const path = bufferParser.readString(true);
			bufferParser.clear();
			if (path === void 0) return doFatalSFTPError(sftp, "Malformed REALPATH packet");
			sftp._debug && sftp._debug(`SFTP: Inbound: Received REALPATH (id:${reqID})`);
			if (!sftp.emit("REALPATH", reqID, path)) sftp.status(reqID, STATUS_CODE.OP_UNSUPPORTED);
		},
		[REQUEST.STAT]: (sftp, payload) => {
			bufferParser.init(payload, 1);
			const reqID = bufferParser.readUInt32BE();
			const path = bufferParser.readString(true);
			bufferParser.clear();
			if (path === void 0) return doFatalSFTPError(sftp, "Malformed STAT packet");
			sftp._debug && sftp._debug(`SFTP: Inbound: Received STAT (id:${reqID})`);
			if (!sftp.emit("STAT", reqID, path)) sftp.status(reqID, STATUS_CODE.OP_UNSUPPORTED);
		},
		[REQUEST.RENAME]: (sftp, payload) => {
			bufferParser.init(payload, 1);
			const reqID = bufferParser.readUInt32BE();
			const oldPath = bufferParser.readString(true);
			const newPath = bufferParser.readString(true);
			bufferParser.clear();
			if (newPath === void 0) return doFatalSFTPError(sftp, "Malformed RENAME packet");
			sftp._debug && sftp._debug(`SFTP: Inbound: Received RENAME (id:${reqID})`);
			if (!sftp.emit("RENAME", reqID, oldPath, newPath)) sftp.status(reqID, STATUS_CODE.OP_UNSUPPORTED);
		},
		[REQUEST.READLINK]: (sftp, payload) => {
			bufferParser.init(payload, 1);
			const reqID = bufferParser.readUInt32BE();
			const path = bufferParser.readString(true);
			bufferParser.clear();
			if (path === void 0) return doFatalSFTPError(sftp, "Malformed READLINK packet");
			sftp._debug && sftp._debug(`SFTP: Inbound: Received READLINK (id:${reqID})`);
			if (!sftp.emit("READLINK", reqID, path)) sftp.status(reqID, STATUS_CODE.OP_UNSUPPORTED);
		},
		[REQUEST.SYMLINK]: (sftp, payload) => {
			bufferParser.init(payload, 1);
			const reqID = bufferParser.readUInt32BE();
			const linkPath = bufferParser.readString(true);
			const targetPath = bufferParser.readString(true);
			bufferParser.clear();
			if (targetPath === void 0) return doFatalSFTPError(sftp, "Malformed SYMLINK packet");
			sftp._debug && sftp._debug(`SFTP: Inbound: Received SYMLINK (id:${reqID})`);
			let handled;
			if (sftp._isOpenSSH) handled = sftp.emit("SYMLINK", reqID, targetPath, linkPath);
			else handled = sftp.emit("SYMLINK", reqID, linkPath, targetPath);
			if (!handled) sftp.status(reqID, STATUS_CODE.OP_UNSUPPORTED);
		},
		[REQUEST.EXTENDED]: (sftp, payload) => {
			bufferParser.init(payload, 1);
			const reqID = bufferParser.readUInt32BE();
			const extName = bufferParser.readString(true);
			if (extName === void 0) {
				bufferParser.clear();
				return doFatalSFTPError(sftp, "Malformed EXTENDED packet");
			}
			let extData;
			if (bufferParser.avail()) extData = bufferParser.readRaw();
			bufferParser.clear();
			sftp._debug && sftp._debug(`SFTP: Inbound: Received EXTENDED (id:${reqID})`);
			if (!sftp.emit("EXTENDED", reqID, extName, extData)) sftp.status(reqID, STATUS_CODE.OP_UNSUPPORTED);
		}
	};
	const { ERR_INVALID_ARG_TYPE, ERR_OUT_OF_RANGE, validateNumber } = require_node_fs_compat();
	const kMinPoolSpace = 128;
	let pool;
	const poolFragments = [];
	function allocNewPool(poolSize) {
		if (poolFragments.length > 0) pool = poolFragments.pop();
		else pool = Buffer.allocUnsafe(poolSize);
		pool.used = 0;
	}
	function checkPosition(pos, name) {
		if (!Number.isSafeInteger(pos)) {
			validateNumber(pos, name);
			if (!Number.isInteger(pos)) throw new ERR_OUT_OF_RANGE(name, "an integer", pos);
			throw new ERR_OUT_OF_RANGE(name, ">= 0 and <= 2 ** 53 - 1", pos);
		}
		if (pos < 0) throw new ERR_OUT_OF_RANGE(name, ">= 0 and <= 2 ** 53 - 1", pos);
	}
	function roundUpToMultipleOf8(n) {
		return n + 7 & -8;
	}
	function ReadStream(sftp, path, options) {
		if (options === void 0) options = {};
		else if (typeof options === "string") options = { encoding: options };
		else if (options === null || typeof options !== "object") throw new TypeError("\"options\" argument must be a string or an object");
		else options = Object.create(options);
		if (options.highWaterMark === void 0) options.highWaterMark = 65536;
		options.emitClose = false;
		options.autoDestroy = false;
		ReadableStream.call(this, options);
		this.path = path;
		this.flags = options.flags === void 0 ? "r" : options.flags;
		this.mode = options.mode === void 0 ? 438 : options.mode;
		this.start = options.start;
		this.end = options.end;
		this.autoClose = options.autoClose === void 0 ? true : options.autoClose;
		this.pos = 0;
		this.bytesRead = 0;
		this.isClosed = false;
		this.handle = options.handle === void 0 ? null : options.handle;
		this.sftp = sftp;
		this._opening = false;
		if (this.start !== void 0) {
			checkPosition(this.start, "start");
			this.pos = this.start;
		}
		if (this.end === void 0) this.end = 1e400;
		else if (this.end !== 1e400) {
			checkPosition(this.end, "end");
			if (this.start !== void 0 && this.start > this.end) throw new ERR_OUT_OF_RANGE("start", `<= "end" (here: ${this.end})`, this.start);
		}
		this.on("end", function() {
			if (this.autoClose) this.destroy();
		});
		if (!Buffer.isBuffer(this.handle)) this.open();
	}
	inherits(ReadStream, ReadableStream);
	ReadStream.prototype.open = function() {
		if (this._opening) return;
		this._opening = true;
		this.sftp.open(this.path, this.flags, this.mode, (er, handle) => {
			this._opening = false;
			if (er) {
				this.emit("error", er);
				if (this.autoClose) this.destroy();
				return;
			}
			this.handle = handle;
			this.emit("open", handle);
			this.emit("ready");
			this.read();
		});
	};
	ReadStream.prototype._read = function(n) {
		if (!Buffer.isBuffer(this.handle)) return this.once("open", () => this._read(n));
		if (this.destroyed) return;
		if (!pool || pool.length - pool.used < kMinPoolSpace) allocNewPool(this.readableHighWaterMark || this._readableState.highWaterMark);
		const thisPool = pool;
		let toRead = Math.min(pool.length - pool.used, n);
		const start = pool.used;
		if (this.end !== void 0) toRead = Math.min(this.end - this.pos + 1, toRead);
		if (toRead <= 0) return this.push(null);
		this.sftp.read(this.handle, pool, pool.used, toRead, this.pos, (er, bytesRead) => {
			if (er) {
				this.emit("error", er);
				if (this.autoClose) this.destroy();
				return;
			}
			let b = null;
			if (start + toRead === thisPool.used && thisPool === pool) thisPool.used = roundUpToMultipleOf8(thisPool.used + bytesRead - toRead);
			else {
				const alignedEnd = start + toRead & -8;
				const alignedStart = roundUpToMultipleOf8(start + bytesRead);
				if (alignedEnd - alignedStart >= kMinPoolSpace) poolFragments.push(thisPool.slice(alignedStart, alignedEnd));
			}
			if (bytesRead > 0) {
				this.bytesRead += bytesRead;
				b = thisPool.slice(start, start + bytesRead);
			}
			this.pos += bytesRead;
			this.push(b);
		});
		pool.used = roundUpToMultipleOf8(pool.used + toRead);
	};
	ReadStream.prototype._destroy = function(err, cb) {
		if (this._opening && !Buffer.isBuffer(this.handle)) {
			this.once("open", closeStream.bind(null, this, cb, err));
			return;
		}
		closeStream(this, cb, err);
		this.handle = null;
		this._opening = false;
	};
	function closeStream(stream, cb, err) {
		if (!stream.handle) return onclose();
		stream.sftp.close(stream.handle, onclose);
		function onclose(er) {
			er = er || err;
			cb(er);
			stream.isClosed = true;
			if (!er) stream.emit("close");
		}
	}
	ReadStream.prototype.close = function(cb) {
		this.destroy(null, cb);
	};
	Object.defineProperty(ReadStream.prototype, "pending", {
		get() {
			return this.handle === null;
		},
		configurable: true
	});
	function WriteStream(sftp, path, options) {
		if (options === void 0) options = {};
		else if (typeof options === "string") options = { encoding: options };
		else if (options === null || typeof options !== "object") throw new TypeError("\"options\" argument must be a string or an object");
		else options = Object.create(options);
		options.emitClose = false;
		options.autoDestroy = false;
		WritableStream.call(this, options);
		this.path = path;
		this.flags = options.flags === void 0 ? "w" : options.flags;
		this.mode = options.mode === void 0 ? 438 : options.mode;
		this.start = options.start;
		this.autoClose = options.autoClose === void 0 ? true : options.autoClose;
		this.pos = 0;
		this.bytesWritten = 0;
		this.isClosed = false;
		this.handle = options.handle === void 0 ? null : options.handle;
		this.sftp = sftp;
		this._opening = false;
		if (this.start !== void 0) {
			checkPosition(this.start, "start");
			this.pos = this.start;
		}
		if (options.encoding) this.setDefaultEncoding(options.encoding);
		this.on("finish", function() {
			if (this._writableState.finalCalled) return;
			if (this.autoClose) this.destroy();
		});
		if (!Buffer.isBuffer(this.handle)) this.open();
	}
	inherits(WriteStream, WritableStream);
	WriteStream.prototype._final = function(cb) {
		if (this.autoClose) this.destroy();
		cb();
	};
	WriteStream.prototype.open = function() {
		if (this._opening) return;
		this._opening = true;
		this.sftp.open(this.path, this.flags, this.mode, (er, handle) => {
			this._opening = false;
			if (er) {
				this.emit("error", er);
				if (this.autoClose) this.destroy();
				return;
			}
			this.handle = handle;
			const tryAgain = (err) => {
				if (err) {
					this.sftp.chmod(this.path, this.mode, (err_) => tryAgain());
					return;
				}
				if (this.flags[0] === "a") {
					const tryStat = (err, st) => {
						if (err) {
							this.sftp.stat(this.path, (err_, st_) => {
								if (err_) {
									this.destroy();
									this.emit("error", err);
									return;
								}
								tryStat(null, st_);
							});
							return;
						}
						this.pos = st.size;
						this.emit("open", handle);
						this.emit("ready");
					};
					this.sftp.fstat(handle, tryStat);
					return;
				}
				this.emit("open", handle);
				this.emit("ready");
			};
			this.sftp.fchmod(handle, this.mode, tryAgain);
		});
	};
	WriteStream.prototype._write = function(data, encoding, cb) {
		if (!Buffer.isBuffer(data)) {
			const err = new ERR_INVALID_ARG_TYPE("data", "Buffer", data);
			return this.emit("error", err);
		}
		if (!Buffer.isBuffer(this.handle)) return this.once("open", function() {
			this._write(data, encoding, cb);
		});
		this.sftp.write(this.handle, data, 0, data.length, this.pos, (er, bytes) => {
			if (er) {
				if (this.autoClose) this.destroy();
				return cb(er);
			}
			this.bytesWritten += bytes;
			cb();
		});
		this.pos += data.length;
	};
	WriteStream.prototype._writev = function(data, cb) {
		if (!Buffer.isBuffer(this.handle)) return this.once("open", function() {
			this._writev(data, cb);
		});
		const sftp = this.sftp;
		const handle = this.handle;
		let writesLeft = data.length;
		const onwrite = (er, bytes) => {
			if (er) {
				this.destroy();
				return cb(er);
			}
			this.bytesWritten += bytes;
			if (--writesLeft === 0) cb();
		};
		for (let i = 0; i < data.length; ++i) {
			const chunk = data[i].chunk;
			sftp.write(handle, chunk, 0, chunk.length, this.pos, onwrite);
			this.pos += chunk.length;
		}
	};
	if (typeof WritableStream.prototype.destroy !== "function") WriteStream.prototype.destroy = ReadStream.prototype.destroy;
	WriteStream.prototype._destroy = ReadStream.prototype._destroy;
	WriteStream.prototype.close = function(cb) {
		if (cb) {
			if (this.isClosed) {
				process.nextTick(cb);
				return;
			}
			this.on("close", cb);
		}
		if (!this.autoClose) this.on("finish", this.destroy.bind(this));
		this.end();
	};
	WriteStream.prototype.destroySoon = WriteStream.prototype.end;
	Object.defineProperty(WriteStream.prototype, "pending", {
		get() {
			return this.handle === null;
		},
		configurable: true
	});
	module.exports = {
		flagsToString,
		OPEN_MODE,
		SFTP,
		Stats,
		STATUS_CODE,
		stringToFlags
	};
}));
// node_modules/ssh2/lib/Channel.js
var require_Channel = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const { Duplex: DuplexStream, Readable: ReadableStream, Writable: WritableStream } = __require("stream");
	const { CHANNEL_EXTENDED_DATATYPE: { STDERR } } = require_constants();
	const { bufferSlice } = require_utils$1();
	const PACKET_SIZE = 32768;
	const MAX_WINDOW = 2097152;
	const WINDOW_THRESHOLD = MAX_WINDOW / 2;
	var ClientStderr = class extends ReadableStream {
		constructor(channel, streamOpts) {
			super(streamOpts);
			this._channel = channel;
		}
		_read(n) {
			if (this._channel._waitChanDrain) {
				this._channel._waitChanDrain = false;
				if (this._channel.incoming.window <= WINDOW_THRESHOLD) windowAdjust(this._channel);
			}
		}
	};
	var ServerStderr = class extends WritableStream {
		constructor(channel) {
			super({ highWaterMark: MAX_WINDOW });
			this._channel = channel;
		}
		_write(data, encoding, cb) {
			const channel = this._channel;
			const protocol = channel._client._protocol;
			const outgoing = channel.outgoing;
			const packetSize = outgoing.packetSize;
			const id = outgoing.id;
			let window = outgoing.window;
			const len = data.length;
			let p = 0;
			if (outgoing.state !== "open") return;
			while (len - p > 0 && window > 0) {
				let sliceLen = len - p;
				if (sliceLen > window) sliceLen = window;
				if (sliceLen > packetSize) sliceLen = packetSize;
				if (p === 0 && sliceLen === len) protocol.channelExtData(id, data, STDERR);
				else protocol.channelExtData(id, bufferSlice(data, p, p + sliceLen), STDERR);
				p += sliceLen;
				window -= sliceLen;
			}
			outgoing.window = window;
			if (len - p > 0) {
				if (window === 0) channel._waitWindow = true;
				if (p > 0) channel._chunkErr = bufferSlice(data, p, len);
				else channel._chunkErr = data;
				channel._chunkcbErr = cb;
				return;
			}
			cb();
		}
	};
	var Channel = class extends DuplexStream {
		constructor(client, info, opts) {
			const streamOpts = {
				highWaterMark: MAX_WINDOW,
				allowHalfOpen: !opts || opts && opts.allowHalfOpen !== false,
				emitClose: false
			};
			super(streamOpts);
			this.allowHalfOpen = streamOpts.allowHalfOpen;
			const server = !!(opts && opts.server);
			this.server = server;
			this.type = info.type;
			this.subtype = void 0;
			this.incoming = info.incoming;
			this.outgoing = info.outgoing;
			this._callbacks = [];
			this._client = client;
			this._hasX11 = false;
			this._exit = {
				code: void 0,
				signal: void 0,
				dump: void 0,
				desc: void 0
			};
			this.stdin = this.stdout = this;
			if (server) this.stderr = new ServerStderr(this);
			else this.stderr = new ClientStderr(this, streamOpts);
			this._waitWindow = false;
			this._waitChanDrain = false;
			this._chunk = void 0;
			this._chunkcb = void 0;
			this._chunkErr = void 0;
			this._chunkcbErr = void 0;
			this.on("finish", onFinish).on("prefinish", onFinish);
			this.on("end", onEnd).on("close", onEnd);
		}
		_read(n) {
			if (this._waitChanDrain) {
				this._waitChanDrain = false;
				if (this.incoming.window <= WINDOW_THRESHOLD) windowAdjust(this);
			}
		}
		_write(data, encoding, cb) {
			const protocol = this._client._protocol;
			const outgoing = this.outgoing;
			const packetSize = outgoing.packetSize;
			const id = outgoing.id;
			let window = outgoing.window;
			const len = data.length;
			let p = 0;
			if (outgoing.state !== "open") return;
			while (len - p > 0 && window > 0) {
				let sliceLen = len - p;
				if (sliceLen > window) sliceLen = window;
				if (sliceLen > packetSize) sliceLen = packetSize;
				if (p === 0 && sliceLen === len) protocol.channelData(id, data);
				else protocol.channelData(id, bufferSlice(data, p, p + sliceLen));
				p += sliceLen;
				window -= sliceLen;
			}
			outgoing.window = window;
			if (len - p > 0) {
				if (window === 0) this._waitWindow = true;
				if (p > 0) this._chunk = bufferSlice(data, p, len);
				else this._chunk = data;
				this._chunkcb = cb;
				return;
			}
			cb();
		}
		eof() {
			if (this.outgoing.state === "open") {
				this.outgoing.state = "eof";
				this._client._protocol.channelEOF(this.outgoing.id);
			}
		}
		close() {
			if (this.outgoing.state === "open" || this.outgoing.state === "eof") {
				this.outgoing.state = "closing";
				this._client._protocol.channelClose(this.outgoing.id);
			}
		}
		destroy() {
			this.end();
			this.close();
			return this;
		}
		setWindow(rows, cols, height, width) {
			if (this.server) throw new Error("Client-only method called in server mode");
			if (this.type === "session" && (this.subtype === "shell" || this.subtype === "exec") && this.writable && this.outgoing.state === "open") this._client._protocol.windowChange(this.outgoing.id, rows, cols, height, width);
		}
		signal(signalName) {
			if (this.server) throw new Error("Client-only method called in server mode");
			if (this.type === "session" && this.writable && this.outgoing.state === "open") this._client._protocol.signal(this.outgoing.id, signalName);
		}
		exit(statusOrSignal, coreDumped, msg) {
			if (!this.server) throw new Error("Server-only method called in client mode");
			if (this.type === "session" && this.writable && this.outgoing.state === "open") {
				if (typeof statusOrSignal === "number") this._client._protocol.exitStatus(this.outgoing.id, statusOrSignal);
				else this._client._protocol.exitSignal(this.outgoing.id, statusOrSignal, coreDumped, msg);
			}
		}
	};
	function onFinish() {
		this.eof();
		if (this.server || !this.allowHalfOpen) this.close();
		this.writable = false;
	}
	function onEnd() {
		this.readable = false;
	}
	function windowAdjust(self) {
		if (self.outgoing.state === "closed") return;
		const amt = MAX_WINDOW - self.incoming.window;
		if (amt <= 0) return;
		self.incoming.window += amt;
		self._client._protocol.channelWindowAdjust(self.outgoing.id, amt);
	}
	module.exports = {
		Channel,
		MAX_WINDOW,
		PACKET_SIZE,
		windowAdjust,
		WINDOW_THRESHOLD
	};
}));
// node_modules/ssh2/lib/utils.js
var require_utils = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const { SFTP } = require_SFTP();
	const MAX_CHANNEL = 2 ** 32 - 1;
	function onChannelOpenFailure(self, recipient, info, cb) {
		self._chanMgr.remove(recipient);
		if (typeof cb !== "function") return;
		let err;
		if (info instanceof Error) err = info;
		else if (typeof info === "object" && info !== null) {
			err = /* @__PURE__ */ new Error(`(SSH) Channel open failure: ${info.description}`);
			err.reason = info.reason;
		} else {
			err = /* @__PURE__ */ new Error("(SSH) Channel open failure: server closed channel unexpectedly");
			err.reason = "";
		}
		cb(err);
	}
	function onCHANNEL_CLOSE(self, recipient, channel, err, dead) {
		if (typeof channel === "function") {
			onChannelOpenFailure(self, recipient, err, channel);
			return;
		}
		if (typeof channel !== "object" || channel === null) return;
		if (channel.incoming && channel.incoming.state === "closed") return;
		self._chanMgr.remove(recipient);
		if (channel.server && channel.constructor.name === "Session") return;
		channel.incoming.state = "closed";
		if (channel.readable) channel.push(null);
		if (channel.server) {
			if (channel.stderr.writable) channel.stderr.end();
		} else if (channel.stderr.readable) channel.stderr.push(null);
		if (channel.constructor !== SFTP && (channel.outgoing.state === "open" || channel.outgoing.state === "eof") && !dead) channel.close();
		if (channel.outgoing.state === "closing") channel.outgoing.state = "closed";
		const readState = channel._readableState;
		const writeState = channel._writableState;
		if (writeState && !writeState.ending && !writeState.finished && !dead) channel.end();
		const chanCallbacks = channel._callbacks;
		channel._callbacks = [];
		for (let i = 0; i < chanCallbacks.length; ++i) chanCallbacks[i](true);
		if (channel.server) {
			if (!channel.readable || channel.destroyed || readState && readState.endEmitted) channel.emit("close");
			else channel.once("end", () => channel.emit("close"));
		} else {
			let doClose;
			switch (channel.type) {
				case "direct-streamlocal@openssh.com":
				case "direct-tcpip":
					doClose = () => channel.emit("close");
					break;
				default: {
					const exit = channel._exit;
					doClose = () => {
						if (exit.code === null) channel.emit("close", exit.code, exit.signal, exit.dump, exit.desc);
						else channel.emit("close", exit.code);
					};
				}
			}
			if (!channel.readable || channel.destroyed || readState && readState.endEmitted) doClose();
			else channel.once("end", doClose);
			const errReadState = channel.stderr._readableState;
			if (!channel.stderr.readable || channel.stderr.destroyed || errReadState && errReadState.endEmitted) channel.stderr.emit("close");
			else channel.stderr.once("end", () => channel.stderr.emit("close"));
		}
	}
	var ChannelManager = class {
		constructor(client) {
			this._client = client;
			this._channels = {};
			this._cur = -1;
			this._count = 0;
		}
		add(val) {
			let id;
			if (this._cur < MAX_CHANNEL) id = ++this._cur;
			else if (this._count === 0) {
				this._cur = 0;
				id = 0;
			} else {
				const channels = this._channels;
				for (let i = 0; i < MAX_CHANNEL; ++i) if (channels[i] === void 0) {
					id = i;
					break;
				}
			}
			if (id === void 0) return -1;
			this._channels[id] = val || true;
			++this._count;
			return id;
		}
		update(id, val) {
			if (typeof id !== "number" || id < 0 || id >= MAX_CHANNEL || !isFinite(id)) throw new Error(`Invalid channel id: ${id}`);
			if (val && this._channels[id]) this._channels[id] = val;
		}
		get(id) {
			if (typeof id !== "number" || id < 0 || id >= MAX_CHANNEL || !isFinite(id)) throw new Error(`Invalid channel id: ${id}`);
			return this._channels[id];
		}
		remove(id) {
			if (typeof id !== "number" || id < 0 || id >= MAX_CHANNEL || !isFinite(id)) throw new Error(`Invalid channel id: ${id}`);
			if (this._channels[id]) {
				delete this._channels[id];
				if (this._count) --this._count;
			}
		}
		cleanup(err) {
			const channels = this._channels;
			this._channels = {};
			this._cur = -1;
			this._count = 0;
			const chanIDs = Object.keys(channels);
			const client = this._client;
			for (let i = 0; i < chanIDs.length; ++i) {
				const id = +chanIDs[i];
				const channel = channels[id];
				onCHANNEL_CLOSE(client, id, channel._channel || channel, err, true);
			}
		}
	};
	const isRegExp = (() => {
		const toString = Object.prototype.toString;
		return (val) => toString.call(val) === "[object RegExp]";
	})();
	function generateAlgorithmList(algoList, defaultList, supportedList) {
		if (Array.isArray(algoList) && algoList.length > 0) {
			for (let i = 0; i < algoList.length; ++i) if (supportedList.indexOf(algoList[i]) === -1) throw new Error(`Unsupported algorithm: ${algoList[i]}`);
			return algoList;
		}
		if (typeof algoList === "object" && algoList !== null) {
			const keys = Object.keys(algoList);
			let list = defaultList;
			for (let i = 0; i < keys.length; ++i) {
				const key = keys[i];
				let val = algoList[key];
				switch (key) {
					case "append":
						if (!Array.isArray(val)) val = [val];
						if (Array.isArray(val)) for (let j = 0; j < val.length; ++j) {
							const append = val[j];
							if (typeof append === "string") {
								if (!append || list.indexOf(append) !== -1) continue;
								if (supportedList.indexOf(append) === -1) throw new Error(`Unsupported algorithm: ${append}`);
								if (list === defaultList) list = list.slice();
								list.push(append);
							} else if (isRegExp(append)) for (let k = 0; k < supportedList.length; ++k) {
								const algo = supportedList[k];
								if (append.test(algo)) {
									if (list.indexOf(algo) !== -1) continue;
									if (list === defaultList) list = list.slice();
									list.push(algo);
								}
							}
						}
						break;
					case "prepend":
						if (!Array.isArray(val)) val = [val];
						if (Array.isArray(val)) for (let j = val.length; j >= 0; --j) {
							const prepend = val[j];
							if (typeof prepend === "string") {
								if (!prepend || list.indexOf(prepend) !== -1) continue;
								if (supportedList.indexOf(prepend) === -1) throw new Error(`Unsupported algorithm: ${prepend}`);
								if (list === defaultList) list = list.slice();
								list.unshift(prepend);
							} else if (isRegExp(prepend)) for (let k = supportedList.length; k >= 0; --k) {
								const algo = supportedList[k];
								if (prepend.test(algo)) {
									if (list.indexOf(algo) !== -1) continue;
									if (list === defaultList) list = list.slice();
									list.unshift(algo);
								}
							}
						}
						break;
					case "remove":
						if (!Array.isArray(val)) val = [val];
						if (Array.isArray(val)) for (let j = 0; j < val.length; ++j) {
							const search = val[j];
							if (typeof search === "string") {
								if (!search) continue;
								const idx = list.indexOf(search);
								if (idx === -1) continue;
								if (list === defaultList) list = list.slice();
								list.splice(idx, 1);
							} else if (isRegExp(search)) {
								for (let k = 0; k < list.length; ++k) if (search.test(list[k])) {
									if (list === defaultList) list = list.slice();
									list.splice(k, 1);
									--k;
								}
							}
						}
				}
			}
			return list;
		}
		return defaultList;
	}
	module.exports = {
		ChannelManager,
		generateAlgorithmList,
		onChannelOpenFailure,
		onCHANNEL_CLOSE,
		isWritable: (stream) => {
			return stream && stream.writable && stream._readableState && stream._readableState.ended === false;
		}
	};
}));
// node_modules/ssh2/lib/client.js
var require_client = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const { createHash, getHashes, randomFillSync } = __require("crypto");
	const { Socket } = __require("net");
	const { lookup: dnsLookup } = __require("dns");
	const EventEmitter = __require("events");
	const HASHES = getHashes();
	const { COMPAT, CHANNEL_EXTENDED_DATATYPE: { STDERR }, CHANNEL_OPEN_FAILURE, DEFAULT_CIPHER, DEFAULT_COMPRESSION, DEFAULT_KEX, DEFAULT_MAC, DEFAULT_SERVER_HOST_KEY, DISCONNECT_REASON, DISCONNECT_REASON_BY_VALUE, SUPPORTED_CIPHER, SUPPORTED_COMPRESSION, SUPPORTED_KEX, SUPPORTED_MAC, SUPPORTED_SERVER_HOST_KEY } = require_constants();
	const { init: cryptoInit } = require_crypto();
	const Protocol = require_Protocol();
	const { parseKey } = require_keyParser();
	const { SFTP } = require_SFTP();
	const { bufferCopy, makeBufferParser, makeError, readUInt32BE, sigSSHToASN1, writeUInt32BE } = require_utils$1();
	const { AgentContext, createAgent, isAgent } = require_agent();
	const { Channel, MAX_WINDOW, PACKET_SIZE, windowAdjust, WINDOW_THRESHOLD } = require_Channel();
	const { ChannelManager, generateAlgorithmList, isWritable, onChannelOpenFailure, onCHANNEL_CLOSE } = require_utils();
	const bufferParser = makeBufferParser();
	const sigParser = makeBufferParser();
	const RE_OPENSSH = /^OpenSSH_(?:(?![0-4])\d)|(?:\d{2,})/;
	const noop = (err) => {};
	var Client = class extends EventEmitter {
		constructor() {
			super();
			this.config = {
				host: void 0,
				port: void 0,
				localAddress: void 0,
				localPort: void 0,
				forceIPv4: void 0,
				forceIPv6: void 0,
				keepaliveCountMax: void 0,
				keepaliveInterval: void 0,
				readyTimeout: void 0,
				ident: void 0,
				username: void 0,
				password: void 0,
				privateKey: void 0,
				tryKeyboard: void 0,
				agent: void 0,
				allowAgentFwd: void 0,
				authHandler: void 0,
				hostHashAlgo: void 0,
				hostHashCb: void 0,
				strictVendor: void 0,
				debug: void 0
			};
			this._agent = void 0;
			this._readyTimeout = void 0;
			this._chanMgr = void 0;
			this._callbacks = void 0;
			this._forwarding = void 0;
			this._forwardingUnix = void 0;
			this._acceptX11 = void 0;
			this._agentFwdEnabled = void 0;
			this._remoteVer = void 0;
			this._protocol = void 0;
			this._sock = void 0;
			this._resetKA = void 0;
		}
		connect(cfg) {
			if (this._sock && isWritable(this._sock)) {
				this.once("close", () => {
					this.connect(cfg);
				});
				this.end();
				return this;
			}
			this.config.host = cfg.hostname || cfg.host || "localhost";
			this.config.port = cfg.port || 22;
			this.config.localAddress = typeof cfg.localAddress === "string" ? cfg.localAddress : void 0;
			this.config.localPort = typeof cfg.localPort === "string" || typeof cfg.localPort === "number" ? cfg.localPort : void 0;
			this.config.forceIPv4 = cfg.forceIPv4 || false;
			this.config.forceIPv6 = cfg.forceIPv6 || false;
			this.config.keepaliveCountMax = typeof cfg.keepaliveCountMax === "number" && cfg.keepaliveCountMax >= 0 ? cfg.keepaliveCountMax : 3;
			this.config.keepaliveInterval = typeof cfg.keepaliveInterval === "number" && cfg.keepaliveInterval > 0 ? cfg.keepaliveInterval : 0;
			this.config.readyTimeout = typeof cfg.readyTimeout === "number" && cfg.readyTimeout >= 0 ? cfg.readyTimeout : 2e4;
			this.config.ident = typeof cfg.ident === "string" || Buffer.isBuffer(cfg.ident) ? cfg.ident : void 0;
			const algorithms = {
				kex: void 0,
				serverHostKey: void 0,
				cs: {
					cipher: void 0,
					mac: void 0,
					compress: void 0,
					lang: []
				},
				sc: void 0
			};
			let allOfferDefaults = true;
			if (typeof cfg.algorithms === "object" && cfg.algorithms !== null) {
				algorithms.kex = generateAlgorithmList(cfg.algorithms.kex, DEFAULT_KEX, SUPPORTED_KEX);
				if (algorithms.kex !== DEFAULT_KEX) allOfferDefaults = false;
				algorithms.serverHostKey = generateAlgorithmList(cfg.algorithms.serverHostKey, DEFAULT_SERVER_HOST_KEY, SUPPORTED_SERVER_HOST_KEY);
				if (algorithms.serverHostKey !== DEFAULT_SERVER_HOST_KEY) allOfferDefaults = false;
				algorithms.cs.cipher = generateAlgorithmList(cfg.algorithms.cipher, DEFAULT_CIPHER, SUPPORTED_CIPHER);
				if (algorithms.cs.cipher !== DEFAULT_CIPHER) allOfferDefaults = false;
				algorithms.cs.mac = generateAlgorithmList(cfg.algorithms.hmac, DEFAULT_MAC, SUPPORTED_MAC);
				if (algorithms.cs.mac !== DEFAULT_MAC) allOfferDefaults = false;
				algorithms.cs.compress = generateAlgorithmList(cfg.algorithms.compress, DEFAULT_COMPRESSION, SUPPORTED_COMPRESSION);
				if (algorithms.cs.compress !== DEFAULT_COMPRESSION) allOfferDefaults = false;
				if (!allOfferDefaults) algorithms.sc = algorithms.cs;
			}
			if (typeof cfg.username === "string") this.config.username = cfg.username;
			else if (typeof cfg.user === "string") this.config.username = cfg.user;
			else throw new Error("Invalid username");
			this.config.password = typeof cfg.password === "string" ? cfg.password : void 0;
			this.config.privateKey = typeof cfg.privateKey === "string" || Buffer.isBuffer(cfg.privateKey) ? cfg.privateKey : void 0;
			this.config.localHostname = typeof cfg.localHostname === "string" ? cfg.localHostname : void 0;
			this.config.localUsername = typeof cfg.localUsername === "string" ? cfg.localUsername : void 0;
			this.config.tryKeyboard = cfg.tryKeyboard === true;
			if (typeof cfg.agent === "string" && cfg.agent.length) this.config.agent = createAgent(cfg.agent);
			else if (isAgent(cfg.agent)) this.config.agent = cfg.agent;
			else this.config.agent = void 0;
			this.config.allowAgentFwd = cfg.agentForward === true && this.config.agent !== void 0;
			let authHandler = this.config.authHandler = typeof cfg.authHandler === "function" || Array.isArray(cfg.authHandler) ? cfg.authHandler : void 0;
			this.config.strictVendor = typeof cfg.strictVendor === "boolean" ? cfg.strictVendor : true;
			const debug = this.config.debug = typeof cfg.debug === "function" ? cfg.debug : void 0;
			if (cfg.agentForward === true && !this.config.allowAgentFwd) throw new Error("You must set a valid agent path to allow agent forwarding");
			let callbacks = this._callbacks = [];
			this._chanMgr = new ChannelManager(this);
			this._forwarding = {};
			this._forwardingUnix = {};
			this._acceptX11 = 0;
			this._agentFwdEnabled = false;
			this._agent = this.config.agent ? this.config.agent : void 0;
			this._remoteVer = void 0;
			let privateKey;
			if (this.config.privateKey) {
				privateKey = parseKey(this.config.privateKey, cfg.passphrase);
				if (privateKey instanceof Error) throw new Error(`Cannot parse privateKey: ${privateKey.message}`);
				if (Array.isArray(privateKey)) privateKey = privateKey[0];
				if (privateKey.getPrivatePEM() === null) throw new Error("privateKey value does not contain a (valid) private key");
			}
			let hostVerifier;
			if (typeof cfg.hostVerifier === "function") {
				const hashCb = cfg.hostVerifier;
				let hashAlgo;
				if (HASHES.indexOf(cfg.hostHash) !== -1) hashAlgo = cfg.hostHash;
				hostVerifier = (key, verify) => {
					if (hashAlgo) key = createHash(hashAlgo).update(key).digest("hex");
					const ret = hashCb(key, verify);
					if (ret !== void 0) verify(ret);
				};
			}
			const sock = this._sock = cfg.sock || new Socket();
			let ready = false;
			let sawHeader = false;
			if (this._protocol) this._protocol.cleanup();
			const DEBUG_HANDLER = !debug ? void 0 : (p, display, msg) => {
				debug(`Debug output from server: ${JSON.stringify(msg)}`);
			};
			let serverSigAlgs;
			const proto = this._protocol = new Protocol({
				ident: this.config.ident,
				offer: allOfferDefaults ? void 0 : algorithms,
				onWrite: (data) => {
					if (isWritable(sock)) sock.write(data);
				},
				onError: (err) => {
					if (err.level === "handshake") clearTimeout(this._readyTimeout);
					if (!proto._destruct) sock.removeAllListeners("data");
					this.emit("error", err);
					try {
						sock.end();
					} catch {}
				},
				onHeader: (header) => {
					sawHeader = true;
					this._remoteVer = header.versions.software;
					if (header.greeting) this.emit("greeting", header.greeting);
				},
				onHandshakeComplete: (negotiated) => {
					this.emit("handshake", negotiated);
					if (!ready) {
						ready = true;
						proto.service("ssh-userauth");
					}
				},
				debug,
				hostVerifier,
				messageHandlers: {
					DEBUG: DEBUG_HANDLER,
					DISCONNECT: (p, reason, desc) => {
						if (reason !== DISCONNECT_REASON.BY_APPLICATION) {
							if (!desc) {
								desc = DISCONNECT_REASON_BY_VALUE[reason];
								if (desc === void 0) desc = `Unexpected disconnection reason: ${reason}`;
							}
							const err = new Error(desc);
							err.code = reason;
							this.emit("error", err);
						}
						sock.end();
					},
					SERVICE_ACCEPT: (p, name) => {
						if (name === "ssh-userauth") tryNextAuth();
					},
					EXT_INFO: (p, exts) => {
						if (serverSigAlgs === void 0) {
							for (const ext of exts) if (ext.name === "server-sig-algs") {
								serverSigAlgs = ext.algs;
								return;
							}
							serverSigAlgs = null;
						}
					},
					USERAUTH_BANNER: (p, msg) => {
						this.emit("banner", msg);
					},
					USERAUTH_SUCCESS: (p) => {
						resetKA();
						clearTimeout(this._readyTimeout);
						this.emit("ready");
					},
					USERAUTH_FAILURE: (p, authMethods, partialSuccess) => {
						if (curAuth.keyAlgos) {
							const oldKeyAlgo = curAuth.keyAlgos[0][0];
							if (debug) debug(`Client: ${curAuth.type} (${oldKeyAlgo}) auth failed`);
							curAuth.keyAlgos.shift();
							if (curAuth.keyAlgos.length) {
								const [keyAlgo, hashAlgo] = curAuth.keyAlgos[0];
								switch (curAuth.type) {
									case "agent":
										proto.authPK(curAuth.username, curAuth.agentCtx.currentKey(), keyAlgo);
										return;
									case "publickey":
										proto.authPK(curAuth.username, curAuth.key, keyAlgo);
										return;
									case "hostbased":
										proto.authHostbased(curAuth.username, curAuth.key, curAuth.localHostname, curAuth.localUsername, keyAlgo, (buf, cb) => {
											const signature = curAuth.key.sign(buf, hashAlgo);
											if (signature instanceof Error) {
												signature.message = `Error while signing with key: ${signature.message}`;
												signature.level = "client-authentication";
												this.emit("error", signature);
												return tryNextAuth();
											}
											cb(signature);
										});
										return;
								}
							} else curAuth.keyAlgos = void 0;
						}
						if (curAuth.type === "agent") {
							const pos = curAuth.agentCtx.pos();
							debug && debug(`Client: Agent key #${pos + 1} failed`);
							return tryNextAgentKey();
						}
						debug && debug(`Client: ${curAuth.type} auth failed`);
						curPartial = partialSuccess;
						curAuthsLeft = authMethods;
						tryNextAuth();
					},
					USERAUTH_PASSWD_CHANGEREQ: (p, prompt) => {
						if (curAuth.type === "password") this.emit("change password", prompt, (newPassword) => {
							proto.authPassword(this.config.username, this.config.password, newPassword);
						});
					},
					USERAUTH_PK_OK: (p) => {
						let keyAlgo;
						let hashAlgo;
						if (curAuth.keyAlgos) [keyAlgo, hashAlgo] = curAuth.keyAlgos[0];
						if (curAuth.type === "agent") {
							const key = curAuth.agentCtx.currentKey();
							proto.authPK(curAuth.username, key, keyAlgo, (buf, cb) => {
								const opts = { hash: hashAlgo };
								curAuth.agentCtx.sign(key, buf, opts, (err, signed) => {
									if (err) {
										err.level = "agent";
										this.emit("error", err);
									} else return cb(signed);
									tryNextAgentKey();
								});
							});
						} else if (curAuth.type === "publickey") proto.authPK(curAuth.username, curAuth.key, keyAlgo, (buf, cb) => {
							const signature = curAuth.key.sign(buf, hashAlgo);
							if (signature instanceof Error) {
								signature.message = `Error signing data with key: ${signature.message}`;
								signature.level = "client-authentication";
								this.emit("error", signature);
								return tryNextAuth();
							}
							cb(signature);
						});
					},
					USERAUTH_INFO_REQUEST: (p, name, instructions, prompts) => {
						if (curAuth.type === "keyboard-interactive") {
							if ((Array.isArray(prompts) ? prompts.length : 0) === 0) {
								debug && debug("Client: Sending automatic USERAUTH_INFO_RESPONSE");
								proto.authInfoRes();
								return;
							}
							curAuth.prompt(name, instructions, "", prompts, (answers) => {
								proto.authInfoRes(answers);
							});
						}
					},
					REQUEST_SUCCESS: (p, data) => {
						if (callbacks.length) callbacks.shift()(false, data);
					},
					REQUEST_FAILURE: (p) => {
						if (callbacks.length) callbacks.shift()(true);
					},
					GLOBAL_REQUEST: (p, name, wantReply, data) => {
						switch (name) {
							case "hostkeys-00@openssh.com":
								hostKeysProve(this, data, (err, keys) => {
									if (err) return;
									this.emit("hostkeys", keys);
								});
								if (wantReply) proto.requestSuccess();
								break;
							default: if (wantReply) proto.requestFailure();
						}
					},
					CHANNEL_OPEN: (p, info) => {
						onCHANNEL_OPEN(this, info);
					},
					CHANNEL_OPEN_CONFIRMATION: (p, info) => {
						const channel = this._chanMgr.get(info.recipient);
						if (typeof channel !== "function") return;
						const isSFTP = channel.type === "sftp";
						const chanInfo = {
							type: isSFTP ? "session" : channel.type,
							incoming: {
								id: info.recipient,
								window: MAX_WINDOW,
								packetSize: PACKET_SIZE,
								state: "open"
							},
							outgoing: {
								id: info.sender,
								window: info.window,
								packetSize: info.packetSize,
								state: "open"
							}
						};
						const instance = isSFTP ? new SFTP(this, chanInfo, { debug }) : new Channel(this, chanInfo);
						this._chanMgr.update(info.recipient, instance);
						channel(void 0, instance);
					},
					CHANNEL_OPEN_FAILURE: (p, recipient, reason, description) => {
						const channel = this._chanMgr.get(recipient);
						if (typeof channel !== "function") return;
						const info = {
							reason,
							description
						};
						onChannelOpenFailure(this, recipient, info, channel);
					},
					CHANNEL_DATA: (p, recipient, data) => {
						const channel = this._chanMgr.get(recipient);
						if (typeof channel !== "object" || channel === null) return;
						if (channel.incoming.window === 0) return;
						channel.incoming.window -= data.length;
						if (channel.push(data) === false) {
							channel._waitChanDrain = true;
							return;
						}
						if (channel.incoming.window <= WINDOW_THRESHOLD) windowAdjust(channel);
					},
					CHANNEL_EXTENDED_DATA: (p, recipient, data, type) => {
						if (type !== STDERR) return;
						const channel = this._chanMgr.get(recipient);
						if (typeof channel !== "object" || channel === null) return;
						if (channel.incoming.window === 0) return;
						channel.incoming.window -= data.length;
						if (!channel.stderr.push(data)) {
							channel._waitChanDrain = true;
							return;
						}
						if (channel.incoming.window <= WINDOW_THRESHOLD) windowAdjust(channel);
					},
					CHANNEL_WINDOW_ADJUST: (p, recipient, amount) => {
						const channel = this._chanMgr.get(recipient);
						if (typeof channel !== "object" || channel === null) return;
						channel.outgoing.window += amount;
						if (channel._waitWindow) {
							channel._waitWindow = false;
							if (channel._chunk) channel._write(channel._chunk, null, channel._chunkcb);
							else if (channel._chunkcb) channel._chunkcb();
							else if (channel._chunkErr) channel.stderr._write(channel._chunkErr, null, channel._chunkcbErr);
							else if (channel._chunkcbErr) channel._chunkcbErr();
						}
					},
					CHANNEL_SUCCESS: (p, recipient) => {
						const channel = this._chanMgr.get(recipient);
						if (typeof channel !== "object" || channel === null) return;
						this._resetKA();
						if (channel._callbacks.length) channel._callbacks.shift()(false);
					},
					CHANNEL_FAILURE: (p, recipient) => {
						const channel = this._chanMgr.get(recipient);
						if (typeof channel !== "object" || channel === null) return;
						this._resetKA();
						if (channel._callbacks.length) channel._callbacks.shift()(true);
					},
					CHANNEL_REQUEST: (p, recipient, type, wantReply, data) => {
						const channel = this._chanMgr.get(recipient);
						if (typeof channel !== "object" || channel === null) return;
						const exit = channel._exit;
						if (exit.code !== void 0) return;
						switch (type) {
							case "exit-status":
								channel.emit("exit", exit.code = data);
								return;
							case "exit-signal":
								channel.emit("exit", exit.code = null, exit.signal = `SIG${data.signal}`, exit.dump = data.coreDumped, exit.desc = data.errorMessage);
								return;
						}
						if (wantReply) p.channelFailure(channel.outgoing.id);
					},
					CHANNEL_EOF: (p, recipient) => {
						const channel = this._chanMgr.get(recipient);
						if (typeof channel !== "object" || channel === null) return;
						if (channel.incoming.state !== "open") return;
						channel.incoming.state = "eof";
						if (channel.readable) channel.push(null);
						if (channel.stderr.readable) channel.stderr.push(null);
					},
					CHANNEL_CLOSE: (p, recipient) => {
						onCHANNEL_CLOSE(this, recipient, this._chanMgr.get(recipient));
					}
				}
			});
			sock.pause();
			const kainterval = this.config.keepaliveInterval;
			const kacountmax = this.config.keepaliveCountMax;
			let kacount = 0;
			let katimer;
			const sendKA = () => {
				if (++kacount > kacountmax) {
					clearInterval(katimer);
					if (sock.readable) {
						const err = /* @__PURE__ */ new Error("Keepalive timeout");
						err.level = "client-timeout";
						this.emit("error", err);
						sock.destroy();
					}
					return;
				}
				if (isWritable(sock)) {
					callbacks.push(resetKA);
					proto.ping();
				} else clearInterval(katimer);
			};
			function resetKA() {
				if (kainterval > 0) {
					kacount = 0;
					clearInterval(katimer);
					if (isWritable(sock)) katimer = setInterval(sendKA, kainterval);
				}
			}
			this._resetKA = resetKA;
			const onDone = (() => {
				let called = false;
				return () => {
					if (called) return;
					called = true;
					if (wasConnected && !sawHeader) {
						const err = makeError("Connection lost before handshake", "protocol", true);
						this.emit("error", err);
					}
				};
			})();
			const onConnect = (() => {
				let called = false;
				return () => {
					if (called) return;
					called = true;
					wasConnected = true;
					debug && debug("Socket connected");
					this.emit("connect");
					cryptoInit.then(() => {
						proto.start();
						sock.on("data", (data) => {
							try {
								proto.parse(data, 0, data.length);
							} catch (ex) {
								this.emit("error", ex);
								try {
									if (isWritable(sock)) sock.end();
								} catch {}
							}
						});
						if (sock.stderr && typeof sock.stderr.resume === "function") sock.stderr.resume();
						sock.resume();
					}).catch((err) => {
						this.emit("error", err);
						try {
							if (isWritable(sock)) sock.end();
						} catch {}
					});
				};
			})();
			let wasConnected = false;
			sock.on("connect", onConnect).on("timeout", () => {
				this.emit("timeout");
			}).on("error", (err) => {
				debug && debug(`Socket error: ${err.message}`);
				clearTimeout(this._readyTimeout);
				err.level = "client-socket";
				this.emit("error", err);
			}).on("end", () => {
				debug && debug("Socket ended");
				onDone();
				proto.cleanup();
				clearTimeout(this._readyTimeout);
				clearInterval(katimer);
				this.emit("end");
			}).on("close", () => {
				debug && debug("Socket closed");
				onDone();
				proto.cleanup();
				clearTimeout(this._readyTimeout);
				clearInterval(katimer);
				this.emit("close");
				const callbacks_ = callbacks;
				callbacks = this._callbacks = [];
				const err = /* @__PURE__ */ new Error("No response from server");
				for (let i = 0; i < callbacks_.length; ++i) callbacks_[i](err);
				this._chanMgr.cleanup(err);
			});
			let curAuth;
			let curPartial = null;
			let curAuthsLeft = null;
			const authsAllowed = ["none"];
			if (this.config.password !== void 0) authsAllowed.push("password");
			if (privateKey !== void 0) authsAllowed.push("publickey");
			if (this._agent !== void 0) authsAllowed.push("agent");
			if (this.config.tryKeyboard) authsAllowed.push("keyboard-interactive");
			if (privateKey !== void 0 && this.config.localHostname !== void 0 && this.config.localUsername !== void 0) authsAllowed.push("hostbased");
			if (Array.isArray(authHandler)) authHandler = makeSimpleAuthHandler(authHandler);
			else if (typeof authHandler !== "function") authHandler = makeSimpleAuthHandler(authsAllowed);
			let hasSentAuth = false;
			const doNextAuth = (nextAuth) => {
				if (hasSentAuth) return;
				hasSentAuth = true;
				if (nextAuth === false) {
					const err = /* @__PURE__ */ new Error("All configured authentication methods failed");
					err.level = "client-authentication";
					this.emit("error", err);
					this.end();
					return;
				}
				if (typeof nextAuth === "string") {
					const type = nextAuth;
					if (authsAllowed.indexOf(type) === -1) return skipAuth(`Authentication method not allowed: ${type}`);
					const username = this.config.username;
					switch (type) {
						case "password":
							nextAuth = {
								type,
								username,
								password: this.config.password
							};
							break;
						case "publickey":
							nextAuth = {
								type,
								username,
								key: privateKey
							};
							break;
						case "hostbased":
							nextAuth = {
								type,
								username,
								key: privateKey,
								localHostname: this.config.localHostname,
								localUsername: this.config.localUsername
							};
							break;
						case "agent":
							nextAuth = {
								type,
								username,
								agentCtx: new AgentContext(this._agent)
							};
							break;
						case "keyboard-interactive":
							nextAuth = {
								type,
								username,
								prompt: (...args) => this.emit("keyboard-interactive", ...args)
							};
							break;
						case "none":
							nextAuth = {
								type,
								username
							};
							break;
						default: return skipAuth(`Skipping unsupported authentication method: ${nextAuth}`);
					}
				} else if (typeof nextAuth !== "object" || nextAuth === null) return skipAuth(`Skipping invalid authentication attempt: ${nextAuth}`);
				else {
					const username = nextAuth.username;
					if (typeof username !== "string") return skipAuth(`Skipping invalid authentication attempt: ${nextAuth}`);
					const type = nextAuth.type;
					switch (type) {
						case "password": {
							const { password } = nextAuth;
							if (typeof password !== "string" && !Buffer.isBuffer(password)) return skipAuth("Skipping invalid password auth attempt");
							nextAuth = {
								type,
								username,
								password
							};
							break;
						}
						case "publickey": {
							const key = parseKey(nextAuth.key, nextAuth.passphrase);
							if (key instanceof Error) return skipAuth("Skipping invalid key auth attempt");
							if (!key.isPrivateKey()) return skipAuth("Skipping non-private key");
							nextAuth = {
								type,
								username,
								key
							};
							break;
						}
						case "hostbased": {
							const { localHostname, localUsername } = nextAuth;
							const key = parseKey(nextAuth.key, nextAuth.passphrase);
							if (key instanceof Error || typeof localHostname !== "string" || typeof localUsername !== "string") return skipAuth("Skipping invalid hostbased auth attempt");
							if (!key.isPrivateKey()) return skipAuth("Skipping non-private key");
							nextAuth = {
								type,
								username,
								key,
								localHostname,
								localUsername
							};
							break;
						}
						case "agent": {
							let agent = nextAuth.agent;
							if (typeof agent === "string" && agent.length) agent = createAgent(agent);
							else if (!isAgent(agent)) return skipAuth(`Skipping invalid agent: ${nextAuth.agent}`);
							nextAuth = {
								type,
								username,
								agentCtx: new AgentContext(agent)
							};
							break;
						}
						case "keyboard-interactive": {
							const { prompt } = nextAuth;
							if (typeof prompt !== "function") return skipAuth("Skipping invalid keyboard-interactive auth attempt");
							nextAuth = {
								type,
								username,
								prompt
							};
							break;
						}
						case "none":
							nextAuth = {
								type,
								username
							};
							break;
						default: return skipAuth(`Skipping unsupported authentication method: ${nextAuth}`);
					}
				}
				curAuth = nextAuth;
				try {
					const username = curAuth.username;
					switch (curAuth.type) {
						case "password":
							proto.authPassword(username, curAuth.password);
							break;
						case "publickey": {
							let keyAlgo;
							curAuth.keyAlgos = getKeyAlgos(this, curAuth.key, serverSigAlgs);
							if (curAuth.keyAlgos) {
								if (curAuth.keyAlgos.length) keyAlgo = curAuth.keyAlgos[0][0];
								else return skipAuth("Skipping key authentication (no mutual hash algorithm)");
							}
							proto.authPK(username, curAuth.key, keyAlgo);
							break;
						}
						case "hostbased": {
							let keyAlgo;
							let hashAlgo;
							curAuth.keyAlgos = getKeyAlgos(this, curAuth.key, serverSigAlgs);
							if (curAuth.keyAlgos) {
								if (curAuth.keyAlgos.length) [keyAlgo, hashAlgo] = curAuth.keyAlgos[0];
								else return skipAuth("Skipping hostbased authentication (no mutual hash algorithm)");
							}
							proto.authHostbased(username, curAuth.key, curAuth.localHostname, curAuth.localUsername, keyAlgo, (buf, cb) => {
								const signature = curAuth.key.sign(buf, hashAlgo);
								if (signature instanceof Error) {
									signature.message = `Error while signing with key: ${signature.message}`;
									signature.level = "client-authentication";
									this.emit("error", signature);
									return tryNextAuth();
								}
								cb(signature);
							});
							break;
						}
						case "agent":
							curAuth.agentCtx.init((err) => {
								if (err) {
									err.level = "agent";
									this.emit("error", err);
									return tryNextAuth();
								}
								tryNextAgentKey();
							});
							break;
						case "keyboard-interactive":
							proto.authKeyboard(username);
							break;
						case "none": proto.authNone(username);
					}
				} finally {
					hasSentAuth = false;
				}
			};
			function skipAuth(msg) {
				debug && debug(msg);
				process.nextTick(tryNextAuth);
			}
			function tryNextAuth() {
				hasSentAuth = false;
				const auth = authHandler(curAuthsLeft, curPartial, doNextAuth);
				if (hasSentAuth || auth === void 0) return;
				doNextAuth(auth);
			}
			const tryNextAgentKey = () => {
				if (curAuth.type === "agent") {
					const key = curAuth.agentCtx.nextKey();
					if (key === false) {
						debug && debug("Agent: No more keys left to try");
						debug && debug("Client: agent auth failed");
						tryNextAuth();
					} else {
						const pos = curAuth.agentCtx.pos();
						let keyAlgo;
						curAuth.keyAlgos = getKeyAlgos(this, key, serverSigAlgs);
						if (curAuth.keyAlgos) {
							if (curAuth.keyAlgos.length) keyAlgo = curAuth.keyAlgos[0][0];
							else {
								debug && debug(`Agent: Skipping key #${pos + 1} (no mutual hash algorithm)`);
								tryNextAgentKey();
								return;
							}
						}
						debug && debug(`Agent: Trying key #${pos + 1}`);
						proto.authPK(curAuth.username, key, keyAlgo);
					}
				}
			};
			const startTimeout = () => {
				if (this.config.readyTimeout > 0) this._readyTimeout = setTimeout(() => {
					const err = /* @__PURE__ */ new Error("Timed out while waiting for handshake");
					err.level = "client-timeout";
					this.emit("error", err);
					sock.destroy();
				}, this.config.readyTimeout);
			};
			if (!cfg.sock) {
				let host = this.config.host;
				const forceIPv4 = this.config.forceIPv4;
				const forceIPv6 = this.config.forceIPv6;
				debug && debug(`Client: Trying ${host} on port ${this.config.port} ...`);
				const doConnect = () => {
					startTimeout();
					sock.connect({
						host,
						port: this.config.port,
						localAddress: this.config.localAddress,
						localPort: this.config.localPort
					});
					sock.setMaxListeners(0);
					sock.setTimeout(typeof cfg.timeout === "number" ? cfg.timeout : 0);
				};
				if (!forceIPv4 && !forceIPv6 || forceIPv4 && forceIPv6) doConnect();
				else dnsLookup(host, forceIPv4 ? 4 : 6, (err, address, family) => {
					if (err) {
						const error = /* @__PURE__ */ new Error(`Error while looking up ${forceIPv4 ? "IPv4" : "IPv6"} address for '${host}': ${err}`);
						clearTimeout(this._readyTimeout);
						error.level = "client-dns";
						this.emit("error", error);
						this.emit("close");
						return;
					}
					host = address;
					doConnect();
				});
			} else {
				startTimeout();
				if (typeof sock.connecting === "boolean") {
					if (!sock.connecting) onConnect();
				} else onConnect();
			}
			return this;
		}
		end() {
			if (this._sock && isWritable(this._sock)) {
				this._protocol.disconnect(DISCONNECT_REASON.BY_APPLICATION);
				this._sock.end();
			}
			return this;
		}
		destroy() {
			this._sock && isWritable(this._sock) && this._sock.destroy();
			return this;
		}
		exec(cmd, opts, cb) {
			if (!this._sock || !isWritable(this._sock)) throw new Error("Not connected");
			if (typeof opts === "function") {
				cb = opts;
				opts = {};
			}
			const extraOpts = { allowHalfOpen: opts.allowHalfOpen !== false };
			openChannel(this, "session", extraOpts, (err, chan) => {
				if (err) {
					cb(err);
					return;
				}
				const todo = [];
				function reqCb(err) {
					if (err) {
						chan.close();
						cb(err);
						return;
					}
					if (todo.length) todo.shift()();
				}
				if (this.config.allowAgentFwd === true || opts && opts.agentForward === true && this._agent !== void 0) todo.push(() => reqAgentFwd(chan, reqCb));
				if (typeof opts === "object" && opts !== null) {
					if (typeof opts.env === "object" && opts.env !== null) reqEnv(chan, opts.env);
					if (typeof opts.pty === "object" && opts.pty !== null || opts.pty === true) todo.push(() => reqPty(chan, opts.pty, reqCb));
					if (typeof opts.x11 === "object" && opts.x11 !== null || opts.x11 === "number" || opts.x11 === true) todo.push(() => reqX11(chan, opts.x11, reqCb));
				}
				todo.push(() => reqExec(chan, cmd, opts, cb));
				todo.shift()();
			});
			return this;
		}
		shell(wndopts, opts, cb) {
			if (!this._sock || !isWritable(this._sock)) throw new Error("Not connected");
			if (typeof wndopts === "function") {
				cb = wndopts;
				wndopts = opts = void 0;
			} else if (typeof opts === "function") {
				cb = opts;
				opts = void 0;
			}
			if (wndopts && (wndopts.x11 !== void 0 || wndopts.env !== void 0)) {
				opts = wndopts;
				wndopts = void 0;
			}
			openChannel(this, "session", (err, chan) => {
				if (err) {
					cb(err);
					return;
				}
				const todo = [];
				function reqCb(err) {
					if (err) {
						chan.close();
						cb(err);
						return;
					}
					if (todo.length) todo.shift()();
				}
				if (this.config.allowAgentFwd === true || opts && opts.agentForward === true && this._agent !== void 0) todo.push(() => reqAgentFwd(chan, reqCb));
				if (wndopts !== false) todo.push(() => reqPty(chan, wndopts, reqCb));
				if (typeof opts === "object" && opts !== null) {
					if (typeof opts.env === "object" && opts.env !== null) reqEnv(chan, opts.env);
					if (typeof opts.x11 === "object" && opts.x11 !== null || opts.x11 === "number" || opts.x11 === true) todo.push(() => reqX11(chan, opts.x11, reqCb));
				}
				todo.push(() => reqShell(chan, cb));
				todo.shift()();
			});
			return this;
		}
		subsys(name, cb) {
			if (!this._sock || !isWritable(this._sock)) throw new Error("Not connected");
			openChannel(this, "session", (err, chan) => {
				if (err) {
					cb(err);
					return;
				}
				reqSubsystem(chan, name, (err, stream) => {
					if (err) {
						cb(err);
						return;
					}
					cb(void 0, stream);
				});
			});
			return this;
		}
		forwardIn(bindAddr, bindPort, cb) {
			if (!this._sock || !isWritable(this._sock)) throw new Error("Not connected");
			const wantReply = typeof cb === "function";
			if (wantReply) this._callbacks.push((had_err, data) => {
				if (had_err) {
					cb(had_err !== true ? had_err : /* @__PURE__ */ new Error(`Unable to bind to ${bindAddr}:${bindPort}`));
					return;
				}
				let realPort = bindPort;
				if (bindPort === 0 && data && data.length >= 4) {
					realPort = readUInt32BE(data, 0);
					if (!(this._protocol._compatFlags & COMPAT.DYN_RPORT_BUG)) bindPort = realPort;
				}
				this._forwarding[`${bindAddr}:${bindPort}`] = realPort;
				cb(void 0, realPort);
			});
			this._protocol.tcpipForward(bindAddr, bindPort, wantReply);
			return this;
		}
		unforwardIn(bindAddr, bindPort, cb) {
			if (!this._sock || !isWritable(this._sock)) throw new Error("Not connected");
			const wantReply = typeof cb === "function";
			if (wantReply) this._callbacks.push((had_err) => {
				if (had_err) {
					cb(had_err !== true ? had_err : /* @__PURE__ */ new Error(`Unable to unbind from ${bindAddr}:${bindPort}`));
					return;
				}
				delete this._forwarding[`${bindAddr}:${bindPort}`];
				cb();
			});
			this._protocol.cancelTcpipForward(bindAddr, bindPort, wantReply);
			return this;
		}
		forwardOut(srcIP, srcPort, dstIP, dstPort, cb) {
			if (!this._sock || !isWritable(this._sock)) throw new Error("Not connected");
			const cfg = {
				srcIP,
				srcPort,
				dstIP,
				dstPort
			};
			if (typeof cb !== "function") cb = noop;
			openChannel(this, "direct-tcpip", cfg, cb);
			return this;
		}
		openssh_noMoreSessions(cb) {
			if (!this._sock || !isWritable(this._sock)) throw new Error("Not connected");
			const wantReply = typeof cb === "function";
			if (!this.config.strictVendor || this.config.strictVendor && RE_OPENSSH.test(this._remoteVer)) {
				if (wantReply) this._callbacks.push((had_err) => {
					if (had_err) {
						cb(had_err !== true ? had_err : /* @__PURE__ */ new Error("Unable to disable future sessions"));
						return;
					}
					cb();
				});
				this._protocol.openssh_noMoreSessions(wantReply);
				return this;
			}
			if (!wantReply) return this;
			process.nextTick(cb, /* @__PURE__ */ new Error("strictVendor enabled and server is not OpenSSH or compatible version"));
			return this;
		}
		openssh_forwardInStreamLocal(socketPath, cb) {
			if (!this._sock || !isWritable(this._sock)) throw new Error("Not connected");
			const wantReply = typeof cb === "function";
			if (!this.config.strictVendor || this.config.strictVendor && RE_OPENSSH.test(this._remoteVer)) {
				if (wantReply) this._callbacks.push((had_err) => {
					if (had_err) {
						cb(had_err !== true ? had_err : /* @__PURE__ */ new Error(`Unable to bind to ${socketPath}`));
						return;
					}
					this._forwardingUnix[socketPath] = true;
					cb();
				});
				this._protocol.openssh_streamLocalForward(socketPath, wantReply);
				return this;
			}
			if (!wantReply) return this;
			process.nextTick(cb, /* @__PURE__ */ new Error("strictVendor enabled and server is not OpenSSH or compatible version"));
			return this;
		}
		openssh_unforwardInStreamLocal(socketPath, cb) {
			if (!this._sock || !isWritable(this._sock)) throw new Error("Not connected");
			const wantReply = typeof cb === "function";
			if (!this.config.strictVendor || this.config.strictVendor && RE_OPENSSH.test(this._remoteVer)) {
				if (wantReply) this._callbacks.push((had_err) => {
					if (had_err) {
						cb(had_err !== true ? had_err : /* @__PURE__ */ new Error(`Unable to unbind from ${socketPath}`));
						return;
					}
					delete this._forwardingUnix[socketPath];
					cb();
				});
				this._protocol.openssh_cancelStreamLocalForward(socketPath, wantReply);
				return this;
			}
			if (!wantReply) return this;
			process.nextTick(cb, /* @__PURE__ */ new Error("strictVendor enabled and server is not OpenSSH or compatible version"));
			return this;
		}
		openssh_forwardOutStreamLocal(socketPath, cb) {
			if (!this._sock || !isWritable(this._sock)) throw new Error("Not connected");
			if (typeof cb !== "function") cb = noop;
			if (!this.config.strictVendor || this.config.strictVendor && RE_OPENSSH.test(this._remoteVer)) {
				openChannel(this, "direct-streamlocal@openssh.com", { socketPath }, cb);
				return this;
			}
			process.nextTick(cb, /* @__PURE__ */ new Error("strictVendor enabled and server is not OpenSSH or compatible version"));
			return this;
		}
		sftp(env, cb) {
			if (!this._sock || !isWritable(this._sock)) throw new Error("Not connected");
			if (typeof env === "function") {
				cb = env;
				env = void 0;
			}
			openChannel(this, "sftp", (err, sftp) => {
				if (err) {
					cb(err);
					return;
				}
				const reqSubsystemCb = (err, sftp_) => {
					if (err) {
						cb(err);
						return;
					}
					function removeListeners() {
						sftp.removeListener("ready", onReady);
						sftp.removeListener("error", onError);
						sftp.removeListener("exit", onExit);
						sftp.removeListener("close", onExit);
					}
					function onReady() {
						removeListeners();
						cb(void 0, sftp);
					}
					function onError(err) {
						removeListeners();
						cb(err);
					}
					function onExit(code, signal) {
						removeListeners();
						let msg;
						if (typeof code === "number") msg = `Received exit code ${code} while establishing SFTP session`;
						else if (signal !== void 0) msg = `Received signal ${signal} while establishing SFTP session`;
						else msg = "Received unexpected SFTP session termination";
						const err = new Error(msg);
						err.code = code;
						err.signal = signal;
						cb(err);
					}
					sftp.on("ready", onReady).on("error", onError).on("exit", onExit).on("close", onExit);
					sftp._init();
				};
				if (typeof env === "object" && env !== null) reqEnv(sftp, env, (err) => {
					if (err) {
						cb(err);
						return;
					}
					reqSubsystem(sftp, "sftp", reqSubsystemCb);
				});
				else reqSubsystem(sftp, "sftp", reqSubsystemCb);
			});
			return this;
		}
		setNoDelay(noDelay) {
			if (this._sock && typeof this._sock.setNoDelay === "function") this._sock.setNoDelay(noDelay);
			return this;
		}
	};
	function openChannel(self, type, opts, cb) {
		const initWindow = MAX_WINDOW;
		const maxPacket = PACKET_SIZE;
		if (typeof opts === "function") {
			cb = opts;
			opts = {};
		}
		const wrapper = (err, stream) => {
			cb(err, stream);
		};
		wrapper.type = type;
		const localChan = self._chanMgr.add(wrapper);
		if (localChan === -1) {
			cb(/* @__PURE__ */ new Error("No free channels available"));
			return;
		}
		switch (type) {
			case "session":
			case "sftp":
				self._protocol.session(localChan, initWindow, maxPacket);
				break;
			case "direct-tcpip":
				self._protocol.directTcpip(localChan, initWindow, maxPacket, opts);
				break;
			case "direct-streamlocal@openssh.com":
				self._protocol.openssh_directStreamLocal(localChan, initWindow, maxPacket, opts);
				break;
			default: throw new Error(`Unsupported channel type: ${type}`);
		}
	}
	function reqX11(chan, screen, cb) {
		const cfg = {
			single: false,
			protocol: "MIT-MAGIC-COOKIE-1",
			cookie: void 0,
			screen: 0
		};
		if (typeof screen === "function") cb = screen;
		else if (typeof screen === "object" && screen !== null) {
			if (typeof screen.single === "boolean") cfg.single = screen.single;
			if (typeof screen.screen === "number") cfg.screen = screen.screen;
			if (typeof screen.protocol === "string") cfg.protocol = screen.protocol;
			if (typeof screen.cookie === "string") cfg.cookie = screen.cookie;
			else if (Buffer.isBuffer(screen.cookie)) cfg.cookie = screen.cookie.hexSlice(0, screen.cookie.length);
		}
		if (cfg.cookie === void 0) cfg.cookie = randomCookie();
		const wantReply = typeof cb === "function";
		if (chan.outgoing.state !== "open") {
			if (wantReply) cb(/* @__PURE__ */ new Error("Channel is not open"));
			return;
		}
		if (wantReply) chan._callbacks.push((had_err) => {
			if (had_err) {
				cb(had_err !== true ? had_err : /* @__PURE__ */ new Error("Unable to request X11"));
				return;
			}
			chan._hasX11 = true;
			++chan._client._acceptX11;
			chan.once("close", () => {
				if (chan._client._acceptX11) --chan._client._acceptX11;
			});
			cb();
		});
		chan._client._protocol.x11Forward(chan.outgoing.id, cfg, wantReply);
	}
	function reqPty(chan, opts, cb) {
		let rows = 24;
		let cols = 80;
		let width = 640;
		let height = 480;
		let term = "vt100";
		let modes = null;
		if (typeof opts === "function") cb = opts;
		else if (typeof opts === "object" && opts !== null) {
			if (typeof opts.rows === "number") rows = opts.rows;
			if (typeof opts.cols === "number") cols = opts.cols;
			if (typeof opts.width === "number") width = opts.width;
			if (typeof opts.height === "number") height = opts.height;
			if (typeof opts.term === "string") term = opts.term;
			if (typeof opts.modes === "object") modes = opts.modes;
		}
		const wantReply = typeof cb === "function";
		if (chan.outgoing.state !== "open") {
			if (wantReply) cb(/* @__PURE__ */ new Error("Channel is not open"));
			return;
		}
		if (wantReply) chan._callbacks.push((had_err) => {
			if (had_err) {
				cb(had_err !== true ? had_err : /* @__PURE__ */ new Error("Unable to request a pseudo-terminal"));
				return;
			}
			cb();
		});
		chan._client._protocol.pty(chan.outgoing.id, rows, cols, height, width, term, modes, wantReply);
	}
	function reqAgentFwd(chan, cb) {
		const wantReply = typeof cb === "function";
		if (chan.outgoing.state !== "open") {
			wantReply && cb(/* @__PURE__ */ new Error("Channel is not open"));
			return;
		}
		if (chan._client._agentFwdEnabled) {
			wantReply && cb(false);
			return;
		}
		chan._client._agentFwdEnabled = true;
		chan._callbacks.push((had_err) => {
			if (had_err) {
				chan._client._agentFwdEnabled = false;
				if (wantReply) cb(had_err !== true ? had_err : /* @__PURE__ */ new Error("Unable to request agent forwarding"));
				return;
			}
			if (wantReply) cb();
		});
		chan._client._protocol.openssh_agentForward(chan.outgoing.id, true);
	}
	function reqShell(chan, cb) {
		if (chan.outgoing.state !== "open") {
			cb(/* @__PURE__ */ new Error("Channel is not open"));
			return;
		}
		chan._callbacks.push((had_err) => {
			if (had_err) {
				cb(had_err !== true ? had_err : /* @__PURE__ */ new Error("Unable to open shell"));
				return;
			}
			chan.subtype = "shell";
			cb(void 0, chan);
		});
		chan._client._protocol.shell(chan.outgoing.id, true);
	}
	function reqExec(chan, cmd, opts, cb) {
		if (chan.outgoing.state !== "open") {
			cb(/* @__PURE__ */ new Error("Channel is not open"));
			return;
		}
		chan._callbacks.push((had_err) => {
			if (had_err) {
				cb(had_err !== true ? had_err : /* @__PURE__ */ new Error("Unable to exec"));
				return;
			}
			chan.subtype = "exec";
			chan.allowHalfOpen = opts.allowHalfOpen !== false;
			cb(void 0, chan);
		});
		chan._client._protocol.exec(chan.outgoing.id, cmd, true);
	}
	function reqEnv(chan, env, cb) {
		const wantReply = typeof cb === "function";
		if (chan.outgoing.state !== "open") {
			if (wantReply) cb(/* @__PURE__ */ new Error("Channel is not open"));
			return;
		}
		if (wantReply) chan._callbacks.push((had_err) => {
			if (had_err) {
				cb(had_err !== true ? had_err : /* @__PURE__ */ new Error("Unable to set environment"));
				return;
			}
			cb();
		});
		const keys = Object.keys(env || {});
		for (let i = 0; i < keys.length; ++i) {
			const key = keys[i];
			const val = env[key];
			chan._client._protocol.env(chan.outgoing.id, key, val, wantReply);
		}
	}
	function reqSubsystem(chan, name, cb) {
		if (chan.outgoing.state !== "open") {
			cb(/* @__PURE__ */ new Error("Channel is not open"));
			return;
		}
		chan._callbacks.push((had_err) => {
			if (had_err) {
				cb(had_err !== true ? had_err : /* @__PURE__ */ new Error(`Unable to start subsystem: ${name}`));
				return;
			}
			chan.subtype = "subsystem";
			cb(void 0, chan);
		});
		chan._client._protocol.subsystem(chan.outgoing.id, name, true);
	}
	function onCHANNEL_OPEN(self, info) {
		let localChan = -1;
		let reason;
		const accept = () => {
			const chanInfo = {
				type: info.type,
				incoming: {
					id: localChan,
					window: MAX_WINDOW,
					packetSize: PACKET_SIZE,
					state: "open"
				},
				outgoing: {
					id: info.sender,
					window: info.window,
					packetSize: info.packetSize,
					state: "open"
				}
			};
			const stream = new Channel(self, chanInfo);
			self._chanMgr.update(localChan, stream);
			self._protocol.channelOpenConfirm(info.sender, localChan, MAX_WINDOW, PACKET_SIZE);
			return stream;
		};
		const reject = () => {
			if (reason === void 0) {
				if (localChan === -1) reason = CHANNEL_OPEN_FAILURE.RESOURCE_SHORTAGE;
				else reason = CHANNEL_OPEN_FAILURE.CONNECT_FAILED;
			}
			if (localChan !== -1) self._chanMgr.remove(localChan);
			self._protocol.channelOpenFail(info.sender, reason, "");
		};
		const reserveChannel = () => {
			localChan = self._chanMgr.add();
			if (localChan === -1) {
				reason = CHANNEL_OPEN_FAILURE.RESOURCE_SHORTAGE;
				if (self.config.debug) self.config.debug("Client: Automatic rejection of incoming channel open: no channels available");
			}
			return localChan !== -1;
		};
		const data = info.data;
		switch (info.type) {
			case "forwarded-tcpip": {
				const val = self._forwarding[`${data.destIP}:${data.destPort}`];
				if (val !== void 0 && reserveChannel()) {
					if (data.destPort === 0) data.destPort = val;
					self.emit("tcp connection", data, accept, reject);
					return;
				}
				break;
			}
			case "forwarded-streamlocal@openssh.com":
				if (self._forwardingUnix[data.socketPath] !== void 0 && reserveChannel()) {
					self.emit("unix connection", data, accept, reject);
					return;
				}
				break;
			case "auth-agent@openssh.com":
				if (self._agentFwdEnabled && typeof self._agent.getStream === "function" && reserveChannel()) {
					self._agent.getStream((err, stream) => {
						if (err) return reject();
						const upstream = accept();
						upstream.pipe(stream).pipe(upstream);
					});
					return;
				}
				break;
			case "x11":
				if (self._acceptX11 !== 0 && reserveChannel()) {
					self.emit("x11", data, accept, reject);
					return;
				}
				break;
			default:
				reason = CHANNEL_OPEN_FAILURE.UNKNOWN_CHANNEL_TYPE;
				if (self.config.debug) self.config.debug(`Client: Automatic rejection of unsupported incoming channel open type: ${info.type}`);
		}
		if (reason === void 0) {
			reason = CHANNEL_OPEN_FAILURE.ADMINISTRATIVELY_PROHIBITED;
			if (self.config.debug) self.config.debug("Client: Automatic rejection of unexpected incoming channel open for: " + info.type);
		}
		reject();
	}
	const randomCookie = (() => {
		const buffer = Buffer.allocUnsafe(16);
		return () => {
			randomFillSync(buffer, 0, 16);
			return buffer.hexSlice(0, 16);
		};
	})();
	function makeSimpleAuthHandler(authList) {
		if (!Array.isArray(authList)) throw new Error("authList must be an array");
		let a = 0;
		return (authsLeft, partialSuccess, cb) => {
			if (a === authList.length) return false;
			return authList[a++];
		};
	}
	function hostKeysProve(client, keys_, cb) {
		if (!client._sock || !isWritable(client._sock)) return;
		if (typeof cb !== "function") cb = noop;
		if (!Array.isArray(keys_)) throw new TypeError("Invalid keys argument type");
		const keys = [];
		for (const key of keys_) {
			const parsed = parseKey(key);
			if (parsed instanceof Error) throw parsed;
			keys.push(parsed);
		}
		if (!client.config.strictVendor || client.config.strictVendor && RE_OPENSSH.test(client._remoteVer)) {
			client._callbacks.push((had_err, data) => {
				if (had_err) {
					cb(had_err !== true ? had_err : /* @__PURE__ */ new Error("Server failed to prove supplied keys"));
					return;
				}
				const ret = [];
				let keyIdx = 0;
				bufferParser.init(data, 0);
				while (bufferParser.avail()) {
					if (keyIdx === keys.length) break;
					const key = keys[keyIdx++];
					const keyPublic = key.getPublicSSH();
					const sigEntry = bufferParser.readString();
					sigParser.init(sigEntry, 0);
					const type = sigParser.readString(true);
					let value = sigParser.readString();
					let algo;
					if (type !== key.type) {
						if (key.type === "ssh-rsa") switch (type) {
							case "rsa-sha2-256":
								algo = "sha256";
								break;
							case "rsa-sha2-512":
								algo = "sha512";
								break;
							default: continue;
						}
						else continue;
					}
					const sessionID = client._protocol._kex.sessionID;
					const verifyData = Buffer.allocUnsafe(37 + sessionID.length + 4 + keyPublic.length);
					let p = 0;
					writeUInt32BE(verifyData, 29, p);
					verifyData.utf8Write("hostkeys-prove-00@openssh.com", p += 4, 29);
					writeUInt32BE(verifyData, sessionID.length, p += 29);
					bufferCopy(sessionID, verifyData, 0, sessionID.length, p += 4);
					writeUInt32BE(verifyData, keyPublic.length, p += sessionID.length);
					bufferCopy(keyPublic, verifyData, 0, keyPublic.length, p += 4);
					if (!(value = sigSSHToASN1(value, type))) continue;
					if (key.verify(verifyData, value, algo) === true) ret.push(key);
				}
				sigParser.clear();
				bufferParser.clear();
				cb(null, ret);
			});
			client._protocol.openssh_hostKeysProve(keys);
			return;
		}
		process.nextTick(cb, /* @__PURE__ */ new Error("strictVendor enabled and server is not OpenSSH or compatible version"));
	}
	function getKeyAlgos(client, key, serverSigAlgs) {
		switch (key.type) {
			case "ssh-rsa":
				if (client._protocol._compatFlags & COMPAT.IMPLY_RSA_SHA2_SIGALGS) {
					if (!Array.isArray(serverSigAlgs)) serverSigAlgs = ["rsa-sha2-256", "rsa-sha2-512"];
					else serverSigAlgs = [
						"rsa-sha2-256",
						"rsa-sha2-512",
						...serverSigAlgs
					];
				}
				if (Array.isArray(serverSigAlgs)) {
					if (serverSigAlgs.indexOf("rsa-sha2-256") !== -1) return [["rsa-sha2-256", "sha256"]];
					if (serverSigAlgs.indexOf("rsa-sha2-512") !== -1) return [["rsa-sha2-512", "sha512"]];
					if (serverSigAlgs.indexOf("ssh-rsa") === -1) return [];
				}
				return [["ssh-rsa", "sha1"]];
		}
	}
	module.exports = Client;
}));
// node_modules/ssh2/lib/http-agents.js
var require_http_agents = /* @__PURE__ */ __commonJSMin(((exports) => {
	const { Agent: HttpAgent } = __require("http");
	const { Agent: HttpsAgent } = __require("https");
	const { connect: tlsConnect } = __require("tls");
	let Client;
	for (const ctor of [HttpAgent, HttpsAgent]) {
		class SSHAgent extends ctor {
			constructor(connectCfg, agentOptions) {
				super(agentOptions);
				this._connectCfg = connectCfg;
				this._defaultSrcIP = agentOptions && agentOptions.srcIP || "localhost";
			}
			createConnection(options, cb) {
				const srcIP = options && options.localAddress || this._defaultSrcIP;
				const srcPort = options && options.localPort || 0;
				const dstIP = options.host;
				const dstPort = options.port;
				if (Client === void 0) Client = require_client();
				const client = new Client();
				let triedForward = false;
				client.on("ready", () => {
					client.forwardOut(srcIP, srcPort, dstIP, dstPort, (err, stream) => {
						triedForward = true;
						if (err) {
							client.end();
							return cb(err);
						}
						stream.once("close", () => client.end());
						cb(null, decorateStream(stream, ctor, options));
					});
				}).on("error", cb).on("close", () => {
					if (!triedForward) cb(/* @__PURE__ */ new Error("Unexpected connection close"));
				}).connect(this._connectCfg);
			}
		}
		exports[ctor === HttpAgent ? "SSHTTPAgent" : "SSHTTPSAgent"] = SSHAgent;
	}
	function noop() {}
	function decorateStream(stream, ctor, options) {
		if (ctor === HttpAgent) {
			stream.setKeepAlive = noop;
			stream.setNoDelay = noop;
			stream.setTimeout = noop;
			stream.ref = noop;
			stream.unref = noop;
			stream.destroySoon = stream.destroy;
			return stream;
		}
		options.socket = stream;
		const wrapped = tlsConnect(options);
		const onClose = (() => {
			let called = false;
			return () => {
				if (called) return;
				called = true;
				if (stream.isPaused()) stream.resume();
			};
		})();
		wrapped.on("end", onClose).on("close", onClose);
		return wrapped;
	}
}));
// node_modules/ssh2/lib/server.js
var require_server = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const { Server: netServer } = __require("net");
	const EventEmitter = __require("events");
	const { listenerCount } = EventEmitter;
	const { CHANNEL_OPEN_FAILURE, DEFAULT_CIPHER, DEFAULT_COMPRESSION, DEFAULT_KEX, DEFAULT_MAC, DEFAULT_SERVER_HOST_KEY, DISCONNECT_REASON, DISCONNECT_REASON_BY_VALUE, SUPPORTED_CIPHER, SUPPORTED_COMPRESSION, SUPPORTED_KEX, SUPPORTED_MAC, SUPPORTED_SERVER_HOST_KEY } = require_constants();
	const { init: cryptoInit } = require_crypto();
	const { KexInit } = require_kex();
	const { parseKey } = require_keyParser();
	const Protocol = require_Protocol();
	const { SFTP } = require_SFTP();
	const { writeUInt32BE } = require_utils$1();
	const { Channel, MAX_WINDOW, PACKET_SIZE, windowAdjust, WINDOW_THRESHOLD } = require_Channel();
	const { ChannelManager, generateAlgorithmList, isWritable, onChannelOpenFailure, onCHANNEL_CLOSE } = require_utils();
	const MAX_PENDING_AUTHS = 10;
	var AuthContext = class extends EventEmitter {
		constructor(protocol, username, service, method, cb) {
			super();
			this.username = this.user = username;
			this.service = service;
			this.method = method;
			this._initialResponse = false;
			this._finalResponse = false;
			this._multistep = false;
			this._cbfinal = (allowed, methodsLeft, isPartial) => {
				if (!this._finalResponse) {
					this._finalResponse = true;
					cb(this, allowed, methodsLeft, isPartial);
				}
			};
			this._protocol = protocol;
		}
		accept() {
			this._cleanup && this._cleanup();
			this._initialResponse = true;
			this._cbfinal(true);
		}
		reject(methodsLeft, isPartial) {
			this._cleanup && this._cleanup();
			this._initialResponse = true;
			this._cbfinal(false, methodsLeft, isPartial);
		}
	};
	var KeyboardAuthContext = class extends AuthContext {
		constructor(protocol, username, service, method, submethods, cb) {
			super(protocol, username, service, method, cb);
			this._multistep = true;
			this._cb = void 0;
			this._onInfoResponse = (responses) => {
				const callback = this._cb;
				if (callback) {
					this._cb = void 0;
					callback(responses);
				}
			};
			this.submethods = submethods;
			this.on("abort", () => {
				this._cb && this._cb(/* @__PURE__ */ new Error("Authentication request aborted"));
			});
		}
		prompt(prompts, title, instructions, cb) {
			if (!Array.isArray(prompts)) prompts = [prompts];
			if (typeof title === "function") {
				cb = title;
				title = instructions = void 0;
			} else if (typeof instructions === "function") {
				cb = instructions;
				instructions = void 0;
			} else if (typeof cb !== "function") cb = void 0;
			for (let i = 0; i < prompts.length; ++i) if (typeof prompts[i] === "string") prompts[i] = {
				prompt: prompts[i],
				echo: true
			};
			this._cb = cb;
			this._initialResponse = true;
			this._protocol.authInfoReq(title, instructions, prompts);
		}
	};
	var PKAuthContext = class extends AuthContext {
		constructor(protocol, username, service, method, pkInfo, cb) {
			super(protocol, username, service, method, cb);
			this.key = {
				algo: pkInfo.keyAlgo,
				data: pkInfo.key
			};
			this.hashAlgo = pkInfo.hashAlgo;
			this.signature = pkInfo.signature;
			this.blob = pkInfo.blob;
		}
		accept() {
			if (!this.signature) {
				this._initialResponse = true;
				this._protocol.authPKOK(this.key.algo, this.key.data);
			} else AuthContext.prototype.accept.call(this);
		}
	};
	var HostbasedAuthContext = class extends AuthContext {
		constructor(protocol, username, service, method, pkInfo, cb) {
			super(protocol, username, service, method, cb);
			this.key = {
				algo: pkInfo.keyAlgo,
				data: pkInfo.key
			};
			this.hashAlgo = pkInfo.hashAlgo;
			this.signature = pkInfo.signature;
			this.blob = pkInfo.blob;
			this.localHostname = pkInfo.localHostname;
			this.localUsername = pkInfo.localUsername;
		}
	};
	var PwdAuthContext = class extends AuthContext {
		constructor(protocol, username, service, method, password, cb) {
			super(protocol, username, service, method, cb);
			this.password = password;
			this._changeCb = void 0;
		}
		requestChange(prompt, cb) {
			if (this._changeCb) throw new Error("Change request already in progress");
			if (typeof prompt !== "string") throw new Error("prompt argument must be a string");
			if (typeof cb !== "function") throw new Error("Callback argument must be a function");
			this._changeCb = cb;
			this._protocol.authPasswdChg(prompt);
		}
	};
	var Session = class extends EventEmitter {
		constructor(client, info, localChan) {
			super();
			this.type = "session";
			this.subtype = void 0;
			this.server = true;
			this._ending = false;
			this._channel = void 0;
			this._chanInfo = {
				type: "session",
				incoming: {
					id: localChan,
					window: MAX_WINDOW,
					packetSize: PACKET_SIZE,
					state: "open"
				},
				outgoing: {
					id: info.sender,
					window: info.window,
					packetSize: info.packetSize,
					state: "open"
				}
			};
		}
	};
	var Server = class extends EventEmitter {
		constructor(cfg, listener) {
			super();
			if (typeof cfg !== "object" || cfg === null) throw new Error("Missing configuration object");
			const hostKeys = Object.create(null);
			const hostKeyAlgoOrder = [];
			const hostKeys_ = cfg.hostKeys;
			if (!Array.isArray(hostKeys_)) throw new Error("hostKeys must be an array");
			const cfgAlgos = typeof cfg.algorithms === "object" && cfg.algorithms !== null ? cfg.algorithms : {};
			const hostKeyAlgos = generateAlgorithmList(cfgAlgos.serverHostKey, DEFAULT_SERVER_HOST_KEY, SUPPORTED_SERVER_HOST_KEY);
			for (let i = 0; i < hostKeys_.length; ++i) {
				let privateKey;
				if (Buffer.isBuffer(hostKeys_[i]) || typeof hostKeys_[i] === "string") privateKey = parseKey(hostKeys_[i]);
				else privateKey = parseKey(hostKeys_[i].key, hostKeys_[i].passphrase);
				if (privateKey instanceof Error) throw new Error(`Cannot parse privateKey: ${privateKey.message}`);
				if (Array.isArray(privateKey)) privateKey = privateKey[0];
				if (privateKey.getPrivatePEM() === null) throw new Error("privateKey value contains an invalid private key");
				if (hostKeyAlgoOrder.includes(privateKey.type)) continue;
				if (privateKey.type === "ssh-rsa") {
					let sha1Pos = hostKeyAlgos.indexOf("ssh-rsa");
					const sha256Pos = hostKeyAlgos.indexOf("rsa-sha2-256");
					const sha512Pos = hostKeyAlgos.indexOf("rsa-sha2-512");
					if (sha1Pos === -1) sha1Pos = 1e400;
					[
						sha1Pos,
						sha256Pos,
						sha512Pos
					].sort(compareNumbers).forEach((pos) => {
						if (pos === -1) return;
						let type;
						switch (pos) {
							case sha1Pos:
								type = "ssh-rsa";
								break;
							case sha256Pos:
								type = "rsa-sha2-256";
								break;
							case sha512Pos:
								type = "rsa-sha2-512";
								break;
							default: return;
						}
						hostKeys[type] = privateKey;
						hostKeyAlgoOrder.push(type);
					});
				} else {
					hostKeys[privateKey.type] = privateKey;
					hostKeyAlgoOrder.push(privateKey.type);
				}
			}
			const algorithms = {
				kex: generateAlgorithmList(cfgAlgos.kex, DEFAULT_KEX, SUPPORTED_KEX).concat(["kex-strict-s-v00@openssh.com"]),
				serverHostKey: hostKeyAlgoOrder,
				cs: {
					cipher: generateAlgorithmList(cfgAlgos.cipher, DEFAULT_CIPHER, SUPPORTED_CIPHER),
					mac: generateAlgorithmList(cfgAlgos.hmac, DEFAULT_MAC, SUPPORTED_MAC),
					compress: generateAlgorithmList(cfgAlgos.compress, DEFAULT_COMPRESSION, SUPPORTED_COMPRESSION),
					lang: []
				},
				sc: void 0
			};
			algorithms.sc = algorithms.cs;
			if (typeof listener === "function") this.on("connection", listener);
			const origDebug = typeof cfg.debug === "function" ? cfg.debug : void 0;
			const ident = cfg.ident ? Buffer.from(cfg.ident) : void 0;
			const offer = new KexInit(algorithms);
			this._srv = new netServer((socket) => {
				if (this._connections >= this.maxConnections) {
					socket.destroy();
					return;
				}
				++this._connections;
				socket.once("close", () => {
					--this._connections;
				});
				let debug;
				if (origDebug) {
					const debugPrefix = `[${process.hrtime().join(".")}] `;
					debug = (msg) => {
						origDebug(`${debugPrefix}${msg}`);
					};
				}
				new Client(socket, hostKeys, ident, offer, debug, this, cfg);
			}).on("error", (err) => {
				this.emit("error", err);
			}).on("listening", () => {
				this.emit("listening");
			}).on("close", () => {
				this.emit("close");
			});
			this._connections = 0;
			this.maxConnections = 1e400;
		}
		injectSocket(socket) {
			this._srv.emit("connection", socket);
		}
		listen(...args) {
			this._srv.listen(...args);
			return this;
		}
		address() {
			return this._srv.address();
		}
		getConnections(cb) {
			this._srv.getConnections(cb);
			return this;
		}
		close(cb) {
			this._srv.close(cb);
			return this;
		}
		ref() {
			this._srv.ref();
			return this;
		}
		unref() {
			this._srv.unref();
			return this;
		}
	};
	Server.KEEPALIVE_CLIENT_INTERVAL = 15e3;
	Server.KEEPALIVE_CLIENT_COUNT_MAX = 3;
	var Client = class extends EventEmitter {
		constructor(socket, hostKeys, ident, offer, debug, server, srvCfg) {
			super();
			let exchanges = 0;
			let acceptedAuthSvc = false;
			let pendingAuths = [];
			let authCtx;
			let kaTimer;
			let onPacket;
			const unsentGlobalRequestsReplies = [];
			this._sock = socket;
			this._chanMgr = new ChannelManager(this);
			this._debug = debug;
			this.noMoreSessions = false;
			this.authenticated = false;
			function onClientPreHeaderError(err) {}
			this.on("error", onClientPreHeaderError);
			const DEBUG_HANDLER = !debug ? void 0 : (p, display, msg) => {
				debug(`Debug output from client: ${JSON.stringify(msg)}`);
			};
			const kaIntvl = typeof srvCfg.keepaliveInterval === "number" && isFinite(srvCfg.keepaliveInterval) && srvCfg.keepaliveInterval > 0 ? srvCfg.keepaliveInterval : typeof Server.KEEPALIVE_CLIENT_INTERVAL === "number" && isFinite(Server.KEEPALIVE_CLIENT_INTERVAL) && Server.KEEPALIVE_CLIENT_INTERVAL > 0 ? Server.KEEPALIVE_CLIENT_INTERVAL : -1;
			const kaCountMax = typeof srvCfg.keepaliveCountMax === "number" && isFinite(srvCfg.keepaliveCountMax) && srvCfg.keepaliveCountMax >= 0 ? srvCfg.keepaliveCountMax : typeof Server.KEEPALIVE_CLIENT_COUNT_MAX === "number" && isFinite(Server.KEEPALIVE_CLIENT_COUNT_MAX) && Server.KEEPALIVE_CLIENT_COUNT_MAX >= 0 ? Server.KEEPALIVE_CLIENT_COUNT_MAX : -1;
			let kaCurCount = 0;
			if (kaIntvl !== -1 && kaCountMax !== -1) {
				this.once("ready", () => {
					const onClose = () => {
						clearInterval(kaTimer);
					};
					this.on("close", onClose).on("end", onClose);
					kaTimer = setInterval(() => {
						if (++kaCurCount > kaCountMax) {
							clearInterval(kaTimer);
							const err = /* @__PURE__ */ new Error("Keepalive timeout");
							err.level = "client-timeout";
							this.emit("error", err);
							this.end();
						} else proto.ping();
					}, kaIntvl);
				});
				onPacket = () => {
					kaTimer && kaTimer.refresh();
					kaCurCount = 0;
				};
			}
			const proto = this._protocol = new Protocol({
				server: true,
				hostKeys,
				ident,
				offer,
				onPacket,
				greeting: srvCfg.greeting,
				banner: srvCfg.banner,
				onWrite: (data) => {
					if (isWritable(socket)) socket.write(data);
				},
				onError: (err) => {
					if (!proto._destruct) socket.removeAllListeners("data");
					this.emit("error", err);
					try {
						socket.end();
					} catch {}
				},
				onHeader: (header) => {
					this.removeListener("error", onClientPreHeaderError);
					const info = {
						ip: socket.remoteAddress,
						family: socket.remoteFamily,
						port: socket.remotePort,
						header
					};
					if (!server.emit("connection", this, info)) {
						proto.disconnect(DISCONNECT_REASON.BY_APPLICATION);
						socket.end();
						return;
					}
					if (header.greeting) this.emit("greeting", header.greeting);
				},
				onHandshakeComplete: (negotiated) => {
					if (++exchanges > 1) this.emit("rekey");
					this.emit("handshake", negotiated);
				},
				debug,
				messageHandlers: {
					DEBUG: DEBUG_HANDLER,
					DISCONNECT: (p, reason, desc) => {
						if (reason !== DISCONNECT_REASON.BY_APPLICATION) {
							if (!desc) {
								desc = DISCONNECT_REASON_BY_VALUE[reason];
								if (desc === void 0) desc = `Unexpected disconnection reason: ${reason}`;
							}
							const err = new Error(desc);
							err.code = reason;
							this.emit("error", err);
						}
						socket.end();
					},
					CHANNEL_OPEN: (p, info) => {
						if (info.type === "session" && this.noMoreSessions || !this.authenticated) {
							const reasonCode = CHANNEL_OPEN_FAILURE.ADMINISTRATIVELY_PROHIBITED;
							return proto.channelOpenFail(info.sender, reasonCode);
						}
						let localChan = -1;
						let reason;
						let replied = false;
						let accept;
						const reject = () => {
							if (replied) return;
							replied = true;
							if (reason === void 0) {
								if (localChan === -1) reason = CHANNEL_OPEN_FAILURE.RESOURCE_SHORTAGE;
								else reason = CHANNEL_OPEN_FAILURE.CONNECT_FAILED;
							}
							if (localChan !== -1) this._chanMgr.remove(localChan);
							proto.channelOpenFail(info.sender, reason, "");
						};
						const reserveChannel = () => {
							localChan = this._chanMgr.add();
							if (localChan === -1) {
								reason = CHANNEL_OPEN_FAILURE.RESOURCE_SHORTAGE;
								if (debug) debug("Automatic rejection of incoming channel open: no channels available");
							}
							return localChan !== -1;
						};
						const data = info.data;
						switch (info.type) {
							case "session":
								if (listenerCount(this, "session") && reserveChannel()) {
									accept = () => {
										if (replied) return;
										replied = true;
										const instance = new Session(this, info, localChan);
										this._chanMgr.update(localChan, instance);
										proto.channelOpenConfirm(info.sender, localChan, MAX_WINDOW, PACKET_SIZE);
										return instance;
									};
									this.emit("session", accept, reject);
									return;
								}
								break;
							case "direct-tcpip":
								if (listenerCount(this, "tcpip") && reserveChannel()) {
									accept = () => {
										if (replied) return;
										replied = true;
										const chanInfo = {
											type: void 0,
											incoming: {
												id: localChan,
												window: MAX_WINDOW,
												packetSize: PACKET_SIZE,
												state: "open"
											},
											outgoing: {
												id: info.sender,
												window: info.window,
												packetSize: info.packetSize,
												state: "open"
											}
										};
										const stream = new Channel(this, chanInfo, { server: true });
										this._chanMgr.update(localChan, stream);
										proto.channelOpenConfirm(info.sender, localChan, MAX_WINDOW, PACKET_SIZE);
										return stream;
									};
									this.emit("tcpip", accept, reject, data);
									return;
								}
								break;
							case "direct-streamlocal@openssh.com":
								if (listenerCount(this, "openssh.streamlocal") && reserveChannel()) {
									accept = () => {
										if (replied) return;
										replied = true;
										const chanInfo = {
											type: void 0,
											incoming: {
												id: localChan,
												window: MAX_WINDOW,
												packetSize: PACKET_SIZE,
												state: "open"
											},
											outgoing: {
												id: info.sender,
												window: info.window,
												packetSize: info.packetSize,
												state: "open"
											}
										};
										const stream = new Channel(this, chanInfo, { server: true });
										this._chanMgr.update(localChan, stream);
										proto.channelOpenConfirm(info.sender, localChan, MAX_WINDOW, PACKET_SIZE);
										return stream;
									};
									this.emit("openssh.streamlocal", accept, reject, data);
									return;
								}
								break;
							default:
								reason = CHANNEL_OPEN_FAILURE.UNKNOWN_CHANNEL_TYPE;
								if (debug) debug(`Automatic rejection of unsupported incoming channel open type: ${info.type}`);
						}
						if (reason === void 0) {
							reason = CHANNEL_OPEN_FAILURE.ADMINISTRATIVELY_PROHIBITED;
							if (debug) debug(`Automatic rejection of unexpected incoming channel open for: ${info.type}`);
						}
						reject();
					},
					CHANNEL_OPEN_CONFIRMATION: (p, info) => {
						const channel = this._chanMgr.get(info.recipient);
						if (typeof channel !== "function") return;
						const chanInfo = {
							type: channel.type,
							incoming: {
								id: info.recipient,
								window: MAX_WINDOW,
								packetSize: PACKET_SIZE,
								state: "open"
							},
							outgoing: {
								id: info.sender,
								window: info.window,
								packetSize: info.packetSize,
								state: "open"
							}
						};
						const instance = new Channel(this, chanInfo, { server: true });
						this._chanMgr.update(info.recipient, instance);
						channel(void 0, instance);
					},
					CHANNEL_OPEN_FAILURE: (p, recipient, reason, description) => {
						const channel = this._chanMgr.get(recipient);
						if (typeof channel !== "function") return;
						const info = {
							reason,
							description
						};
						onChannelOpenFailure(this, recipient, info, channel);
					},
					CHANNEL_DATA: (p, recipient, data) => {
						let channel = this._chanMgr.get(recipient);
						if (typeof channel !== "object" || channel === null) return;
						if (channel.constructor === Session) {
							channel = channel._channel;
							if (!channel) return;
						}
						if (channel.incoming.window === 0) return;
						channel.incoming.window -= data.length;
						if (channel.push(data) === false) {
							channel._waitChanDrain = true;
							return;
						}
						if (channel.incoming.window <= WINDOW_THRESHOLD) windowAdjust(channel);
					},
					CHANNEL_EXTENDED_DATA: (p, recipient, data, type) => {},
					CHANNEL_WINDOW_ADJUST: (p, recipient, amount) => {
						let channel = this._chanMgr.get(recipient);
						if (typeof channel !== "object" || channel === null) return;
						if (channel.constructor === Session) {
							channel = channel._channel;
							if (!channel) return;
						}
						channel.outgoing.window += amount;
						if (channel._waitWindow) {
							channel._waitWindow = false;
							if (channel._chunk) channel._write(channel._chunk, null, channel._chunkcb);
							else if (channel._chunkcb) channel._chunkcb();
							else if (channel._chunkErr) channel.stderr._write(channel._chunkErr, null, channel._chunkcbErr);
							else if (channel._chunkcbErr) channel._chunkcbErr();
						}
					},
					CHANNEL_SUCCESS: (p, recipient) => {
						let channel = this._chanMgr.get(recipient);
						if (typeof channel !== "object" || channel === null) return;
						if (channel.constructor === Session) {
							channel = channel._channel;
							if (!channel) return;
						}
						if (channel._callbacks.length) channel._callbacks.shift()(false);
					},
					CHANNEL_FAILURE: (p, recipient) => {
						let channel = this._chanMgr.get(recipient);
						if (typeof channel !== "object" || channel === null) return;
						if (channel.constructor === Session) {
							channel = channel._channel;
							if (!channel) return;
						}
						if (channel._callbacks.length) channel._callbacks.shift()(true);
					},
					CHANNEL_REQUEST: (p, recipient, type, wantReply, data) => {
						const session = this._chanMgr.get(recipient);
						if (typeof session !== "object" || session === null) return;
						let replied = false;
						let accept;
						let reject;
						if (session.constructor !== Session) {
							if (wantReply) proto.channelFailure(session.outgoing.id);
							return;
						}
						if (wantReply) {
							if (type !== "shell" && type !== "exec" && type !== "subsystem") accept = () => {
								if (replied || session._ending || session._channel) return;
								replied = true;
								proto.channelSuccess(session._chanInfo.outgoing.id);
							};
							reject = () => {
								if (replied || session._ending || session._channel) return;
								replied = true;
								proto.channelFailure(session._chanInfo.outgoing.id);
							};
						}
						if (session._ending) {
							reject && reject();
							return;
						}
						switch (type) {
							case "env":
								if (listenerCount(session, "env")) {
									session.emit("env", accept, reject, {
										key: data.name,
										val: data.value
									});
									return;
								}
								break;
							case "pty-req":
								if (listenerCount(session, "pty")) {
									session.emit("pty", accept, reject, data);
									return;
								}
								break;
							case "window-change":
								if (listenerCount(session, "window-change")) session.emit("window-change", accept, reject, data);
								else reject && reject();
								break;
							case "x11-req":
								if (listenerCount(session, "x11")) {
									session.emit("x11", accept, reject, data);
									return;
								}
								break;
							case "signal":
								if (listenerCount(session, "signal")) {
									session.emit("signal", accept, reject, { name: data });
									return;
								}
								break;
							case "auth-agent-req@openssh.com":
								if (listenerCount(session, "auth-agent")) {
									session.emit("auth-agent", accept, reject);
									return;
								}
								break;
							case "shell":
								if (listenerCount(session, "shell")) {
									accept = () => {
										if (replied || session._ending || session._channel) return;
										replied = true;
										if (wantReply) proto.channelSuccess(session._chanInfo.outgoing.id);
										const channel = new Channel(this, session._chanInfo, { server: true });
										channel.subtype = session.subtype = type;
										session._channel = channel;
										return channel;
									};
									session.emit("shell", accept, reject);
									return;
								}
								break;
							case "exec":
								if (listenerCount(session, "exec")) {
									accept = () => {
										if (replied || session._ending || session._channel) return;
										replied = true;
										if (wantReply) proto.channelSuccess(session._chanInfo.outgoing.id);
										const channel = new Channel(this, session._chanInfo, { server: true });
										channel.subtype = session.subtype = type;
										session._channel = channel;
										return channel;
									};
									session.emit("exec", accept, reject, { command: data });
									return;
								}
								break;
							case "subsystem": {
								let useSFTP = data === "sftp";
								accept = () => {
									if (replied || session._ending || session._channel) return;
									replied = true;
									if (wantReply) proto.channelSuccess(session._chanInfo.outgoing.id);
									let instance;
									if (useSFTP) instance = new SFTP(this, session._chanInfo, {
										server: true,
										debug
									});
									else {
										instance = new Channel(this, session._chanInfo, { server: true });
										instance.subtype = session.subtype = `${type}:${data}`;
									}
									session._channel = instance;
									return instance;
								};
								if (data === "sftp") {
									if (listenerCount(session, "sftp")) {
										session.emit("sftp", accept, reject);
										return;
									}
									useSFTP = false;
								}
								if (listenerCount(session, "subsystem")) {
									session.emit("subsystem", accept, reject, { name: data });
									return;
								}
								break;
							}
						}
						debug && debug(`Automatic rejection of incoming channel request: ${type}`);
						reject && reject();
					},
					CHANNEL_EOF: (p, recipient) => {
						let channel = this._chanMgr.get(recipient);
						if (typeof channel !== "object" || channel === null) return;
						if (channel.constructor === Session) {
							if (!channel._ending) {
								channel._ending = true;
								channel.emit("eof");
								channel.emit("end");
							}
							channel = channel._channel;
							if (!channel) return;
						}
						if (channel.incoming.state !== "open") return;
						channel.incoming.state = "eof";
						if (channel.readable) channel.push(null);
					},
					CHANNEL_CLOSE: (p, recipient) => {
						let channel = this._chanMgr.get(recipient);
						if (typeof channel !== "object" || channel === null) return;
						if (channel.constructor === Session) {
							channel._ending = true;
							channel.emit("close");
							channel = channel._channel;
							if (!channel) return;
						}
						onCHANNEL_CLOSE(this, recipient, channel);
					},
					SERVICE_REQUEST: (p, service) => {
						if (exchanges === 0 || acceptedAuthSvc || this.authenticated || service !== "ssh-userauth") {
							proto.disconnect(DISCONNECT_REASON.SERVICE_NOT_AVAILABLE);
							socket.end();
							return;
						}
						acceptedAuthSvc = true;
						proto.serviceAccept(service);
					},
					USERAUTH_REQUEST: (p, username, service, method, methodData) => {
						if (exchanges === 0 || this.authenticated || authCtx && (authCtx.username !== username || authCtx.service !== service) || method !== "password" && method !== "publickey" && method !== "hostbased" && method !== "keyboard-interactive" && method !== "none" || pendingAuths.length === MAX_PENDING_AUTHS) {
							proto.disconnect(DISCONNECT_REASON.PROTOCOL_ERROR);
							socket.end();
							return;
						} else if (service !== "ssh-connection") {
							proto.disconnect(DISCONNECT_REASON.SERVICE_NOT_AVAILABLE);
							socket.end();
							return;
						}
						let ctx;
						switch (method) {
							case "keyboard-interactive":
								ctx = new KeyboardAuthContext(proto, username, service, method, methodData, onAuthDecide);
								break;
							case "publickey":
								ctx = new PKAuthContext(proto, username, service, method, methodData, onAuthDecide);
								break;
							case "hostbased":
								ctx = new HostbasedAuthContext(proto, username, service, method, methodData, onAuthDecide);
								break;
							case "password":
								if (authCtx && authCtx instanceof PwdAuthContext && authCtx._changeCb) {
									const cb = authCtx._changeCb;
									authCtx._changeCb = void 0;
									cb(methodData.newPassword);
									return;
								}
								ctx = new PwdAuthContext(proto, username, service, method, methodData, onAuthDecide);
								break;
							case "none": ctx = new AuthContext(proto, username, service, method, onAuthDecide);
						}
						if (authCtx) {
							if (!authCtx._initialResponse) return pendingAuths.push(ctx);
							else if (authCtx._multistep && !authCtx._finalResponse) {
								authCtx._cleanup && authCtx._cleanup();
								authCtx.emit("abort");
							}
						}
						authCtx = ctx;
						if (listenerCount(this, "authentication")) this.emit("authentication", authCtx);
						else authCtx.reject();
					},
					USERAUTH_INFO_RESPONSE: (p, responses) => {
						if (authCtx && authCtx instanceof KeyboardAuthContext) authCtx._onInfoResponse(responses);
					},
					GLOBAL_REQUEST: (p, name, wantReply, data) => {
						const reply = {
							type: null,
							buf: null
						};
						function setReply(type, buf) {
							reply.type = type;
							reply.buf = buf;
							sendReplies();
						}
						if (wantReply) unsentGlobalRequestsReplies.push(reply);
						if ((name === "tcpip-forward" || name === "cancel-tcpip-forward" || name === "no-more-sessions@openssh.com" || name === "streamlocal-forward@openssh.com" || name === "cancel-streamlocal-forward@openssh.com") && listenerCount(this, "request") && this.authenticated) {
							let accept;
							let reject;
							if (wantReply) {
								let replied = false;
								accept = (chosenPort) => {
									if (replied) return;
									replied = true;
									let bufPort;
									if (name === "tcpip-forward" && data.bindPort === 0 && typeof chosenPort === "number") {
										bufPort = Buffer.allocUnsafe(4);
										writeUInt32BE(bufPort, chosenPort, 0);
									}
									setReply("SUCCESS", bufPort);
								};
								reject = () => {
									if (replied) return;
									replied = true;
									setReply("FAILURE");
								};
							}
							if (name === "no-more-sessions@openssh.com") {
								this.noMoreSessions = true;
								accept && accept();
								return;
							}
							this.emit("request", accept, reject, name, data);
						} else if (wantReply) setReply("FAILURE");
					}
				}
			});
			socket.pause();
			cryptoInit.then(() => {
				proto.start();
				socket.on("data", (data) => {
					try {
						proto.parse(data, 0, data.length);
					} catch (ex) {
						this.emit("error", ex);
						try {
							if (isWritable(socket)) socket.end();
						} catch {}
					}
				});
				socket.resume();
			}).catch((err) => {
				this.emit("error", err);
				try {
					if (isWritable(socket)) socket.end();
				} catch {}
			});
			socket.on("error", (err) => {
				err.level = "socket";
				this.emit("error", err);
			}).once("end", () => {
				debug && debug("Socket ended");
				proto.cleanup();
				this.emit("end");
			}).once("close", () => {
				debug && debug("Socket closed");
				proto.cleanup();
				this.emit("close");
				const err = /* @__PURE__ */ new Error("No response from server");
				this._chanMgr.cleanup(err);
			});
			const onAuthDecide = (ctx, allowed, methodsLeft, isPartial) => {
				if (authCtx === ctx && !this.authenticated) {
					if (allowed) {
						authCtx = void 0;
						this.authenticated = true;
						proto.authSuccess();
						pendingAuths = [];
						this.emit("ready");
					} else {
						proto.authFailure(methodsLeft, isPartial);
						if (pendingAuths.length) {
							authCtx = pendingAuths.pop();
							if (listenerCount(this, "authentication")) this.emit("authentication", authCtx);
							else authCtx.reject();
						}
					}
				}
			};
			function sendReplies() {
				while (unsentGlobalRequestsReplies.length > 0 && unsentGlobalRequestsReplies[0].type) {
					const reply = unsentGlobalRequestsReplies.shift();
					if (reply.type === "SUCCESS") proto.requestSuccess(reply.buf);
					if (reply.type === "FAILURE") proto.requestFailure();
				}
			}
		}
		end() {
			if (this._sock && isWritable(this._sock)) {
				this._protocol.disconnect(DISCONNECT_REASON.BY_APPLICATION);
				this._sock.end();
			}
			return this;
		}
		x11(originAddr, originPort, cb) {
			const opts = {
				originAddr,
				originPort
			};
			openChannel(this, "x11", opts, cb);
			return this;
		}
		forwardOut(boundAddr, boundPort, remoteAddr, remotePort, cb) {
			const opts = {
				boundAddr,
				boundPort,
				remoteAddr,
				remotePort
			};
			openChannel(this, "forwarded-tcpip", opts, cb);
			return this;
		}
		openssh_forwardOutStreamLocal(socketPath, cb) {
			const opts = { socketPath };
			openChannel(this, "forwarded-streamlocal@openssh.com", opts, cb);
			return this;
		}
		rekey(cb) {
			let error;
			try {
				this._protocol.rekey();
			} catch (ex) {
				error = ex;
			}
			if (typeof cb === "function") {
				if (error) process.nextTick(cb, error);
				else this.once("rekey", cb);
			}
		}
		setNoDelay(noDelay) {
			if (this._sock && typeof this._sock.setNoDelay === "function") this._sock.setNoDelay(noDelay);
			return this;
		}
	};
	function openChannel(self, type, opts, cb) {
		const initWindow = MAX_WINDOW;
		const maxPacket = PACKET_SIZE;
		if (typeof opts === "function") {
			cb = opts;
			opts = {};
		}
		const wrapper = (err, stream) => {
			cb(err, stream);
		};
		wrapper.type = type;
		const localChan = self._chanMgr.add(wrapper);
		if (localChan === -1) {
			cb(/* @__PURE__ */ new Error("No free channels available"));
			return;
		}
		switch (type) {
			case "forwarded-tcpip":
				self._protocol.forwardedTcpip(localChan, initWindow, maxPacket, opts);
				break;
			case "x11":
				self._protocol.x11(localChan, initWindow, maxPacket, opts);
				break;
			case "forwarded-streamlocal@openssh.com":
				self._protocol.openssh_forwardedStreamLocal(localChan, initWindow, maxPacket, opts);
				break;
			default: throw new Error(`Unsupported channel type: ${type}`);
		}
	}
	function compareNumbers(a, b) {
		return a - b;
	}
	module.exports = Server;
	module.exports.IncomingClient = Client;
}));
// node_modules/ssh2/lib/keygen.js
var require_keygen = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const { createCipheriv, generateKeyPair: generateKeyPair_, generateKeyPairSync: generateKeyPairSync_, getCurves, randomBytes } = __require("crypto");
	const { Ber } = require_lib$2();
	const bcrypt_pbkdf = require_bcrypt_pbkdf().pbkdf;
	const { CIPHER_INFO } = require_crypto();
	const SALT_LEN = 16;
	const DEFAULT_ROUNDS = 16;
	const curves = getCurves();
	const ciphers = new Map(Object.entries(CIPHER_INFO));
	function makeArgs(type, opts) {
		if (typeof type !== "string") throw new TypeError("Key type must be a string");
		const publicKeyEncoding = {
			type: "spki",
			format: "der"
		};
		const privateKeyEncoding = {
			type: "pkcs8",
			format: "der"
		};
		switch (type.toLowerCase()) {
			case "rsa": {
				if (typeof opts !== "object" || opts === null) throw new TypeError("Missing options object for RSA key");
				const modulusLength = opts.bits;
				if (!Number.isInteger(modulusLength)) throw new TypeError("RSA bits must be an integer");
				if (modulusLength <= 0 || modulusLength > 16384) throw new RangeError("RSA bits must be non-zero and <= 16384");
				return ["rsa", {
					modulusLength,
					publicKeyEncoding,
					privateKeyEncoding
				}];
			}
			case "ecdsa": {
				if (typeof opts !== "object" || opts === null) throw new TypeError("Missing options object for ECDSA key");
				if (!Number.isInteger(opts.bits)) throw new TypeError("ECDSA bits must be an integer");
				let namedCurve;
				switch (opts.bits) {
					case 256:
						namedCurve = "prime256v1";
						break;
					case 384:
						namedCurve = "secp384r1";
						break;
					case 521:
						namedCurve = "secp521r1";
						break;
					default: throw new Error("ECDSA bits must be 256, 384, or 521");
				}
				if (!curves.includes(namedCurve)) throw new Error("Unsupported ECDSA bits value");
				return ["ec", {
					namedCurve,
					publicKeyEncoding,
					privateKeyEncoding
				}];
			}
			case "ed25519": return ["ed25519", {
				publicKeyEncoding,
				privateKeyEncoding
			}];
			default: throw new Error(`Unsupported key type: ${type}`);
		}
	}
	function parseDERs(keyType, pub, priv) {
		switch (keyType) {
			case "rsa": {
				let reader = new Ber.Reader(priv);
				reader.readSequence();
				if (reader.readInt() !== 0) throw new Error("Unsupported version in RSA private key");
				reader.readSequence();
				if (reader.readOID() !== "1.2.840.113549.1.1.1") throw new Error("Bad RSA private OID");
				if (reader.readByte() !== Ber.Null) throw new Error("Malformed RSA private key (expected null)");
				if (reader.readByte() !== 0) throw new Error("Malformed RSA private key (expected zero-length null)");
				reader = new Ber.Reader(reader.readString(Ber.OctetString, true));
				reader.readSequence();
				if (reader.readInt() !== 0) throw new Error("Unsupported version in RSA private key");
				const n = reader.readString(Ber.Integer, true);
				const e = reader.readString(Ber.Integer, true);
				const d = reader.readString(Ber.Integer, true);
				const p = reader.readString(Ber.Integer, true);
				const q = reader.readString(Ber.Integer, true);
				reader.readString(Ber.Integer, true);
				reader.readString(Ber.Integer, true);
				const iqmp = reader.readString(Ber.Integer, true);
				const keyName = Buffer.from("ssh-rsa");
				const privBuf = Buffer.allocUnsafe(4 + keyName.length + 4 + n.length + 4 + e.length + 4 + d.length + 4 + iqmp.length + 4 + p.length + 4 + q.length);
				let pos = 0;
				privBuf.writeUInt32BE(keyName.length, pos += 0);
				privBuf.set(keyName, pos += 4);
				privBuf.writeUInt32BE(n.length, pos += keyName.length);
				privBuf.set(n, pos += 4);
				privBuf.writeUInt32BE(e.length, pos += n.length);
				privBuf.set(e, pos += 4);
				privBuf.writeUInt32BE(d.length, pos += e.length);
				privBuf.set(d, pos += 4);
				privBuf.writeUInt32BE(iqmp.length, pos += d.length);
				privBuf.set(iqmp, pos += 4);
				privBuf.writeUInt32BE(p.length, pos += iqmp.length);
				privBuf.set(p, pos += 4);
				privBuf.writeUInt32BE(q.length, pos += p.length);
				privBuf.set(q, pos += 4);
				const pubBuf = Buffer.allocUnsafe(4 + keyName.length + 4 + e.length + 4 + n.length);
				pos = 0;
				pubBuf.writeUInt32BE(keyName.length, pos += 0);
				pubBuf.set(keyName, pos += 4);
				pubBuf.writeUInt32BE(e.length, pos += keyName.length);
				pubBuf.set(e, pos += 4);
				pubBuf.writeUInt32BE(n.length, pos += e.length);
				pubBuf.set(n, pos += 4);
				return {
					sshName: keyName.toString(),
					priv: privBuf,
					pub: pubBuf
				};
			}
			case "ec": {
				let reader = new Ber.Reader(pub);
				reader.readSequence();
				reader.readSequence();
				if (reader.readOID() !== "1.2.840.10045.2.1") throw new Error("Bad ECDSA public OID");
				reader.readOID();
				let pubBin = reader.readString(Ber.BitString, true);
				{
					let i = 0;
					for (; i < pubBin.length && pubBin[i] === 0; ++i);
					if (i > 0) pubBin = pubBin.slice(i);
				}
				reader = new Ber.Reader(priv);
				reader.readSequence();
				if (reader.readInt() !== 0) throw new Error("Unsupported version in ECDSA private key");
				reader.readSequence();
				if (reader.readOID() !== "1.2.840.10045.2.1") throw new Error("Bad ECDSA private OID");
				const curveOID = reader.readOID();
				let sshCurveName;
				switch (curveOID) {
					case "1.2.840.10045.3.1.7":
						sshCurveName = "nistp256";
						break;
					case "1.3.132.0.34":
						sshCurveName = "nistp384";
						break;
					case "1.3.132.0.35":
						sshCurveName = "nistp521";
						break;
					default: throw new Error("Unsupported curve in ECDSA private key");
				}
				reader = new Ber.Reader(reader.readString(Ber.OctetString, true));
				reader.readSequence();
				if (reader.readInt() !== 1) throw new Error("Unsupported version in ECDSA private key");
				const privBin = Buffer.concat([Buffer.from([0]), reader.readString(Ber.OctetString, true)]);
				const keyName = Buffer.from(`ecdsa-sha2-${sshCurveName}`);
				sshCurveName = Buffer.from(sshCurveName);
				const privBuf = Buffer.allocUnsafe(4 + keyName.length + 4 + sshCurveName.length + 4 + pubBin.length + 4 + privBin.length);
				let pos = 0;
				privBuf.writeUInt32BE(keyName.length, pos += 0);
				privBuf.set(keyName, pos += 4);
				privBuf.writeUInt32BE(sshCurveName.length, pos += keyName.length);
				privBuf.set(sshCurveName, pos += 4);
				privBuf.writeUInt32BE(pubBin.length, pos += sshCurveName.length);
				privBuf.set(pubBin, pos += 4);
				privBuf.writeUInt32BE(privBin.length, pos += pubBin.length);
				privBuf.set(privBin, pos += 4);
				const pubBuf = Buffer.allocUnsafe(4 + keyName.length + 4 + sshCurveName.length + 4 + pubBin.length);
				pos = 0;
				pubBuf.writeUInt32BE(keyName.length, pos += 0);
				pubBuf.set(keyName, pos += 4);
				pubBuf.writeUInt32BE(sshCurveName.length, pos += keyName.length);
				pubBuf.set(sshCurveName, pos += 4);
				pubBuf.writeUInt32BE(pubBin.length, pos += sshCurveName.length);
				pubBuf.set(pubBin, pos += 4);
				return {
					sshName: keyName.toString(),
					priv: privBuf,
					pub: pubBuf
				};
			}
			case "ed25519": {
				let reader = new Ber.Reader(pub);
				reader.readSequence();
				reader.readSequence();
				if (reader.readOID() !== "1.3.101.112") throw new Error("Bad ED25519 public OID");
				let pubBin = reader.readString(Ber.BitString, true);
				{
					let i = 0;
					for (; i < pubBin.length && pubBin[i] === 0; ++i);
					if (i > 0) pubBin = pubBin.slice(i);
				}
				reader = new Ber.Reader(priv);
				reader.readSequence();
				if (reader.readInt() !== 0) throw new Error("Unsupported version in ED25519 private key");
				reader.readSequence();
				if (reader.readOID() !== "1.3.101.112") throw new Error("Bad ED25519 private OID");
				reader = new Ber.Reader(reader.readString(Ber.OctetString, true));
				const privBin = reader.readString(Ber.OctetString, true);
				const keyName = Buffer.from("ssh-ed25519");
				const privBuf = Buffer.allocUnsafe(4 + keyName.length + 4 + pubBin.length + 4 + (privBin.length + pubBin.length));
				let pos = 0;
				privBuf.writeUInt32BE(keyName.length, pos += 0);
				privBuf.set(keyName, pos += 4);
				privBuf.writeUInt32BE(pubBin.length, pos += keyName.length);
				privBuf.set(pubBin, pos += 4);
				privBuf.writeUInt32BE(privBin.length + pubBin.length, pos += pubBin.length);
				privBuf.set(privBin, pos += 4);
				privBuf.set(pubBin, pos += privBin.length);
				const pubBuf = Buffer.allocUnsafe(4 + keyName.length + 4 + pubBin.length);
				pos = 0;
				pubBuf.writeUInt32BE(keyName.length, pos += 0);
				pubBuf.set(keyName, pos += 4);
				pubBuf.writeUInt32BE(pubBin.length, pos += keyName.length);
				pubBuf.set(pubBin, pos += 4);
				return {
					sshName: keyName.toString(),
					priv: privBuf,
					pub: pubBuf
				};
			}
		}
	}
	function convertKeys(keyType, pub, priv, opts) {
		let format = "new";
		let encrypted;
		let comment = "";
		if (typeof opts === "object" && opts !== null) {
			if (typeof opts.comment === "string" && opts.comment) comment = opts.comment;
			if (typeof opts.format === "string" && opts.format) format = opts.format;
			if (opts.passphrase) {
				let passphrase;
				if (typeof opts.passphrase === "string") passphrase = Buffer.from(opts.passphrase);
				else if (Buffer.isBuffer(opts.passphrase)) passphrase = opts.passphrase;
				else throw new Error("Invalid passphrase");
				if (opts.cipher === void 0) throw new Error("Missing cipher name");
				const cipher = ciphers.get(opts.cipher);
				if (cipher === void 0) throw new Error("Invalid cipher name");
				if (format === "new") {
					let rounds = DEFAULT_ROUNDS;
					if (opts.rounds !== void 0) {
						if (!Number.isInteger(opts.rounds)) throw new TypeError("rounds must be an integer");
						if (opts.rounds > 0) rounds = opts.rounds;
					}
					const gen = Buffer.allocUnsafe(cipher.keyLen + cipher.ivLen);
					const salt = randomBytes(SALT_LEN);
					if (bcrypt_pbkdf(passphrase, passphrase.length, salt, salt.length, gen, gen.length, rounds) !== 0) return /* @__PURE__ */ new Error("Failed to generate information to encrypt key");
					const kdfOptions = Buffer.allocUnsafe(4 + salt.length + 4);
					{
						let pos = 0;
						kdfOptions.writeUInt32BE(salt.length, pos += 0);
						kdfOptions.set(salt, pos += 4);
						kdfOptions.writeUInt32BE(rounds, pos += salt.length);
					}
					encrypted = {
						cipher,
						cipherName: opts.cipher,
						kdfName: "bcrypt",
						kdfOptions,
						key: gen.slice(0, cipher.keyLen),
						iv: gen.slice(cipher.keyLen)
					};
				}
			}
		}
		switch (format) {
			case "new": {
				let privateB64 = "-----BEGIN OPENSSH PRIVATE KEY-----\n";
				let publicB64;
				const cipherName = Buffer.from(encrypted ? encrypted.cipherName : "none");
				const kdfName = Buffer.from(encrypted ? encrypted.kdfName : "none");
				const kdfOptions = encrypted ? encrypted.kdfOptions : Buffer.alloc(0);
				const blockLen = encrypted ? encrypted.cipher.blockLen : 8;
				const parsed = parseDERs(keyType, pub, priv);
				const checkInt = randomBytes(4);
				const commentBin = Buffer.from(comment);
				const privBlobLen = 8 + parsed.priv.length + 4 + commentBin.length;
				let padding = [];
				for (let i = 1; (privBlobLen + padding.length) % blockLen; ++i) padding.push(i & 255);
				padding = Buffer.from(padding);
				let privBlob = Buffer.allocUnsafe(privBlobLen + padding.length);
				let extra;
				{
					let pos = 0;
					privBlob.set(checkInt, pos += 0);
					privBlob.set(checkInt, pos += 4);
					privBlob.set(parsed.priv, pos += 4);
					privBlob.writeUInt32BE(commentBin.length, pos += parsed.priv.length);
					privBlob.set(commentBin, pos += 4);
					privBlob.set(padding, pos += commentBin.length);
				}
				if (encrypted) {
					const options = { authTagLength: encrypted.cipher.authLen };
					const cipher = createCipheriv(encrypted.cipher.sslName, encrypted.key, encrypted.iv, options);
					cipher.setAutoPadding(false);
					privBlob = Buffer.concat([cipher.update(privBlob), cipher.final()]);
					if (encrypted.cipher.authLen > 0) extra = cipher.getAuthTag();
					else extra = Buffer.alloc(0);
					encrypted.key.fill(0);
					encrypted.iv.fill(0);
				} else extra = Buffer.alloc(0);
				const magicBytes = Buffer.from("openssh-key-v1\0");
				const privBin = Buffer.allocUnsafe(magicBytes.length + 4 + cipherName.length + 4 + kdfName.length + 4 + kdfOptions.length + 4 + 4 + parsed.pub.length + 4 + privBlob.length + extra.length);
				{
					let pos = 0;
					privBin.set(magicBytes, pos += 0);
					privBin.writeUInt32BE(cipherName.length, pos += magicBytes.length);
					privBin.set(cipherName, pos += 4);
					privBin.writeUInt32BE(kdfName.length, pos += cipherName.length);
					privBin.set(kdfName, pos += 4);
					privBin.writeUInt32BE(kdfOptions.length, pos += kdfName.length);
					privBin.set(kdfOptions, pos += 4);
					privBin.writeUInt32BE(1, pos += kdfOptions.length);
					privBin.writeUInt32BE(parsed.pub.length, pos += 4);
					privBin.set(parsed.pub, pos += 4);
					privBin.writeUInt32BE(privBlob.length, pos += parsed.pub.length);
					privBin.set(privBlob, pos += 4);
					privBin.set(extra, pos += privBlob.length);
				}
				{
					const b64 = privBin.base64Slice(0, privBin.length);
					let formatted = b64.replace(/.{64}/g, "$&\n");
					if (b64.length & 63) formatted += "\n";
					privateB64 += formatted;
				}
				{
					const b64 = parsed.pub.base64Slice(0, parsed.pub.length);
					publicB64 = `${parsed.sshName} ${b64}${comment ? ` ${comment}` : ""}`;
				}
				privateB64 += "-----END OPENSSH PRIVATE KEY-----\n";
				return {
					private: privateB64,
					public: publicB64
				};
			}
			default: throw new Error("Invalid output key format");
		}
	}
	function noop() {}
	module.exports = {
		generateKeyPair: (keyType, opts, cb) => {
			if (typeof opts === "function") {
				cb = opts;
				opts = void 0;
			}
			if (typeof cb !== "function") cb = noop;
			const args = makeArgs(keyType, opts);
			generateKeyPair_(...args, (err, pub, priv) => {
				if (err) return cb(err);
				let ret;
				try {
					ret = convertKeys(args[0], pub, priv, opts);
				} catch (ex) {
					return cb(ex);
				}
				cb(null, ret);
			});
		},
		generateKeyPairSync: (keyType, opts) => {
			const args = makeArgs(keyType, opts);
			const { publicKey: pub, privateKey: priv } = generateKeyPairSync_(...args);
			return convertKeys(args[0], pub, priv, opts);
		}
	};
}));
// node_modules/ssh2/lib/index.js
var require_lib = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const { AgentProtocol, BaseAgent, createAgent, CygwinAgent, OpenSSHAgent, PageantAgent } = require_agent();
	const { SSHTTPAgent: HTTPAgent, SSHTTPSAgent: HTTPSAgent } = require_http_agents();
	const { parseKey } = require_keyParser();
	const { flagsToString, OPEN_MODE, STATUS_CODE, stringToFlags } = require_SFTP();
	module.exports = {
		AgentProtocol,
		BaseAgent,
		createAgent,
		Client: require_client(),
		CygwinAgent,
		HTTPAgent,
		HTTPSAgent,
		OpenSSHAgent,
		PageantAgent,
		Server: require_server(),
		utils: {
			parseKey,
			...require_keygen(),
			sftp: {
				flagsToString,
				OPEN_MODE,
				STATUS_CODE,
				stringToFlags
			}
		}
	};
}));
// node_modules/node-ssh/lib/index.mjs
var import_shell_escape = /* @__PURE__ */ __toESM(require_shell_escape(), 1);
var import_lib = /* @__PURE__ */ __toESM(require_lib(), 1);
const DEFAULT_CONCURRENCY = 1;
const DEFAULT_VALIDATE = (path) => !fsPath.basename(path).startsWith(".");
const DEFAULT_TICK = () => {};
var SSHError = class extends Error {
	constructor(message, code = null) {
		super(message);
		this.code = code;
	}
};
function isReadableStream(value) {
	const candidate = value;
	return candidate !== null && typeof candidate === "object" && typeof candidate.pipe === "function" && candidate.readable !== false && typeof candidate._read === "function" && typeof candidate._readableState === "object";
}
function isAbortSignal(value) {
	const candidate = value;
	return candidate !== null && typeof candidate === "object" && typeof candidate.aborted === "boolean" && typeof candidate.addEventListener === "function" && typeof candidate.removeEventListener === "function";
}
const SSH_SIGNALS = [
	"ABRT",
	"ALRM",
	"FPE",
	"HUP",
	"ILL",
	"INT",
	"KILL",
	"PIPE",
	"QUIT",
	"SEGV",
	"TERM",
	"USR1",
	"USR2"
];
const MAX_TIMEOUT = 2 ** 31 - 1;
function getSshSignalName(name) {
	if (typeof name !== "string") return null;
	const upperCase = name.toUpperCase();
	const signalName = upperCase.startsWith("SIG") ? upperCase.slice(3) : upperCase;
	return SSH_SIGNALS.includes(signalName) ? signalName : null;
}
function stopRemoteCommand(connection, channel, signalName) {
	const { outgoing } = channel;
	const protocol = connection._protocol;
	if (outgoing.state === "open" || outgoing.state === "eof") {
		if (protocol != null) protocol.signal(outgoing.id, signalName);
		else channel.signal(signalName);
	}
	channel.close();
}
function explainSftpStartError(error) {
	const packetLength = /^Packet length (\d+) exceeds max length/.exec(error.message);
	if (packetLength != null) {
		const start = Buffer.alloc(4);
		start.writeUInt32BE(Number(packetLength[1]));
		const text = start.toString("latin1");
		if (/^[\x20-\x7e]{4}$/.test(text)) error.message += `. The server sent text starting with "${text}" instead of SFTP data, usually from a forced command in authorized_keys or from output in the remote shell's startup files (such as ~/.bashrc)`;
	} else if (/^Received exit code \d+ while establishing SFTP session$/.test(error.message)) error.message += ". The SFTP server program exited before SFTP started; check the \"Subsystem sftp\" line in the server's sshd_config";
	return error;
}
function escapeCwd(cwd) {
	if (cwd === "~") return "~";
	if (cwd.startsWith("~/")) return `~/${(0, import_shell_escape.default)([cwd.slice(2)])}`;
	return (0, import_shell_escape.default)([cwd]);
}
const DISPOSE_SFTP_CLOSE_TIMEOUT = 2e3;
function trackSftpCloses(sftp, pending) {
	const close = sftp.close.bind(sftp);
	sftp.close = (handle, callback) => {
		let settle = DEFAULT_TICK;
		const reply = new Promise((resolve) => {
			settle = resolve;
		});
		pending.add(reply);
		close(handle, (err) => {
			pending.delete(reply);
			settle();
			if (typeof callback === "function") callback(err);
		});
	};
}
function unixifyPath(path) {
	if (path.includes("\\")) return path.split("\\").join("/");
	return path;
}
async function readFile(filePath) {
	return new Promise((resolve, reject) => {
		fs$1.readFile(filePath, "utf8", (err, res) => {
			if (err) reject(err);
			else resolve(res);
		});
	});
}
const SFTP_MKDIR_ERR_CODE_REGEXP = /Error: (E[\S]+): /;
async function makeDirectoryWithSftp(path, sftp) {
	let stats = null;
	try {
		stats = await new Promise((resolve, reject) => {
			sftp.stat(path, (err, res) => {
				if (err) reject(err);
				else resolve(res);
			});
		});
	} catch (_) {}
	if (stats) {
		if (stats.isDirectory()) return;
		throw new Error("mkdir() failed, target already exists and is not a directory");
	}
	try {
		await new Promise((resolve, reject) => {
			sftp.mkdir(path, (err) => {
				if (err) reject(err);
				else resolve();
			});
		});
	} catch (err) {
		if (err != null && typeof err.stack === "string") {
			const matches = SFTP_MKDIR_ERR_CODE_REGEXP.exec(err.stack);
			if (matches != null) throw new SSHError(err.message, matches[1]);
			throw err;
		}
	}
}
function getTemporaryPath(remoteFile) {
	const name = `.${fsPath.posix.basename(remoteFile)}.${randomBytes(6).toString("hex")}.tmp`;
	return fsPath.posix.join(fsPath.posix.dirname(remoteFile), name);
}
function isSftpClosed(sftp) {
	return sftp.readable === false;
}
function sftpRequest(sftp, send) {
	return new Promise((resolve, reject) => {
		if (isSftpClosed(sftp)) {
			reject(new SSHError("SFTP channel is closed"));
			return;
		}
		send((err, result) => {
			if (err) reject(err);
			else resolve(result);
		});
	});
}
async function explainPutFileError(error, localFile, remoteFile, sftp) {
	if (!(error instanceof Error)) return error;
	const { code } = error;
	if (code !== 3 && code !== 4) return error;
	try {
		if ((await sftpRequest(sftp, (callback) => sftp.stat(remoteFile, callback))).isDirectory()) {
			const example = fsPath.posix.join(remoteFile, fsPath.basename(localFile));
			error.message += `: ${remoteFile} is a directory, pass the path of the file to write (such as ${example})`;
		}
	} catch (_) {}
	return error;
}
function toSftpTime(timeMs) {
	return Math.floor(timeMs / 1e3);
}
async function isUnchanged(localStats, remoteFile, sftp) {
	let remoteStats;
	try {
		remoteStats = await sftpRequest(sftp, (callback) => sftp.stat(remoteFile, callback));
	} catch (error) {
		if (isSftpClosed(sftp)) throw error;
		return false;
	}
	return remoteStats.isFile() && remoteStats.size === localStats.size && remoteStats.mtime === toSftpTime(localStats.mtimeMs);
}
async function renameWithSftp(from, to, sftp) {
	if (await new Promise((resolve, reject) => {
		try {
			sftp.ext_openssh_rename(from, to, (err) => {
				if (err) reject(err);
				else resolve(true);
			});
		} catch (_) {
			resolve(false);
		}
	})) return;
	try {
		await sftpRequest(sftp, (callback) => sftp.rename(from, to, callback));
	} catch (error) {
		try {
			await sftpRequest(sftp, (callback) => sftp.unlink(to, callback));
		} catch (_) {
			throw error;
		}
		await sftpRequest(sftp, (callback) => sftp.rename(from, to, callback));
	}
}
var NodeSSH = class {
	constructor() {
		this.connection = null;
		this.sftpCloses = /* @__PURE__ */ new WeakMap();
		this.connectionErrorHandlers = /* @__PURE__ */ new WeakMap();
		this.readyConnections = /* @__PURE__ */ new WeakSet();
	}
	listenForErrors(connection) {
		const handlers = /* @__PURE__ */ new Set();
		this.connectionErrorHandlers.set(connection, handlers);
		connection.on("error", (error) => {
			handlers.forEach((handler) => handler(error));
		});
		return handlers;
	}
	onConnectionError(connection, onError) {
		var _a;
		const handlers = (_a = this.connectionErrorHandlers.get(connection)) !== null && _a !== void 0 ? _a : this.listenForErrors(connection);
		handlers.add(onError);
		return () => {
			handlers.delete(onError);
		};
	}
	getConnection() {
		const { connection } = this;
		if (connection == null) throw new Error("Not connected to server");
		return connection;
	}
	async connect(givenConfig) {
		invariant(givenConfig != null && typeof givenConfig === "object", "config must be a valid object");
		const config = { ...givenConfig };
		invariant(config.username != null && typeof config.username === "string", "config.username must be a valid string");
		if (config.host != null) invariant(typeof config.host === "string", "config.host must be a valid string");
		else if (config.sock != null) invariant(typeof config.sock === "object", "config.sock must be a valid object");
		else throw new AssertionError({ message: "Either config.host or config.sock must be provided" });
		if (config.privateKey != null || config.privateKeyPath != null) {
			if (config.privateKey != null) {
				invariant(typeof config.privateKey === "string" || Buffer.isBuffer(config.privateKey), "config.privateKey must be a valid string or Buffer");
				invariant(config.privateKeyPath == null, "config.privateKeyPath must not be specified when config.privateKey is specified");
			} else if (config.privateKeyPath != null) {
				invariant(typeof config.privateKeyPath === "string", "config.privateKeyPath must be a valid string");
				invariant(config.privateKey == null, "config.privateKey must not be specified when config.privateKeyPath is specified");
			}
			invariant(config.passphrase == null || typeof config.passphrase === "string", "config.passphrase must be null or a valid string");
			if (config.privateKeyPath != null) try {
				config.privateKey = await readFile(config.privateKeyPath);
			} catch (err) {
				if (err != null && err.code === "ENOENT") throw new AssertionError({ message: "config.privateKeyPath does not exist at given fs path" });
				throw err;
			}
		} else if (config.password != null) invariant(typeof config.password === "string", "config.password must be a valid string");
		if (config.tryKeyboard != null) invariant(typeof config.tryKeyboard === "boolean", "config.tryKeyboard must be a valid boolean");
		if (config.tryKeyboard) {
			const { password } = config;
			if (config.onKeyboardInteractive != null) invariant(typeof config.onKeyboardInteractive === "function", "config.onKeyboardInteractive must be a valid function");
			else if (password != null) config.onKeyboardInteractive = (name, instructions, instructionsLang, prompts, finish) => {
				if (prompts.length > 0 && prompts[0].prompt.toLowerCase().includes("password")) finish([password]);
			};
		}
		const connection = new import_lib.default.Client();
		this.connection = connection;
		this.listenForErrors(connection);
		const connected = new Promise((resolve, reject) => {
			connection.on("error", reject);
			if (config.onKeyboardInteractive) connection.on("keyboard-interactive", config.onKeyboardInteractive);
			connection.on("ready", () => {
				connection.removeListener("error", reject);
				this.readyConnections.add(connection);
				resolve();
			});
			connection.on("end", () => {
				if (this.connection === connection) this.connection = null;
			});
			connection.on("close", () => {
				if (this.connection === connection) this.connection = null;
				reject(new SSHError("No response from server", "ETIMEDOUT"));
			});
			connection.connect(config);
			connection.setNoDelay(true);
		});
		try {
			await connected;
		} catch (error) {
			if (this.connection === connection) this.connection = null;
			connection.end();
			throw error;
		}
		return this;
	}
	isConnected() {
		return this.connection != null && this.readyConnections.has(this.connection);
	}
	async requestShell(options) {
		const connection = this.getConnection();
		return new Promise((resolve, reject) => {
			const stopWatching = this.onConnectionError(connection, reject);
			const callback = (err, res) => {
				stopWatching();
				if (err) reject(err);
				else resolve(res);
			};
			if (options == null) connection.shell(callback);
			else connection.shell(options, callback);
		});
	}
	async withShell(callback, options) {
		invariant(typeof callback === "function", "callback must be a valid function");
		const shell = await this.requestShell(options);
		try {
			await callback(shell);
		} finally {
			shell.destroy();
		}
	}
	async requestSFTP() {
		const connection = this.getConnection();
		return new Promise((resolve, reject) => {
			const stopWatching = this.onConnectionError(connection, reject);
			connection.sftp((err, res) => {
				stopWatching();
				if (err) reject(explainSftpStartError(err));
				else {
					let pending = this.sftpCloses.get(connection);
					if (pending == null) {
						pending = /* @__PURE__ */ new Set();
						this.sftpCloses.set(connection, pending);
					}
					trackSftpCloses(res, pending);
					resolve(res);
				}
			});
		});
	}
	async withSFTP(callback) {
		invariant(typeof callback === "function", "callback must be a valid function");
		const sftp = await this.requestSFTP();
		try {
			await callback(sftp);
		} finally {
			sftp.end();
		}
	}
	async execCommand(givenCommand, options = {}) {
		invariant(typeof givenCommand === "string", "command must be a valid string");
		invariant(options != null && typeof options === "object", "options must be a valid object");
		invariant(options.cwd == null || typeof options.cwd === "string", "options.cwd must be a valid string");
		invariant(options.stdin == null || typeof options.stdin === "string" || isReadableStream(options.stdin), "options.stdin must be a valid string or readable stream");
		invariant(options.execOptions == null || typeof options.execOptions === "object", "options.execOptions must be a valid object");
		invariant(options.encoding == null || typeof options.encoding === "string", "options.encoding must be a valid string");
		invariant(options.onChannel == null || typeof options.onChannel === "function", "options.onChannel must be a valid function");
		invariant(options.onStdout == null || typeof options.onStdout === "function", "options.onStdout must be a valid function");
		invariant(options.onStderr == null || typeof options.onStderr === "function", "options.onStderr must be a valid function");
		invariant(options.noTrim == null || typeof options.noTrim === "boolean", "options.noTrim must be a boolean");
		invariant(options.noBuffer == null || typeof options.noBuffer === "boolean", "options.noBuffer must be a boolean");
		const { timeout, signal: abortSignal } = options;
		invariant(timeout == null || typeof timeout === "number" && timeout > 0 && timeout <= MAX_TIMEOUT, `options.timeout must be a number greater than 0 and at most ${MAX_TIMEOUT}`);
		invariant(abortSignal == null || isAbortSignal(abortSignal), "options.signal must be a valid AbortSignal");
		const killSignal = options.killSignal == null ? "TERM" : getSshSignalName(options.killSignal);
		invariant(killSignal != null, `options.killSignal must be one of ${SSH_SIGNALS.join(", ")}, with or without the SIG prefix`);
		if (abortSignal === null || abortSignal === void 0 ? void 0 : abortSignal.aborted) throw abortSignal.reason;
		let command = givenCommand;
		if (options.cwd) command = `cd ${escapeCwd(options.cwd)} || exit; ${command}`;
		const connection = this.getConnection();
		const output = {
			stdout: [],
			stderr: []
		};
		const stdoutDecoder = new StringDecoder(options.encoding);
		const stderrDecoder = new StringDecoder(options.encoding);
		return new Promise((resolve, reject) => {
			let execChannel = null;
			let failed = false;
			const stopListening = () => {
				stopWatching();
				clearTimeout(timer);
				abortSignal === null || abortSignal === void 0 || abortSignal.removeEventListener("abort", onAbort);
			};
			const fail = (error) => {
				if (failed) return;
				failed = true;
				stopListening();
				reject(error);
			};
			const cancel = (error) => {
				if (failed) return;
				fail(error);
				if (execChannel != null) stopRemoteCommand(connection, execChannel, killSignal);
			};
			const stopWatching = this.onConnectionError(connection, fail);
			const onAbort = () => cancel(abortSignal === null || abortSignal === void 0 ? void 0 : abortSignal.reason);
			abortSignal === null || abortSignal === void 0 || abortSignal.addEventListener("abort", onAbort, { once: true });
			const timer = timeout != null ? setTimeout(() => cancel(new SSHError(`Command timed out after ${timeout}ms`, "ETIMEDOUT")), timeout) : void 0;
			connection.exec(command, options.execOptions != null ? options.execOptions : {}, (err, channel) => {
				if (err) {
					fail(err);
					return;
				}
				execChannel = channel;
				if (failed) {
					stopRemoteCommand(connection, channel, killSignal);
					return;
				}
				const callUserCallback = (callback) => {
					if (failed) return;
					try {
						callback();
					} catch (error) {
						fail(error);
						channel.close();
					}
				};
				const { onChannel, onStdout, onStderr } = options;
				if (onChannel) {
					callUserCallback(() => onChannel(channel));
					if (failed) return;
				}
				channel.on("data", (chunk) => {
					if (onStdout) callUserCallback(() => onStdout(chunk));
					if (options.noBuffer !== true && !failed) output.stdout.push(stdoutDecoder.write(chunk));
				});
				channel.stderr.on("data", (chunk) => {
					if (onStderr) callUserCallback(() => onStderr(chunk));
					if (options.noBuffer !== true && !failed) output.stderr.push(stderrDecoder.write(chunk));
				});
				if (options.stdin != null) {
					if (isReadableStream(options.stdin)) options.stdin.pipe(channel, { end: true });
					else {
						channel.write(options.stdin);
						channel.end();
					}
				} else channel.end();
				let code = null;
				let signal = null;
				channel.on("exit", (code_, signal_) => {
					code = code_ !== null && code_ !== void 0 ? code_ : null;
					signal = signal_ !== null && signal_ !== void 0 ? signal_ : null;
				});
				channel.on("close", () => {
					if (failed) return;
					stopListening();
					let stdout = "";
					let stderr = "";
					if (options.noBuffer !== true) try {
						output.stdout.push(stdoutDecoder.end());
						output.stderr.push(stderrDecoder.end());
						stdout = output.stdout.join("");
						stderr = output.stderr.join("");
					} catch (error) {
						reject(error instanceof RangeError ? new SSHError("Command output is too large to return as a string, use noBuffer with onStdout/onStderr instead", "ERR_OUTPUT_TOO_LARGE") : error);
						return;
					}
					if (options.noTrim !== true) {
						stdout = stdout.trim();
						stderr = stderr.trim();
					}
					resolve({
						code: code != null ? code : null,
						signal: signal != null ? signal : null,
						stdout,
						stderr
					});
				});
			});
		});
	}
	async exec(command, parameters, options = {}) {
		invariant(typeof command === "string", "command must be a valid string");
		invariant(Array.isArray(parameters), "parameters must be a valid array");
		invariant(options != null && typeof options === "object", "options must be a valid object");
		invariant(options.stream == null || [
			"both",
			"stdout",
			"stderr"
		].includes(options.stream), "options.stream must be one of both, stdout, stderr");
		for (let i = 0, { length } = parameters; i < length; i += 1) invariant(typeof parameters[i] === "string", `parameters[${i}] must be a valid string`);
		const completeCommand = `${command}${parameters.length > 0 ? ` ${(0, import_shell_escape.default)(parameters)}` : ""}`;
		const response = await this.execCommand(completeCommand, options);
		if (options.stream == null || options.stream === "stdout") {
			if (response.stderr) throw new Error(response.stderr);
			return response.stdout;
		}
		if (options.stream === "stderr") return response.stderr;
		return response;
	}
	async mkdir(path, method = "sftp", givenSftp = null) {
		invariant(typeof path === "string", "path must be a valid string");
		invariant(typeof method === "string" && (method === "sftp" || method === "exec"), "method must be either sftp or exec");
		invariant(givenSftp == null || typeof givenSftp === "object", "sftp must be a valid object");
		if (method === "exec") {
			await this.exec("mkdir", ["-p", unixifyPath(path)]);
			return;
		}
		const sftp = givenSftp || await this.requestSFTP();
		const makeSftpDirectory = async (retry) => makeDirectoryWithSftp(unixifyPath(path), sftp).catch(async (error) => {
			if (!retry || error == null || error.message !== "No such file" && error.code !== "ENOENT") throw error;
			await this.mkdir(fsPath.dirname(path), "sftp", sftp);
			await makeSftpDirectory(false);
		});
		try {
			await makeSftpDirectory(true);
		} finally {
			if (!givenSftp) sftp.end();
		}
	}
	async getFile(localFile, remoteFile, givenSftp = null, transferOptions = null) {
		invariant(typeof localFile === "string", "localFile must be a valid string");
		invariant(typeof remoteFile === "string", "remoteFile must be a valid string");
		invariant(givenSftp == null || typeof givenSftp === "object", "sftp must be a valid object");
		invariant(transferOptions == null || typeof transferOptions === "object", "transferOptions must be a valid object");
		const sftp = givenSftp || await this.requestSFTP();
		try {
			await new Promise((resolve, reject) => {
				sftp.fastGet(unixifyPath(remoteFile), localFile, transferOptions || {}, (err) => {
					if (err) reject(err);
					else resolve();
				});
			});
		} finally {
			if (!givenSftp) sftp.end();
		}
	}
	async putFile(localFile, remoteFile, givenSftp = null, transferOptions = null, options = {}) {
		await this.putOrSkipFile(localFile, remoteFile, givenSftp, transferOptions, options);
	}
	async putOrSkipFile(localFile, remoteFile, givenSftp, transferOptions, options) {
		invariant(typeof localFile === "string", "localFile must be a valid string");
		invariant(typeof remoteFile === "string", "remoteFile must be a valid string");
		invariant(givenSftp == null || typeof givenSftp === "object", "sftp must be a valid object");
		invariant(transferOptions == null || typeof transferOptions === "object", "transferOptions must be a valid object");
		invariant(options != null && typeof options === "object", "options must be a valid object");
		invariant(options.atomic == null || typeof options.atomic === "boolean", "options.atomic must be a boolean");
		invariant(options.skipUnchanged == null || typeof options.skipUnchanged === "boolean", "options.skipUnchanged must be a boolean");
		invariant(await new Promise((resolve) => {
			fs$1.access(localFile, fs$1.constants.R_OK, (err) => {
				resolve(err === null);
			});
		}), `localFile does not exist at ${localFile}`);
		const localStats = options.skipUnchanged ? await fs$1.promises.stat(localFile) : null;
		const sftp = givenSftp || await this.requestSFTP();
		const temporaryFile = options.atomic ? getTemporaryPath(unixifyPath(remoteFile)) : null;
		const putFile = (retry) => {
			return new Promise((resolve, reject) => {
				sftp.fastPut(localFile, temporaryFile !== null && temporaryFile !== void 0 ? temporaryFile : unixifyPath(remoteFile), transferOptions || {}, (err) => {
					if (err == null) {
						resolve();
						return;
					}
					if (err.message === "No such file" && retry) resolve(this.mkdir(fsPath.dirname(remoteFile), "sftp", sftp).then(() => putFile(false)));
					else reject(err);
				});
			});
		};
		try {
			if (localStats != null && await isUnchanged(localStats, unixifyPath(remoteFile), sftp)) return true;
			await putFile(true);
			if (localStats != null) {
				const uploadedFile = temporaryFile !== null && temporaryFile !== void 0 ? temporaryFile : unixifyPath(remoteFile);
				const atime = toSftpTime(localStats.atimeMs);
				const mtime = toSftpTime(localStats.mtimeMs);
				await sftpRequest(sftp, (callback) => sftp.utimes(uploadedFile, atime, mtime, callback));
			}
			if (temporaryFile != null) await renameWithSftp(temporaryFile, unixifyPath(remoteFile), sftp);
		} catch (error) {
			if (temporaryFile != null) await sftpRequest(sftp, (callback) => sftp.unlink(temporaryFile, callback)).catch(DEFAULT_TICK);
			throw await explainPutFileError(error, localFile, unixifyPath(remoteFile), sftp);
		} finally {
			if (!givenSftp) sftp.end();
		}
		return false;
	}
	async putFiles(files, { concurrency = DEFAULT_CONCURRENCY, sftp: givenSftp = null, transferOptions = {}, atomic = false, skipUnchanged = false } = {}) {
		invariant(Array.isArray(files), "files must be an array");
		invariant(atomic == null || typeof atomic === "boolean", "options.atomic must be a boolean");
		invariant(skipUnchanged == null || typeof skipUnchanged === "boolean", "options.skipUnchanged must be a boolean");
		for (let i = 0, { length } = files; i < length; i += 1) {
			const file = files[i];
			invariant(file, "files items must be valid objects");
			invariant(file.local && typeof file.local === "string", `files[${i}].local must be a string`);
			invariant(file.remote && typeof file.remote === "string", `files[${i}].remote must be a string`);
		}
		const transferred = [];
		const sftp = givenSftp || await this.requestSFTP();
		const queue = new PromiseQueue({ concurrency });
		try {
			await new Promise((resolve, reject) => {
				files.forEach((file) => {
					queue.add(async () => {
						await this.putFile(file.local, file.remote, sftp, transferOptions, {
							atomic,
							skipUnchanged
						});
						transferred.push(file);
					}).catch(reject);
				});
				queue.waitTillIdle().then(resolve);
			});
		} catch (error) {
			if (error != null) error.transferred = transferred;
			throw error;
		} finally {
			if (!givenSftp) sftp.end();
		}
	}
	async putDirectory(localDirectory, remoteDirectory, { concurrency = DEFAULT_CONCURRENCY, sftp: givenSftp = null, transferOptions = {}, recursive = true, tick = DEFAULT_TICK, validate = DEFAULT_VALIDATE, atomic = false, skipUnchanged = false } = {}) {
		invariant(typeof localDirectory === "string" && localDirectory, "localDirectory must be a string");
		invariant(typeof remoteDirectory === "string" && remoteDirectory, "remoteDirectory must be a string");
		invariant(atomic == null || typeof atomic === "boolean", "options.atomic must be a boolean");
		invariant(skipUnchanged == null || typeof skipUnchanged === "boolean", "options.skipUnchanged must be a boolean");
		const localDirectoryStat = await new Promise((resolve) => {
			fs$1.stat(localDirectory, (err, stat) => {
				resolve(stat || null);
			});
		});
		invariant(localDirectoryStat != null, `localDirectory does not exist at ${localDirectory}`);
		invariant(localDirectoryStat.isDirectory(), `localDirectory is not a directory at ${localDirectory}`);
		const sftp = givenSftp || await this.requestSFTP();
		const scanned = await scanDirectory(localDirectory, {
			recursive,
			validate
		});
		const files = scanned.files.map((item) => fsPath.relative(localDirectory, item));
		const directories = scanned.directories.map((item) => fsPath.relative(localDirectory, item));
		directories.sort((a, b) => a.length - b.length);
		let failed = false;
		try {
			await new Promise((resolve, reject) => {
				const queue = new PromiseQueue({ concurrency });
				directories.forEach((directory) => {
					queue.add(async () => {
						await this.mkdir(fsPath.join(remoteDirectory, directory), "sftp", sftp);
					}).catch(reject);
				});
				resolve(queue.waitTillIdle());
			});
			await new Promise((resolve, reject) => {
				const queue = new PromiseQueue({ concurrency });
				files.forEach((file) => {
					queue.add(async () => {
						const localFile = fsPath.join(localDirectory, file);
						const remoteFile = fsPath.join(remoteDirectory, file);
						try {
							tick(localFile, remoteFile, null, await this.putOrSkipFile(localFile, remoteFile, sftp, transferOptions, {
								atomic,
								skipUnchanged
							}));
						} catch (_) {
							failed = true;
							tick(localFile, remoteFile, _);
						}
					}).catch(reject);
				});
				resolve(queue.waitTillIdle());
			});
		} finally {
			if (!givenSftp) sftp.end();
		}
		return !failed;
	}
	async getDirectory(localDirectory, remoteDirectory, { concurrency = DEFAULT_CONCURRENCY, sftp: givenSftp = null, transferOptions = {}, recursive = true, tick = DEFAULT_TICK, validate = DEFAULT_VALIDATE } = {}) {
		invariant(typeof localDirectory === "string" && localDirectory, "localDirectory must be a string");
		invariant(typeof remoteDirectory === "string" && remoteDirectory, "remoteDirectory must be a string");
		const localDirectoryStat = await new Promise((resolve) => {
			fs$1.stat(localDirectory, (err, stat) => {
				resolve(stat || null);
			});
		});
		invariant(localDirectoryStat != null, `localDirectory does not exist at ${localDirectory}`);
		invariant(localDirectoryStat.isDirectory(), `localDirectory is not a directory at ${localDirectory}`);
		const sftp = givenSftp || await this.requestSFTP();
		const scanned = await scanDirectory(remoteDirectory, {
			recursive,
			validate,
			concurrency,
			fileSystem: {
				basename(path) {
					return fsPath.posix.basename(path);
				},
				join(pathA, pathB) {
					return fsPath.posix.join(pathA, pathB);
				},
				readdir(path) {
					return new Promise((resolve, reject) => {
						sftp.readdir(path, (err, res) => {
							if (err) reject(err);
							else resolve(res.map((item) => item.filename));
						});
					});
				},
				stat(path) {
					return new Promise((resolve, reject) => {
						sftp.stat(path, (err, res) => {
							if (err) reject(err);
							else resolve(res);
						});
					});
				}
			}
		});
		const files = scanned.files.map((item) => fsPath.relative(remoteDirectory, item));
		const directories = scanned.directories.map((item) => fsPath.relative(remoteDirectory, item));
		directories.sort((a, b) => a.length - b.length);
		let failed = false;
		try {
			await new Promise((resolve, reject) => {
				const queue = new PromiseQueue({ concurrency });
				directories.forEach((directory) => {
					queue.add(async () => {
						await fs$1.promises.mkdir(fsPath.join(localDirectory, directory), { recursive: true });
					}).catch(reject);
				});
				resolve(queue.waitTillIdle());
			});
			await new Promise((resolve, reject) => {
				const queue = new PromiseQueue({ concurrency });
				files.forEach((file) => {
					queue.add(async () => {
						const localFile = fsPath.join(localDirectory, file);
						const remoteFile = fsPath.join(remoteDirectory, file);
						try {
							await this.getFile(localFile, remoteFile, sftp, transferOptions);
							tick(localFile, remoteFile, null);
						} catch (_) {
							failed = true;
							tick(localFile, remoteFile, _);
						}
					}).catch(reject);
				});
				resolve(queue.waitTillIdle());
			});
		} finally {
			if (!givenSftp) sftp.end();
		}
		return !failed;
	}
	forwardIn(remoteAddr, remotePort, onConnection) {
		const connection = this.getConnection();
		return new Promise((resolve, reject) => {
			connection.forwardIn(remoteAddr, remotePort, (error, port) => {
				if (error) {
					reject(error);
					return;
				}
				const handler = (details, acceptConnection, rejectConnection) => {
					if (details.destIP === remoteAddr && details.destPort === port) onConnection === null || onConnection === void 0 || onConnection(details, acceptConnection, rejectConnection);
				};
				if (onConnection) connection.on("tcp connection", handler);
				const dispose = () => {
					return new Promise((_resolve, _reject) => {
						connection.off("tcp connection", handler);
						connection.unforwardIn(remoteAddr, port, (_error) => {
							if (_error) _reject(error);
							_resolve();
						});
					});
				};
				resolve({
					port,
					dispose
				});
			});
		});
	}
	forwardOut(srcIP, srcPort, dstIP, dstPort) {
		const connection = this.getConnection();
		return new Promise((resolve, reject) => {
			connection.forwardOut(srcIP, srcPort, dstIP, dstPort, (error, channel) => {
				if (error) {
					reject(error);
					return;
				}
				resolve(channel);
			});
		});
	}
	forwardInStreamLocal(socketPath, onConnection) {
		const connection = this.getConnection();
		return new Promise((resolve, reject) => {
			connection.openssh_forwardInStreamLocal(socketPath, (error) => {
				if (error) {
					reject(error);
					return;
				}
				const handler = (details, acceptConnection, rejectConnection) => {
					if (details.socketPath === socketPath) onConnection === null || onConnection === void 0 || onConnection(details, acceptConnection, rejectConnection);
				};
				if (onConnection) connection.on("unix connection", handler);
				const dispose = () => {
					return new Promise((_resolve, _reject) => {
						connection.off("unix connection", handler);
						connection.openssh_unforwardInStreamLocal(socketPath, (_error) => {
							if (_error) _reject(_error);
							_resolve();
						});
					});
				};
				resolve({ dispose });
			});
		});
	}
	forwardOutStreamLocal(socketPath) {
		const connection = this.getConnection();
		return new Promise((resolve, reject) => {
			connection.openssh_forwardOutStreamLocal(socketPath, (error, channel) => {
				if (error) {
					reject(error);
					return;
				}
				resolve(channel);
			});
		});
	}
	dispose() {
		const { connection } = this;
		if (connection == null) return;
		this.connection = null;
		const pending = this.sftpCloses.get(connection);
		if (pending == null || pending.size === 0) {
			connection.end();
			return;
		}
		const timer = setTimeout(() => connection.end(), DISPOSE_SFTP_CLOSE_TIMEOUT);
		Promise.all(pending).then(() => {
			clearTimeout(timer);
			connection.end();
		});
	}
};
// src/utils.ts
const shellQuote = (value) => `'${value.replace(/'/g, `'\\''`)}'`;
const buildScript = (envs, command) => {
	return `${[
		"set -euo pipefail",
		...envs.map(({ key, value }) => `export ${key}=${shellQuote(value)}`),
		...command
	].join("\n")}\n`;
};
/** Returns the host key fingerprint in the format printed by `ssh-keygen -lf`, ex. SHA256:abc... */
const getFingerprint = (hostKey) => {
	return `SHA256:${createHash("sha256").update(hostKey).digest("base64").replace(/=+$/, "")}`;
};
const normalizeFingerprint = (fingerprint) => {
	return fingerprint.trim().replace(/^SHA256:/i, "").replace(/=+$/, "");
};
const matchesFingerprint = (hostKey, expected) => {
	return normalizeFingerprint(getFingerprint(hostKey)) === normalizeFingerprint(expected);
};
// src/run.ts
const SHELL = "bash --noprofile --norc";
async function run() {
	const ssh = new NodeSSH();
	try {
		const { config } = new ConfigManager();
		const sshConfig = {
			host: config.host,
			port: config.port,
			username: config.user,
			keepaliveInterval: 15e3,
			readyTimeout: config.connectTimeout * 1e3
		};
		if (config.key) {
			sshConfig.privateKey = config.key;
			if (config.passphrase) sshConfig.passphrase = config.passphrase;
		} else sshConfig.password = config.password;
		let rejectedFingerprint = "";
		if (config.fingerprint) sshConfig.hostVerifier = (hostKey) => {
			if (matchesFingerprint(hostKey, config.fingerprint)) return true;
			rejectedFingerprint = getFingerprint(hostKey);
			return false;
		};
		else warning("Host key is not verified, set the fingerprint input to protect the connection from man-in-the-middle attacks");
		try {
			await ssh.connect(sshConfig);
		} catch (error) {
			if (rejectedFingerprint) throw new Error(`Host key verification failed, server presented ${rejectedFingerprint}`);
			throw error;
		}
		info("Connection established...");
		const ignoredEnvKeys = new Set(ConfigManager.exportIgnoredEnvs.map((key) => key.toLowerCase()));
		const envs = config.exportActionOptions ? config.envs : config.envs.filter(({ key }) => !ignoredEnvKeys.has(key.toLowerCase()));
		const script = buildScript(envs, config.command);
		let sawStdout = false;
		let sawStderr = false;
		const execCommandOptions = {
			onStdout: (chunk) => {
				sawStdout = true;
				process.stdout.write(chunk.toString("utf8"));
			},
			onStderr: (chunk) => {
				sawStderr = true;
				process.stderr.write(chunk.toString("utf8"));
			}
		};
		let command = `${SHELL} -c 'source /dev/stdin'`;
		if (config.tty) {
			const upload = await ssh.execCommand(`umask 077 && f=$(mktemp) && cat > "$f" && printf %s "$f"`, { stdin: script });
			const scriptPath = upload.stdout.trim();
			if (upload.code !== 0 || !scriptPath) {
				const stderr = upload.stderr?.trim();
				throw new Error(stderr ? `Failed to upload script: ${stderr}` : "Failed to upload script");
			}
			command = `${SHELL} -c 'exec 9<"$1"; rm -f -- "$1"; shift; source /dev/fd/9' bash ${shellQuote(scriptPath)}`;
			execCommandOptions.execOptions = { pty: true };
		} else execCommandOptions.stdin = script;
		info(`Executing commands...`);
		info("########## START ###########");
		let timer;
		const execution = ssh.execCommand(command, execCommandOptions);
		const response = await (config.timeout === 0 ? execution : Promise.race([execution, new Promise((_, reject) => {
			timer = setTimeout(() => {
				ssh.dispose();
				reject(/* @__PURE__ */ new Error(`Command timed out after ${config.timeout} seconds`));
			}, config.timeout * 1e3);
		})]).finally(() => clearTimeout(timer)));
		if (!sawStdout && response.stdout) info(response.stdout);
		if (!sawStderr && response.stderr) error(response.stderr);
		if (response.code !== 0) {
			const stderr = response.stderr?.trim();
			throw new Error(stderr ? `Command failed: ${stderr}` : "Command failed");
		}
		info("########### END ##########");
		info("Executed all commands successfully! 🚀");
	} catch (error) {
		setFailed(error instanceof Error ? error.message : String(error));
	} finally {
		ssh.dispose();
	}
}
// src/main.ts
run();
export {};
