FROM docker.io/denoland/deno:alpine-2.1.3

RUN mkdir /app
RUN chown -R deno:deno /app

USER deno

WORKDIR /app

COPY --chown=deno:deno . .

RUN deno install --entrypoint src/main.ts

RUN BUILD_DRY_RUN=true DATABASE_PATH=":memory:" timeout 2s deno task server || true

RUN mkdir /app/data
