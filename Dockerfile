FROM docker.io/denoland/deno:alpine-2.1.3

RUN mkdir /app
RUN chown -R deno:deno /app

USER deno

WORKDIR /app

COPY --chown=deno:deno deno.json deno.lock .
RUN deno install

COPY --chown=deno:deno . .
RUN mkdir /app/data
