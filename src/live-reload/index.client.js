((window) => {
  const document = window.document;
  // Automatically injected into the page in development
  // to reload the page when files change.

  let eventSource;
  let connectedBefore = false;
  let reconnectionTime = 100;
  function connect() {
    if (!connectedBefore) {
      console.log("Live reload: Connecting...");
    }
    eventSource = new window.EventSource("/__live-reload__");

    eventSource.addEventListener("open", () => {
      if (connectedBefore) {
        console.log("Live reload: Re-connected.");
        // Reload the page as the server since the back up.
        // Reload like this to avoid 'resubmission' messages after POSTS.
        // eslint-disable-next-line no-self-assign
        window.location.href = window.location.href;
      } else {
        console.log("Live reload: Connected.");
        connectedBefore = true;
      }
    });
    eventSource.addEventListener("css", async (event) => {
      const file = event.data;
      const stylesheets = document.querySelectorAll(
        `link[rel="stylesheet"][href]`
      );
      Array.from(stylesheets)
        .filter((stylesheet) => {
          const url = new URL(stylesheet.href);
          return url.pathname === file;
        })
        .forEach((currentStylesheet) => {
          const newStylesheet = document.createElement("link");
          newStylesheet.rel = "stylesheet";
          newStylesheet.href = file + "?cache-bust=" + Date.now();
          document.head.appendChild(newStylesheet);

          // Wait for the new styles to load to avoid Flash of Unstyled Content.
          newStylesheet.addEventListener("load", () => {
            console.log(`Detected CSS change in "${file}", reloading...`);
            currentStylesheet.remove();
          });
        });
    });
    eventSource.addEventListener("error", () => {
      eventSource.close();
      console.log("Live reload: Error, trying to reconnect.");

      setTimeout(() => {
        console.log("Live reload: Re-connecting...");
        connect();
      }, reconnectionTime);
    });
  }
  window.addEventListener("beforeunload", function () {
    if (eventSource) {
      eventSource.close();
    }
  });

  connect();
  // eslint-disable-next-line no-undef
})(window);
