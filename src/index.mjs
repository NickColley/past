import { join, dirname } from "node:path";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { Command } from "commander";
import chalk from "chalk";
import chokidar from "chokidar";
import getPort from "get-port";

import server from "./server.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const currentDirectory = process.cwd();

const packageJson = JSON.parse(
  await readFile(join(__dirname, "..", "package.json"))
);

let pagesDirectory = ".";
let environment = "development";
let port = 3000;

const program = new Command(packageJson.name)
  .version(packageJson.version)
  .option("-p, --pages <string>", "Pages directory", pagesDirectory)
  .option("-o, --port <number>", "Port to run the server", port)
  .option("-e, --environment <string>", "Server environment", environment)
  .showHelpAfterError()
  .on("--help", console.log)
  .parse(process.argv);

const options = program.opts();

if (options.port) {
  port = parseInt(options.port, 10);
}
if (options.pages) {
  pagesDirectory = options.pages;
}

const app = await server({ currentDirectory, pagesDirectory });

const state = {
  server: null,
  sockets: [],
};

if (environment === "production") {
  app.listen(port, () => {
    console.log(
      chalk.blueBright(
        "Application started: " + chalk.underline(`http://localhost:${port}`)
      )
    );
  });
} else {
  // If already in use use a random port instead.
  port = await getPort({ port });
  // Development server with file watching and reloading.
  start();
}

async function start() {
  state.server = app.listen(port, () => {
    console.log(
      chalk.blueBright(
        "Application started: " + chalk.underline(`http://localhost:${port}`)
      )
    );
  });
  state.server.on("connection", (socket) => {
    state.sockets.push(socket);
  });
}

function restart() {
  state.sockets.forEach((socket) => {
    if (socket.destroyed === false) {
      socket.destroy();
    }
  });
  state.sockets = [];

  state.server.close(() => {
    console.log(chalk.bgBlueBright.bold("Restarting application..."));
    start();
  });
}

console.log(chalk.yellow(`Watching files for changes in "${pagesDirectory}".`));
chokidar
  .watch(pagesDirectory, {
    ignored: [join(pagesDirectory, "node_modules")],
  })
  .on("change", (file) => {
    console.log(chalk.blueBright(`File ${file} changed`));
    restart();
  });
