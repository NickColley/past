import { join } from "node:path";
import chalk from "chalk";
import chokidar from "chokidar";
import getPort from "get-port";

import server from "./server.mjs";
import { NODE_ENV } from "./constants.js";

const { argv } = process;
const pagesDirectory = argv[2] || ".";

const currentDirectory = process.cwd();
let port = process.env.PORT || 3000;

const app = await server({ currentDirectory, pagesDirectory });

const state = {
  server: null,
  sockets: [],
};

if (NODE_ENV === "production") {
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

chokidar
  .watch(pagesDirectory, {
    ignored: [join(pagesDirectory, "node_modules")],
  })
  .on("change", (file) => {
    console.log(chalk.blueBright(`File ${file} changed`));
    restart();
  });
