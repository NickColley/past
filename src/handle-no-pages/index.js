import chalk from "chalk";

import { PAGES_DIRECTORY } from "../constants.js";

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

export default handleNoPages;
