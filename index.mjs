#!/usr/bin/env node

import app from "./app.mjs";

const { argv } = process;
const pagesDirectory = argv[2];

const currentDirectory = process.cwd();
const port = 3000;

async function main() {
  (await app({ currentDirectory, pagesDirectory })).listen(port, () => {
    console.log(`Application started: http://localhost:${port}`);
  });
}

main();
