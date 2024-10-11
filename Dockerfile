FROM docker.io/denoland/deno:alpine-2.0.0

RUN mkdir /app
RUN chown -R deno:deno /app

USER deno

WORKDIR /app

COPY --chown=deno:deno . .
RUN mkdir /app/data

RUN deno install
