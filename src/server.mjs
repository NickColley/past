import { join } from "node:path";
import { access } from "node:fs/promises";

import express from "express";
import bodyParser from "body-parser";
import compression from "compression";
import session from "cookie-session";
import chalk from "chalk";
import nunjucks from "nunjucks";

import fileSystemRouter from "./file-system-router/index.js";
import liveReload from "./live-reload/index.mjs";
import registerRoutes from "./register-routes/index.js";
import handleNoPages from "./handle-no-pages/index.js";

import { PAGES_DIRECTORY } from "./constants.js";

async function main({
  currentDirectory = ".",
  pagesDirectory = ".",
  environment,
} = {}) {
  const app = express();

  // TODO: Figure out best practice for production for sessions.
  app.use(
    session({
      name: "session",
      secret: "development",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: "strict",
    })
  );

  app.use(bodyParser.urlencoded({ extended: true }));

  if (environment === "production") {
    app.use(compression());
  }

  const filePath = join(currentDirectory, pagesDirectory);
  nunjucks.configure(filePath, {
    autoescape: true,
    throwOnUndefined: false,
    trimBlocks: true,
    lstripBlocks: true,
    noCache: environment === "development",
    express: app,
  });
  try {
    console.log(chalk.yellow(`\nLooking for files in "${pagesDirectory}"...`));
    await access(join(filePath));
    const routes = await fileSystemRouter(join(filePath, PAGES_DIRECTORY));
    if (environment === "development") {
      liveReload(app);
    }
    registerRoutes(app, routes, filePath, environment);
  } catch (error) {
    if (error.code === "ENOENT") {
      handleNoPages(app, error);
    } else {
      throw error;
    }
  }

  return app;
}

export default main;
