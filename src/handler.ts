import { decodeBase64Url } from "@std/encoding";
import config from "./config.ts";
import { makeLogger } from "./logger.ts";

const log = makeLogger("handler");

const upstreamAddr = {
  hostname: config.upstream.hostname,
  port: config.upstream.port,
  transport: "udp",
} satisfies Deno.Addr;

log.info("Upstream addr", { upstreamAddr });

const errResponse = new Response(null, { status: 400 });
const serviceUnavalableErrResponse = new Response(null, { status: 503 });

const getBodySafe = async (request: Request) => {
  try {
    return new Uint8Array(await request.arrayBuffer());
  } catch {
    return null;
  }
};

const safeCloseUpstream = (upstream?: Deno.DatagramConn) => {
  try {
    upstream?.close();
  } catch (error) {
    log.error("Unable to close upstream connection", { error });
  }
};

export const handler =
  ({ abortSignal }: { abortSignal: AbortSignal }) =>
  async (
    request: Request,
  ) => {
    if (abortSignal.aborted) return serviceUnavalableErrResponse.clone();

    const url = new URL(request.url);

    if (url.pathname !== "/dns-query") return errResponse.clone();

    const dns = request.method.toLowerCase() === "post"
      ? await getBodySafe(request)
      : url.searchParams.get("dns");

    if (!dns) return errResponse.clone();

    const query = typeof dns === "string" ? decodeBase64Url(dns) : dns;

    let upstream: Deno.DatagramConn | undefined;

    const closeUpstreamOnAbort = () => safeCloseUpstream(upstream);

    abortSignal.addEventListener("abort", closeUpstreamOnAbort, { once: true });

    try {
      upstream = Deno.listenDatagram({
        transport: "udp",
        port: config.dnsListen.port,
        hostname: config.dnsListen.hostname,
        reuseAddress: true,
      });

      const [_, [response]] = await Promise.all([
        upstream.send(query, upstreamAddr),
        upstream.receive(),
      ]);

      return new Response(response, {
        headers: { "content-type": "application/dns-message" },
      });
    } catch (error) {
      log.error("Unable to proxy dns request", { error });

      return errResponse.clone();
    } finally {
      safeCloseUpstream(upstream);
      abortSignal.removeEventListener("abort", closeUpstreamOnAbort);
    }
  };
