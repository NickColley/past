import { join } from "node:path";

import chalk from "chalk";
import sass from "sass";
import { rollup } from "rollup";
const cacheImports = false;

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

export default registerRoutes;
