import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";

const main = ({ pagesDirectory = "." } = {}) => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  const app = express();

  console.log(
    `Looking for an index.html file in ${join(__dirname, pagesDirectory)}.`
  );

  app.get("/", (request, response) => {
    response.sendFile(join(__dirname, pagesDirectory, "pages", "index.html"));
  });

  return app;
};

export default main;
