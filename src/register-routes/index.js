import { join } from "node:path";

import chalk from "chalk";
import sass from "sass";
import { rollup } from "rollup";

async function compileJavaScript(input) {
  const bundle = await rollup({ input });
  const output = await bundle.generate({});
  const { code } = output.output[0];
  return code;
}

function registerRoutes(app, routes, filePath, environment) {
  Object.keys(routes).forEach(async (route) => {
    const { path, file, controller, template, javascript, scss, css } =
      routes[route];
    let controllers = {};
    if (controller) {
      let importPath = join(path, controller);
      if (environment === "development") {
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

      let locals = {};
      if (controllers[method]) {
        locals = controllers[method](request, response);
      }

      // Redirect to avoid form re-submission issues.
      // https://en.wikipedia.org/wiki/Post/Redirect/Get
      if (method === "POST") {
        // Persist the locals returned form the post into a session.
        request.session.__locals__ = locals;
        return response.redirect(request.url);
      }
      if (method === "GET") {
        if (request.session.__locals__) {
          if (typeof request.session.__locals__ === "object") {
            // Merge the persisted locals from the post.
            locals = Object.assign(locals, request.session.__locals__);
          } else {
            locals = request.session.__locals__;
          }
        }
        // Unset session locals now they have been used.
        request.session.__locals__ = null;
      }

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
    if (javascript) {
      const compilingJsLog = chalk.green(
        `Built JavaScript "${join(path.replace(filePath, ""), javascript)}"`
      );
      console.time(compilingJsLog);
      const code = await compileJavaScript(join(path, javascript));
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
        loadPaths: [join(path, "..", "node_modules")],
        quietDeps: true, // Stop node_module dependencies from displaying noisy warnings
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
