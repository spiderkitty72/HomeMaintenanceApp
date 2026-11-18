# MaintenanceApp

## Warning
This project is 99% Vibe Coded. This is a personal project and the intent is not to make this useful for everyone and every application. The intent is a simple easy to use web based application that I can run on my server in docker to track maintenance on my home, vechicles and utility equipment.

## Overview
MaintenanceApp is a self-hosted, web-based maintenance tracker for assets like vehicles, equipment, and property. You log what you own, record service and fuel history against it, and let the app tell you when something's due.

## How it works

Everything in the app hangs off an **asset** — a vehicle, a piece of equipment, a building, whatever you want to maintain. Each asset tracks usage in one of three ways: mileage, hours, or just calendar dates. From there:

- **Service records** capture each maintenance event — what was done, who did it, cost, notes, and any attached receipts or photos.
- **Fuel records** log fill-ups so the app can calculate consumption and, combined with service history, estimate how fast an asset accumulates usage (its `dailyUsage` rate).
- **Schedules** define recurring maintenance (e.g. "oil change every 5,000 miles" or "inspect every 90 days"). Using the asset's usage rate, the app predicts a `nextDueDate` and emails you when a schedule is coming due within 7 days.
- **Parts inventory** lets you track a parts catalog and stock levels, and link parts to the assets they fit.
- **Permissions** are group-based: every user gets create + view access by default, and admins can grant edit/delete per resource type, or share individual assets read/write with specific people.

### Typical workflow

1. Add an asset and tell it how you want usage tracked (mileage, hours, or date-only).
2. Log fuel fills and service records as they happen — this is what feeds the usage-rate calculation.
3. Set up a maintenance schedule for anything recurring.
4. Let the app run its daily check and email you when something's due within a week.

## Installation

### Option A — Docker (recommended)

This is how the app is meant to run day-to-day; it builds an image, runs migrations, seeds the database, and persists data outside the container.

1. Clone the repo and `cd` into it.
2. Create the host directories used for persistence:
   ```bash
   mkdir -p data public/uploads
   ```
3. Edit `docker-compose.yml` and set real values for:
   ```yaml
   environment:
     - AUTH_SECRET=<generate with: npx auth secret>
     - AUTH_URL=https://your-domain.com   # your public URL, see reverse proxy section below
   ```
4. Build and start:
   ```bash
   npm run docker:up
   ```
   (equivalent to `docker-compose build && docker-compose up -d` — also bumps the package version)
5. The app listens on container port 3000, published to **host port 3030** by default. Visit `http://localhost:3030`.

**Data persistence** — the compose file bind-mounts two host directories into the container, so your data survives container rebuilds:
- `./data` → database (`dev.db`)
- `./public/uploads` → uploaded attachments

**Default login** (created by the seed step): `admin@example.com` / `maintenance`. Change this password immediately after first login.

### Option B — Manual / development install

1. Install Node.js 18+ and clone the repo.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file:
   ```env
   DATABASE_URL="file:./dev.db"
   AUTH_SECRET="your-secret-here"   # generate with: npx auth secret
   AUTH_TRUST_HOST=true
   ```
4. Push the schema and seed the database:
   ```bash
   npx prisma db push
   npx prisma db seed
   ```
5. Run it:
   ```bash
   npm run dev
   ```
   Visit `http://localhost:3000`.

For production without Docker, use `npm run build` (Next.js webpack build) then `npm start`, and set `AUTH_URL` to your public address.

## Putting it behind a reverse proxy

The app needs three things to work correctly behind a proxy:

1. **`AUTH_TRUST_HOST=true`** — already set in `docker-compose.yml`; add it to your `.env` for a manual install. Without this, NextAuth rejects requests that arrive via a proxy.
2. **`AUTH_URL`** set to your actual public URL (e.g. `https://maintenance.example.com`), not `localhost`.
3. **Forwarded headers** — your proxy must pass `Host`, `X-Forwarded-For`, `X-Forwarded-Proto`, and `X-Forwarded-Host` through to the app so it knows the real client IP and whether the original request was HTTPS.

One more thing worth knowing: server actions (used for file/attachment uploads) are configured with a **10MB body size limit** (`next.config.ts`). If your proxy has its own request-size cap, raise it to match or uploads will fail before they reach the app.

### Nginx

```nginx
server {
    listen 443 ssl;
    server_name maintenance.example.com;

    client_max_body_size 10m;

    location / {
        proxy_pass http://localhost:3030;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
    }
}
```

### Caddy

```caddyfile
maintenance.example.com {
    reverse_proxy localhost:3030
    request_body {
        max_size 10MB
    }
}
```

Caddy sets `X-Forwarded-For`, `X-Forwarded-Proto`, and `Host` automatically — no extra header config needed.

### Traefik (docker labels)

```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.maintenance.rule=Host(`maintenance.example.com`)"
  - "traefik.http.routers.maintenance.entrypoints=websecure"
  - "traefik.http.routers.maintenance.tls.certresolver=letsencrypt"
  - "traefik.http.services.maintenance.loadbalancer.server.port=3000"
```

Traefik forwards the standard `X-Forwarded-*` headers by default.

## Notes

- SMTP settings for the maintenance-reminder emails are configured in-app (System Settings), not via environment variables.
- If you change the host port mapping in `docker-compose.yml` (the `3030:3000` line), update any proxy config that references port 3030 to match.
