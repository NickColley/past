import { join } from "node:path";
import express from "express";

const main = ({ currentDirectory = ".", pagesDirectory = "." } = {}) => {
  const app = express();

  console.log(
    `Looking for an index.html file in ${join(
      currentDirectory,
      pagesDirectory
    )}.`
  );

  app.get("/", (request, response) => {
    response.sendFile(
      join(currentDirectory, pagesDirectory, "pages", "index.html")
    );
  });

  return app;
};

export default main;
