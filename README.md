# Mokka Companion

A one-purpose web app: **turn the car's preconditioning on or off**, reliably.
The official Vauxhall/Stellantis app is flaky, so this gives a single screen
with two buttons behind a password.

The app itself never talks to Stellantis. It sends one call to
[psa_car_controller][psacc] (psacc), an open-source tool you run yourself, which
does the Stellantis login, the OTP step and the MQTT remote command. This repo
is only the UI plus a small authenticated backend that forwards one request to
your psacc instance.

## How it fits together

```
Phone (HTTPS + app password)
  │
  ▼
Mokka Companion            ← this repo: React UI + Vercel functions in api/
  │  Authorization: Bearer PSACC_TOKEN
  ▼
Reverse proxy (adds auth)  ← Caddy/nginx you run; the only thing in front of psacc
  │
  ▼
psa_car_controller (psacc) ← you run it; holds the Stellantis credentials + OTP
  │  MQTT
  ▼
Car
```

Two secrets never leave the server: your Stellantis credentials live only inside
psacc, and `PSACC_TOKEN` is held only by the Vercel backend. The browser only
ever sees the app password. psacc has no auth of its own, so **it must never be
exposed to the internet directly** — always put the reverse proxy in front.

## What's in the repo

- `src/` — the React app. One screen: `LoginPage` (password) or `PrecondControl`
  (two buttons). State and data via TanStack Query (`src/features/*`).
- `api/` — Vercel serverless functions:
  - `api/auth/[action].ts` → `login`, `logout`, `me` (signed-cookie session).
  - `api/car/[action].ts` → `precondition` (forwards to psacc).
  - `api/_lib/psacc.ts` — the only code that calls psacc.
- No database. The session is a stateless HMAC-signed cookie.

## Your side: run psacc

You need psacc running somewhere always-on (a cheap VPS, or a box at home).
It is a Python app; the easiest way is the official Docker image — no Python
knowledge needed.

1. **Make a config dir and run the container:**

   ```bash
   mkdir -p ~/psacc/config
   docker run -d --name psacc --restart unless-stopped \
     -p 127.0.0.1:5000:5000 \
     -v ~/psacc/config:/config \
     flobz/psa_car_controller
   ```

   Binding to `127.0.0.1` keeps psacc off the public internet; the reverse proxy
   below is what exposes it, with auth.

2. **First-run login:** open `http://<that-host>:5000` (over an SSH tunnel if
   it's a VPS: `ssh -L 5000:127.0.0.1:5000 user@host`) and follow psacc's setup
   to log in with your Stellantis/Vauxhall account and complete the OTP. psacc
   stores the resulting token in `~/psacc/config`.

3. **Check it works:** `curl http://127.0.0.1:5000/get_vehicles` should list your
   car and its VIN.

See the [psacc docs][psacc] for details and updates. To fork it (optional, e.g.
to pin a version): fork on GitHub, then run your fork's image or build it — this
app doesn't depend on any fork, it just needs a reachable psacc HTTP API.

## Your side: put a reverse proxy in front of psacc

psacc has no authentication, so expose it only through a proxy that requires
`PSACC_TOKEN`. Minimal [Caddy][caddy] example (`Caddyfile`):

```
psacc.example.com {
    @noauth not header Authorization "Bearer YOUR_LONG_RANDOM_TOKEN"
    respond @noauth 401
    reverse_proxy 127.0.0.1:5000
}
```

Caddy gets you HTTPS automatically. Use the same long random value for
`YOUR_LONG_RANDOM_TOKEN` and the `PSACC_TOKEN` env var below.

## Your side: deploy the app to Vercel

1. Push this repo to GitHub and import it in Vercel (framework preset: Vite).
2. Set the environment variables (Project → Settings → Environment Variables):

   | Variable         | Value                                                      |
   | ---------------- | ---------------------------------------------------------- |
   | `APP_ORIGIN`     | your Vercel URL, e.g. `https://mokka.vercel.app`           |
   | `APP_PASSWORD`   | a long random password — this is what you type to log in   |
   | `SESSION_SECRET` | random 16+ chars (`openssl rand -base64 32`)               |
   | `PSACC_URL`      | your proxy URL, e.g. `https://psacc.example.com`           |
   | `PSACC_TOKEN`    | the same token the proxy requires                          |
   | `VEHICLE_VIN`    | optional; pin one car. If unset, psacc's first car is used |

3. Deploy. Open the URL, enter `APP_PASSWORD`, and use the two buttons.

For local development, copy `.env.example` to `.env`, fill it in, and run
`pnpm start` (Vercel dev) — see the scripts in `package.json`.

## Develop

```bash
pnpm install
pnpm start        # local dev
pnpm run typecheck
pnpm run lint
pnpm run test
pnpm run build
```

Preconditioning is fire-and-forget: psacc publishes the MQTT command and returns
at once, so a success means "request sent", not "the car confirmed". It can take
a moment to reach the car.

[psacc]: https://github.com/flobz/psa_car_controller
[caddy]: https://caddyserver.com/
