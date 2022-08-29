import { join } from "node:path";
import chokidar from "chokidar";
import app from "./app.mjs";
const { argv } = process;
const pagesDirectory = argv[2];

const currentDirectory = process.cwd();
const port = 3000;

const state = {
  server: null,
  sockets: [],
};

async function start() {
  state.server = (await app({ currentDirectory, pagesDirectory })).listen(
    3000,
    () => {
      console.log(`Application started: http://localhost:${port}`);
    }
  );
  state.server.on("connection", (socket) => {
    console.log("Add socket", state.sockets.length + 1);
    state.sockets.push(socket);
  });
}

function pathCheck(id) {
  return (
    id.startsWith(join(__dirname, "routes")) ||
    id.startsWith(join(__dirname, "server.js"))
  );
}

function restart() {
  // clean the cache
  // How in es6?
  //   Object.keys(import.meta.cache).forEach((id) => {
  //     if (pathCheck(id)) {
  //       console.log("Reloading", id);
  //       delete import.meta.cache[id];
  //     }
  //   });

  state.sockets.forEach((socket, index) => {
    console.log("Destroying socket", index + 1);
    if (socket.destroyed === false) {
      socket.destroy();
    }
  });

  state.sockets = [];

  state.server.close(() => {
    console.log("Server is closed");
    console.log("\n----------------- restarting -------------");
    start();
  });
}

console.log({ pagesDirectory });
start();
chokidar
  .watch(pagesDirectory, {
    ignored: [join(pagesDirectory, "node_modules")],
  })
  .on("all", (event, at) => {
    if (event === "add") {
      console.log("Watching for", at);
    }

    if (event === "change") {
      console.log("Changes at", at);
      restart();
    }
  });
