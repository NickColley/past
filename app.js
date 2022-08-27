import { join } from "node:path";
import { access } from "node:fs/promises";
import express from "express";

import fileSystemRouter from "./file-system-router.js";

const PAGES_DIRECTORY = "pages";

function handleNoPages(app, error) {
  const message = `Could not find a ${PAGES_DIRECTORY} directory at ${error.path}.`;
  console.error(message);
  app.get("/", (request, response) => {
    response.send(message);
  });
}

function registerRoutes(app, routes) {
  Object.keys(routes).forEach((route) => {
    const { path, file } = routes[route];
    console.log(`Registered route ${route}`);
    app.get(route, (request, response) => {
      response.sendFile(join(path, file));
    });
  });
}

async function main({ currentDirectory = ".", pagesDirectory = "." } = {}) {
  const app = express();

  const filePath = join(currentDirectory, pagesDirectory);

  try {
    console.log(`Looking for files in "${pagesDirectory}".`);
    await access(filePath);
    const routes = await fileSystemRouter(join(filePath, PAGES_DIRECTORY));
    registerRoutes(app, routes);
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
