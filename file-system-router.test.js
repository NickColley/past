import test from "ava";
import esmock from "esmock";
import { Volume } from "memfs";

async function setup(files, path) {
  const volume = Volume.fromJSON(files, path);
  const fileSystemRouter = await esmock("./file-system-router.js", {
    "node:fs/promises": {
      readdir: volume.promisesApi.readdir,
    },
  });
  return fileSystemRouter;
}

async function suite() {
  test("should mount index.html at /", async (assert) => {
    const fileSystemRouter = await setup(
      {
        "index.html": "Hello, World.",
      },
      "fixtures/"
    );
    const routes = await fileSystemRouter("fixtures/");

    assert.truthy(routes["/"]);
    assert.is(routes["/"].file, "index.html");
    assert.is(routes["/"].path, "fixtures/");
  });

  test("should mount named.html at /named", async (assert) => {
    const fileSystemRouter = await setup(
      {
        "named.html": "Hello, World.",
      },
      "fixtures/"
    );
    const routes = await fileSystemRouter("fixtures/");
    assert.truthy(routes["/named"]);
    assert.is(routes["/named"].file, "named.html");
    assert.is(routes["/named"].path, "fixtures/");
  });

  test("should mount nested/index.html at /nested", async (assert) => {
    const fileSystemRouter = await setup(
      {
        "index.html": "Hello, World.",
      },
      "fixtures/nested/"
    );
    const routes = await fileSystemRouter("fixtures/");
    assert.truthy(routes["/nested"]);
    assert.is(routes["/nested"].file, "index.html");
    assert.is(routes["/nested"].path, "fixtures/nested");
  });

  test("should mount nested/named.html at /nested/named", async (assert) => {
    const fileSystemRouter = await setup(
      {
        "named.html": "Hello, World.",
      },
      "fixtures/nested/"
    );
    const routes = await fileSystemRouter("fixtures/");

    assert.truthy(routes["/nested/named"]);
    assert.is(routes["/nested/named"].file, "named.html");
    assert.is(routes["/nested/named"].path, "fixtures/nested");
  });

  test("should mount nested/deeper/index.html at /nested/deeper", async (assert) => {
    const fileSystemRouter = await setup(
      {
        "index.html": "Hello, World.",
      },
      "fixtures/nested/deeper"
    );
    const routes = await fileSystemRouter("fixtures/");

    assert.truthy(routes["/nested/deeper"]);
    assert.is(routes["/nested/deeper"].file, "index.html");
    assert.is(routes["/nested/deeper"].path, "fixtures/nested/deeper");
  });

  test("should mount nested/deeper/named.html at /nested/deeper/named", async (assert) => {
    const fileSystemRouter = await setup(
      {
        "named.html": "Hello, World.",
      },
      "fixtures/nested/deeper"
    );
    const routes = await fileSystemRouter("fixtures/");

    assert.truthy(routes["/nested/deeper/named"]);
    assert.is(routes["/nested/deeper/named"].file, "named.html");
    assert.is(routes["/nested/deeper/named"].path, "fixtures/nested/deeper");
  });

  test("should register all files onto route", async (assert) => {
    const fileSystemRouter = await setup(
      {
        "index.scss": "body { background: pink; }",
        "index.css": "body { background: red; }",
        "index.client.js": "console.log('Hello, World');",
        "index.js": "exports default () => ({ title: 'Hello, World.'})",
        "index.njk": "{{ title }}",
        "index.html": "<h1>Hello, World.</h1>",
      },
      "fixtures/full"
    );
    const routes = await fileSystemRouter("fixtures/");

    assert.truthy(routes["/full"]);
    assert.is(Object.keys(routes).length, 1);
    assert.is(Object.keys(routes["/full"]).length, 7);
    assert.is(routes["/full"].path, "fixtures/full");
    assert.is(routes["/full"].file, "index.html");
    assert.is(routes["/full"].controller, "index.js");
    assert.is(routes["/full"].template, "index.njk");
    assert.is(routes["/full"].javascript, "index.client.js");
    assert.is(routes["/full"].css, "index.css");
    assert.is(routes["/full"].scss, "index.scss");
  });
}

suite();
