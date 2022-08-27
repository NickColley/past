import { join, dirname } from "node:path";
import { access } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import express from "express";
import bodyParser from "body-parser";
import nunjucks from "nunjucks";

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
  Object.keys(routes).forEach(async (route) => {
    const { path, file, controller, template } = routes[route];
    let controllers = {};
    if (controller) {
      const {
        default: defaultGet,
        get,
        post,
      } = await import(join(path, controller));
      controllers.GET = get ? get : defaultGet;
      if (post) {
        controllers.POST = post;
      }
    }
    console.log(`Registered route ${route}`);
    app.all(route, (request, response, next) => {
      const { method } = request;
      const locals = controllers[method]
        ? controllers[method]({
            params: request.params,
            body: request.body,
            query: request.query,
          })
        : {};
      if (template) {
        return response.render(join(path, template), locals);
      }
      if (file) {
        return response.sendFile(join(path, file));
      }
      if (locals) {
        return response.send(locals);
      }
      next();
    });
  });
}

async function main({ currentDirectory = ".", pagesDirectory = "." } = {}) {
  const app = express();
  app.use(bodyParser.urlencoded({ extended: true }));

  const filePath = join(currentDirectory, pagesDirectory);
  nunjucks.configure(filePath, {
    autoescape: true,
    throwOnUndefined: true,
    trimBlocks: true,
    lstripBlocks: true,
    noCache: false,
    express: app,
  });
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
