import { ProcessLifecycle } from "@m4rc3l05/process-lifecycle";
import { gracefulShutdown } from "./utils/process.ts";
import { makeLogger } from "./logger.ts";
import { handler } from "./handler.ts";
import config from "./config.ts";

const pl = new ProcessLifecycle();

const log = makeLogger("server");

gracefulShutdown({ processLifecycle: pl, log });

pl.registerService({
  name: "server",
  boot: () => {
    const abortController = new AbortController();

    return {
      server: Deno.serve({
        port: config.server.port,
        hostname: config.server.hostname,
        onListen: ({ hostname, port }) => {
          log.info(`Serving on http://${hostname}:${port}`);
        },
      }, handler({ abortSignal: abortController.signal })),
      abortController,
    };
  },
  shutdown: ({ server, abortController }) => {
    abortController.abort();

    return server.shutdown();
  },
});

await pl.boot();

if (Deno.env.get("BUILD_DRY_RUN") === "true") {
  await pl.shutdown();
}
