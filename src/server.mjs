import { join } from "node:path";
import { access } from "node:fs/promises";

import express from "express";
import bodyParser from "body-parser";
import chalk from "chalk";
import nunjucks from "nunjucks";

import fileSystemRouter from "./file-system-router/index.js";
import liveReload from "./live-reload/index.mjs";
import registerRoutes from "./register-routes/index.js";
import handleNoPages from "./handle-no-pages/index.js";

import { PAGES_DIRECTORY } from "./constants.js";

async function main({ currentDirectory = ".", pagesDirectory = "." } = {}) {
  const app = express();
  app.use(bodyParser.urlencoded({ extended: true }));

  const filePath = join(currentDirectory, pagesDirectory);
  nunjucks.configure(filePath, {
    autoescape: true,
    throwOnUndefined: false,
    trimBlocks: true,
    lstripBlocks: true,
    noCache: true, // TODO set depending on environment
    express: app,
  });
  try {
    console.log(chalk.yellow(`\nLooking for files in "${pagesDirectory}"...`));
    await access(filePath);
  } catch (error) {
    if (error.code === "ENOENT") {
      handleNoPages(app, error);
    } else {
      throw error;
    }
  }

  const routes = await fileSystemRouter(join(filePath, PAGES_DIRECTORY));
  liveReload(app);
  registerRoutes(app, routes, filePath);

  return app;
}

export default main;
