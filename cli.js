#!/usr/bin/env node

import app from "./app.js";

const { argv } = process;
const pagesDirectory = argv[2];

const port = 3000;

app({ pagesDirectory }).listen(port, () => {
  console.log(`Application started: http://localhost:${port}`);
});
