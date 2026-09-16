# Solaric Monitoring Dashboard — Backend

Backend API for the **Solaric** solar-monitoring dashboard. It ingests live inverter and smart-meter telemetry from the **Solarman** cloud, stores it in a **PostgreSQL** database via **Prisma**, and serves it to the dashboard frontend through role-protected endpoints with **Firebase** authentication.

Frontend repo: [mobin-zaman/solaric-monitoring-dashboard-frontend](https://github.com/mobin-zaman/solaric-monitoring-dashboard-frontend)

## Features

- **Inverter & meter polling** — periodically pulls daily energy/instant power data from the Solarman API.
- **Historical data** — per-day and per-month energy readings, peak-power and sun-hours derived metrics, with in-memory/Redis caching to keep the API fast.
- **Role-based access** — Firebase ID-token auth plus `nest-access-control` roles for admin / user levels.
- **Excel export** — generates `.xlsx` exports of monitoring data.
- **Company / building / project / inverter / meter model** — tracks solar assets across multiple sites.

## Tech Stack

- [NestJS](https://nestjs.com/) + TypeScript
- [Prisma](https://www.prisma.io/) ORM → PostgreSQL (prisma schema: `prisma/schema.prisma`)
- [Firebase Admin](https://firebase.google.com/docs/admin/setup) SDK auth
- [Solarman](https://www.solarmanpv.com/) cloud API (inverter/meter telemetry)
- [Bull](https://github.com/OptimalBits/bull) + [cache-manager](https://github.com/node-cache-manager/node-cache-manager) (Redis-backed caching/queues)
- [nestjs-access-control](https://github.com/nestjsx/nest-access-control)

## Project Structure

```
src/
  auth/            Firebase + role guards
  building/        Buildings
  company/         Companies
  dashboard/       Dashboard aggregation endpoints
  excel/           Excel export generation
  export/          Export orchestration
  firebase/        Firebase auth service
  inverter/        Inverter telemetry + daily data
  meter/           Smart-meter energy data
  project/         Projects (Solaric sites)
  solarman/        Solarman cloud API client
  user/            Users and roles
  main.ts          Bootstrap
prisma/
  schema.prisma    Data model (PostgreSQL)
```

## Getting Started

### Prerequisites

- Node.js + pnpm
- PostgreSQL (for the Prisma data model)
- Solarman cloud API credentials
- A Firebase project with an Admin SDK service account

### Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Create your config from the template
cp .env.example .env
#    ...and fill in every value with your own credentials

# 3. Put your Firebase service-account JSON somewhere outside the repo
#    and point FIREBASE_CREDENTIAL_PATH at its absolute path.

# 4. Apply the Prisma schema, then run the dev server
pnpm run build          # compiles + runs "prisma generate"
pnpm run start:dev
```

This project also supports **Doppler** for injecting secrets: `doppler run -- pnpm run start:dev`.

> ⚠️ **Never commit your real `.env` or any Firebase service-account JSON or Solarman credentials.** They are git-ignored. Rotate any credential that may have been exposed.

## Scripts

| Command           | Description                       |
| ----------------- | --------------------------------- |
| `pnpm run start`  | Start the API                     |
| `pnpm run start:dev` | Start in watch mode           |
| `pnpm run start:prod` | Run the compiled production build |
| `pnpm run build`  | Compile to `dist/` + `prisma generate` |
| `pnpm run lint`   | ESLint + Prettier fix             |
| `pnpm test`       | Unit tests (Jest)                 |
| `pnpm run test:e2e` | End-to-end tests              |

## Environment Variables

See [`.env.example`](.env.example) for the full list. Key ones:

| Variable                     | Purpose                                     |
| ---------------------------- | ------------------------------------------- |
| `DATABASE_URL`               | PostgreSQL connection string (Prisma)       |
| `SOLARMAN_ORG_ID`            | Solarman organization id                    |
| `SOLARMAN_APP_ID` / `SOLARMAN_APP_SECRET` | Solarman API application credentials |
| `SOLARMAN_EMAIL` / `SOLARMAN_PASSWORD_SHA256` | Solarman account login          |
| `FIREBASE_CREDENTIAL_PATH`   | Absolute path to the Firebase service-account JSON |

## License

UNLICENSED — private project.