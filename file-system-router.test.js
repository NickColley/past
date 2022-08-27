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
 e     {
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
}

suite();
