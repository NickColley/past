import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { EventEmitter } from "node:events";
import { stringReplace } from "string-replace-middleware";

const __dirname = dirname(fileURLToPath(import.meta.url));
const events = new EventEmitter();

function liveReload(app, routes) {
  app.get("/__live-reload__", (request, response) => {
    response.set({
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    response.flushHeaders();
    // Send an initial event to establish a connection
    response.write(`data: hello\n\n`);
    events.on("css", (file) => {
      Object.keys(routes).forEach((routeName) => {
        const entry = routes[routeName];
        const filePath = join(entry.path, entry.css);
        if (filePath.endsWith(file)) {
          response.write(`event: css\n`);
          response.write(`data: ${join(routeName, entry.css)}\n\n`);
        }
      });
    });
  });
  app.get("/__live-reload__/client.js", (request, response) => {
    response.sendFile(join(__dirname, "index.client.js"));
  });
  app.use(
    stringReplace({
      "</body>": `<script src="/__live-reload__/client.js"></script>\n</body>`,
    })
  );
  return events;
}

export default liveReload;
