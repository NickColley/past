#!/usr/bin/env node

"use strict";

var fs = require("fs");
var path = require("path");

fs.readFile(path.join(__dirname, "./.nvmrc"), "utf8", function (error, data) {
  if (error) {
    throw error;
  }

  var expectedVersion = data.trim().replace("v", "");
  var currentVersion = process.version.replace("v", "");

  var expectedVersionMajor = parseInt(expectedVersion.split(".")[0], 10);
  var currentVersionMajor = parseInt(currentVersion.split(".")[0], 10);

  var nvmInstallText = "Try using nvm (https://github.com/nvm-sh/nvm).";

  if (currentVersionMajor >= expectedVersionMajor) {
    // eslint-disable-next-line node/no-unsupported-features/es-syntax
    return import("./index.mjs");
  }

  console.log(
    "" +
      "You are using Node.js version " +
      currentVersion +
      " which we do not support. " +
      "\n\n" +
      "Please install Node.js version " +
      expectedVersionMajor +
      " or above and try again." +
      "\n\n" +
      nvmInstallText +
      ""
  );
  // eslint-disable-next-line no-process-exit
  process.exit(1); // exit with a failure mode
});
