import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { stringReplace } from "string-replace-middleware";

const __dirname = dirname(fileURLToPath(import.meta.url));

function liveReload(app) {
  app.get("/__live-reload__", (request, response) => {
    response.set({
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    response.flushHeaders();
    // Send an initial event to establish a connection
    response.write(`data: hello\n\n`);
  });
  app.get("/__live-reload__/client.js", (request, response) => {
    response.sendFile(join(__dirname, "index.client.js"));
  });
  app.use(
    stringReplace({
      "</body>": `<script src="/__live-reload__/client.js"></script>\n</body>`,
    })
  );
}

export default liveReload;
