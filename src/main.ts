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
    return Deno.serve({
      port: config.server.port,
      hostname: config.server.hostname,
      onListen: ({ hostname, port }) => {
        log.info(`Serving on http://${hostname}:${port}`);
      },
    }, handler);
  },
  shutdown: (server) => {
    return server.shutdown();
  },
});

await pl.boot();
