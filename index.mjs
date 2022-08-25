#!/usr/bin/env node

import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import app from "./app.js";

const { argv } = process;
const pagesDirectory = argv[2];

const currentDirectory = dirname(fileURLToPath(import.meta.url));

const port = 3000;

app({ currentDirectory, pagesDirectory }).listen(port, () => {
  console.log(`Application started: http://localhost:${port}`);
});
