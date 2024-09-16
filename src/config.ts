const valueElse = <T>(
  value: unknown,
  fn: (value: unknown) => T | undefined | null,
  fallback: T,
) => fn(value) ?? fallback;

export default {
  dnsListen: {
    hostname: valueElse(
      Deno.env.get("DNS_LISTEN_HOSTNAME"),
      (x) => typeof x === "string" ? x : undefined,
      "0.0.0.0",
    ),
    port: valueElse(
      Deno.env.get("DNS_LISTEN_PORT"),
      (x) => Number.isInteger(Number(x)) ? Number(x) : undefined,
      0,
    ),
  },
  server: {
    hostname: valueElse(
      Deno.env.get("SERVER_HOSTNAME"),
      (x) => typeof x === "string" ? x : undefined,
      "0.0.0.0",
    ),
    port: valueElse(
      Deno.env.get("SERVER_PORT"),
      (x) => Number.isInteger(Number(x)) ? Number(x) : undefined,
      8053,
    ),
  },
  upstream: {
    hostname: Deno.env.get("UPSTREAM_HOSTNAME")!,
    port: valueElse(
      Deno.env.get("UPSTREAM_PORT"),
      (x) => Number.isInteger(Number(x)) ? Number(x) : undefined,
      53,
    ),
  },
} as const;
