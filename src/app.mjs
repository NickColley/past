import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { access } from "node:fs/promises";

import express from "express";
import bodyParser from "body-parser";
import chalk from "chalk";
import nunjucks from "nunjucks";
import sass from "sass";
import { rollup } from "rollup";
import { stringReplace } from "string-replace-middleware";
import fileSystemRouter from "./file-system-router.js";

const PAGES_DIRECTORY = "pages";
const cacheImports = false;
const __dirname = dirname(fileURLToPath(import.meta.url));

const formatErrorLog = (message, path) => {
  return (
    chalk.black.bgRedBright("\nError:") +
    chalk.redBright.bold(` ${message}\n`).replace(path, chalk.underline(path))
  );
};

function handleNoPages(app, error) {
  const errorPath = error.path.replace(PAGES_DIRECTORY, "");
  const message = `Could not find a "${PAGES_DIRECTORY}" directory in "${errorPath}".`;
  console.error(formatErrorLog(message, errorPath));
  app.get("/", (request, response) => {
    response.send(message);
  });
}

function registerRoutes(app, routes, filePath) {
  Object.keys(routes).forEach(async (route) => {
    const { path, file, controller, template, javascript, scss, css } =
      routes[route];
    let controllers = {};
    if (controller) {
      let importPath = join(path, controller);
      if (!cacheImports) {
        importPath = importPath + "?update=" + Date.now();
      }
      const { default: defaultGet, get, post } = await import(importPath); // eslint-disable-line
      controllers.GET = get ? get : defaultGet;
      if (post) {
        controllers.POST = post;
      }
    }
    const registeredLog = chalk.yellow(
      `Registered ${
        (controllers && Object.keys(controllers).join(", ")) || "GET"
      } route at "${route}"`
    );
    console.time(registeredLog);
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
        response.setHeader("content-type", "text/html");
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
      const compilingJsLog = chalk.green(
        `Built JavaScript "${join(path.replace(filePath, ""), javascript)}"`
      );
      console.time(compilingJsLog);
      const bundle = await rollup({
        input: join(path, javascript),
      });
      const output = await bundle.generate({});
      const { code } = output.output[0];
      console.timeEnd(compilingJsLog);
      app.get(join(route, javascript), (request, response) => {
        response.setHeader("content-type", "text/javascript");
        return response.send(code);
      });
    }
    if (css) {
      app.get(join(route, css), (request, response) => {
        response.setHeader("content-type", "text/css");
        return response.sendFile(join(path, css));
      });
    }
    if (scss) {
      const compilingSassLog = chalk.green(
        `Built Sass "${join(path.replace(filePath, ""), scss)}"`
      );
      console.time(compilingSassLog);
      const { css } = sass.compile(join(path, scss), {
        loadPaths: [join(path, "..", "node_modules")], // TODO: Configurable...
        quietDeps: true, // TODO: make this configureable? stop dependencies from warning
      });
      console.timeEnd(compilingSassLog);
      const transformedScssPath = scss.replace(".scss", ".css");
      app.get(join(route, transformedScssPath), (request, response) => {
        response.setHeader("content-type", "text/css");
        return response.send(css);
      });
    }
    console.timeEnd(registeredLog);
  });
}

function liveReload(app) {
  app.get("/__live-reload__", (request, response) => {
    response.set({
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    response.flushHeaders();
    // Send an initial event to establish a connection
    response.write(`data: hello\n\n`);
  });
  app.get("/__live-reload__/client.js", (request, response) => {
    response.sendFile(join(__dirname, "live-reload.client.js"));
  });
  app.use(
    stringReplace({
      "</body>": `<script src="/__live-reload__/client.js"></script>\n</body>`,
    })
  );
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
    noCache: true, // TODO set depending on environment
    express: app,
  });
  try {
    console.log(chalk.yellow(`\nLooking for files in "${pagesDirectory}"...`));
    await access(filePath);
    const routes = await fileSystemRouter(join(filePath, PAGES_DIRECTORY));
    liveReload(app);
    registerRoutes(app, routes, filePath);
  } catch (error) {
    if (error.code === "ENOENT") {
      handleNoPages(app, error);
    } else {
      throw error;
    }
  }

  return { server: app };
}

export default main;
