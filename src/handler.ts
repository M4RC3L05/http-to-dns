import { decodeBase64Url } from "@std/encoding";
import config from "./config.ts";
import { makeLogger } from "./logger.ts";

const log = makeLogger("handler");

const upstream = {
  hostname: config.upstream.hostname,
  port: config.upstream.port,
  transport: "udp",
} satisfies Deno.Addr;

const errResponse = new Response(null, { status: 400 });

const getBodySafe = async (request: Request) => {
  try {
    return new Uint8Array(await request.arrayBuffer());
  } catch {
    return null;
  }
};

export const handler = async (request: Request) => {
  const url = new URL(request.url);

  if (url.pathname !== "/dns-query") return errResponse.clone();

  const dns = request.method.toLowerCase() === "post"
    ? await getBodySafe(request)
    : url.searchParams.get("dns");

  if (!dns) return errResponse.clone();

  const query = typeof dns === "string" ? decodeBase64Url(dns) : dns;

  let server: Deno.DatagramConn | undefined;

  try {
    server = Deno.listenDatagram({
      transport: "udp",
      port: config.dnsListen.port,
      hostname: config.dnsListen.hostname,
      reuseAddress: true,
    });

    const [_, [response]] = await Promise.all([
      server.send(query, upstream),
      server.receive(),
    ]);

    return new Response(response, {
      headers: { "content-type": "application/dns-message" },
    });
  } catch (error) {
    log.error("Unable to proxy dns request", { error });

    return errResponse.clone();
  } finally {
    server?.close();
  }
};
