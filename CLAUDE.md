# Mokka Companion — project notes for Claude

Global instructions in `~/.claude/CLAUDE.md` apply. This file adds project
specifics and wins where they differ.

## What this app is

A single-purpose app to turn the car's **preconditioning** on or off. One screen,
behind one shared password. It never talks to Stellantis directly — it forwards
one call to a user-run [psa_car_controller][psacc] (psacc) instance, which owns
the Stellantis login, the OTP step and the MQTT command. See `README.md` for the
full architecture and setup.

## Hard constraints

- **No OTP / credential-generation code in this repo, ever** — not ported, not
  reworded, not copied from psacc (which is GPL-3). The OTP lives only inside the
  separately-run psacc. This app is an HTTP client to psacc and nothing more.
- **psacc is never exposed to the internet raw.** The only internet-facing piece
  is the authenticated Vercel backend, which reaches psacc through a reverse
  proxy that requires `PSACC_TOKEN`.
- **No secrets in the browser.** Stellantis credentials stay in psacc;
  `PSACC_TOKEN` and `SESSION_SECRET` stay server-side. The browser only sees the
  app password, sent once to `/api/auth/login`.
- **Never log request bodies, headers, cookies, credentials, tokens, or another
  service's raw reply.** Error replies use safe generic messages (see
  `api/_lib/appError.ts`); `carUnavailable()` never surfaces the cause.

## Shape

- `src/` — React 18 + TS (strict) + Tailwind 3 + TanStack Query 5. Features in
  `src/features/<feature>/`. Shared types in `src/types/`. API wrapper in
  `src/lib/apiClient.ts`. zod schemas shared with the server in
  `src/lib/apiSchemas.ts`.
- `api/` — Vercel functions. Endpoints are grouped behind dynamic routers
  (`api/<group>/[action].ts` + `createRouter`), with the real handlers in
  `api/_handlers/<group>/`. Shared server code in `api/_lib/`.
- `api/_lib/psacc.ts` is the single boundary to psacc. All car commands go
  through it.
- No database. Session = stateless HMAC-signed cookie (`api/_lib/session.ts`).
  Rate limiting is best-effort in-memory (`api/_lib/rateLimit.ts`).

## Before finishing

Run every check (the global file requires these):

```bash
pnpm run typecheck   # tsc -p . && tsc -p api
pnpm run lint
pnpm run test
pnpm run build
```

Format and lint only the files you changed:
`npx prettier --write <files> && npx eslint <files>`.

## Env vars

`APP_ORIGIN`, `APP_PASSWORD`, `SESSION_SECRET`, `PSACC_URL`, `PSACC_TOKEN`,
optional `VEHICLE_VIN`. See `.env.example` and the table in `README.md`.

[psacc]: https://github.com/flobz/psa_car_controller
