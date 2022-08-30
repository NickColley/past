import { join } from "node:path";
import chalk from "chalk";
import chokidar from "chokidar";
import app from "./app.mjs";

const { argv } = process;
const pagesDirectory = argv[2] || ".";

const currentDirectory = process.cwd();
const port = 3000;

const state = {
  server: null,
  sockets: [],
};

async function start() {
  const { server } = await app({ currentDirectory, pagesDirectory });
  state.server = server.listen(3000, () => {
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

start();
