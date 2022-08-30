import { readdir } from "node:fs/promises";
import { join, extname } from "node:path";

async function recurseFiles(pathName) {
  const filesAndDirectories = await readdir(pathName, {
    withFileTypes: true, // Allows us to check if something is a file or a directory
  });
  return Promise.all(
    filesAndDirectories.map((fileOrDirectory) => {
      const isDirectory = fileOrDirectory.isDirectory();
      const { name } = fileOrDirectory;
      if (isDirectory) {
        return recurseFiles(join(pathName, name));
      }
      return { pathName, name };
    })
  );
}

async function fileSystemRouter(rootPathName) {
  const files = await recurseFiles(rootPathName);
  let routes = {};
  files.flat(Infinity).forEach((route) => {
    const { name, pathName } = route;
    const normalizedPath = pathName
      .replace(rootPathName, "/")
      .replace("//", "/"); // TODO do this better...
    let routeName = normalizedPath ? normalizedPath : "/";
    const extension = extname(name);
    const nameWithoutExtension = name
      .replace(extension, "")
      .replace(".client", "");

    if (nameWithoutExtension !== "index") {
      routeName = join(routeName, nameWithoutExtension);
    }

    // Convert brackets into Express dynamic routes.
    routeName = routeName.replace(/\[/g, ":").replace(/\]/g, "");

    if (!routes[routeName]) {
      routes[routeName] = [];
    }
    routes[routeName].path = pathName;
    if (name.endsWith(".client.js")) {
      routes[routeName].javascript = name;
    } else if (extension === ".scss") {
      routes[routeName].scss = name;
    } else if (extension === ".css") {
      routes[routeName].css = name;
    } else if (extension === ".js" || extension === ".mjs") {
      routes[routeName].controller = name;
    } else if (extension === ".md") {
      routes[routeName].markdown = name;
    } else if (extension === ".njk") {
      routes[routeName].template = name;
    } else {
      routes[routeName].file = name;
    }
  });
  return routes;
}

export default fileSystemRouter;
