// ssh2 ships emscripten output (poly1305.js) that reads the CommonJS global __dirname.
// The bundle in dist/ is an ES module, where that global does not exist, so it is defined here.
// This module must be imported before node-ssh.
globalThis.__dirname ??= import.meta.dirname;
