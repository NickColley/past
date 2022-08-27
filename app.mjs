import { join, dirname } from "node:path";
import { access } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import express from "express";
import bodyParser from "body-parser";
import nunjucks from "nunjucks";
import sass from "sass";
import { rollup } from "rollup";

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
    console.time(`Registered route ${route}`);
    const { path, file, controller, template, javascript, scss, css } =
      routes[route];
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
    app.all(route, (request, response, next) => {
      const { method } = request;
      // TODO: Auto escape?
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
    // TODO: Maybe something like webpack/parcel is better for this?
    if (javascript) {
      console.time(`Compiling JavaScript "${join(path, javascript)}"`);
      const bundle = await rollup({
        input: join(path, javascript),
      });
      const output = await bundle.generate({});
      const { code } = output.output[0];
      console.timeEnd(`Compiling JavaScript "${join(path, javascript)}"`);
      app.get(join(route, javascript), (request, response, next) => {
        response.setHeader("content-type", "text/javascript");
        return response.send(code);
      });
    }
    if (css) {
      app.get(join(route, css), (request, response, next) => {
        return response.sendFile(join(path, css));
      });
    }
    if (scss) {
      console.time(`Compiling Sass "${join(path, scss)}"`);
      const { css } = sass.compile(join(path, scss), {
        loadPaths: [join(path, "..", "node_modules")], // TODO: Configurable...
        quietDeps: true, // TODO: make this configureable? stop dependencies from warning
      });
      console.timeEnd(`Compiling Sass "${join(path, scss)}"`);
      const transformedScssPath = scss.replace(".scss", ".css");
      app.get(join(route, transformedScssPath), (request, response, next) => {
        response.setHeader("content-type", "text/css");
        return response.send(css);
      });
    }
    console.timeEnd(`Registered route ${route}`);
  });
}

async function main({ currentDirectory = ".", pagesDirectory = "." } = {}) {
  const app = express();
  app.use(bodyParser.urlencoded({ extended: true }));

  const filePath = join(currentDirectory, pagesDirectory);
  nunjucks.configure(filePath, {
    autoescape: true,
    throwOnUndefined: false,
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
