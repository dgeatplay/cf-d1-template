# Snow Weather App

A Cloudflare Worker that fetches hourly snow forecast data from OpenSnow API and stores it in a D1 database.

## Features

- **Hourly Forecast Data**: Fetches detailed hourly snow forecasts from OpenSnow API
- **Multiple Locations**: Tracks forecasts for Palisades Tahoe and Alpine Meadows
- **Scheduled Updates**: Cron job runs every hour to fetch the latest forecast data
- **D1 Database**: Stores forecast data with upsert (insert or update) behavior

## Database Schema

The `hourly_forecasts` table stores the following data from OpenSnow:

| Field | Description |
|-------|-------------|
| `location_id` | OpenSnow location identifier |
| `display_at` | Forecast timestamp (UTC) |
| `display_at_local_label` | Human-readable local time label (e.g., "10a") |
| `temp` | Temperature |
| `pop` | Probability of precipitation (0-1) |
| `precip_type` | Precipitation type code |
| `precip_accum` | Total precipitation accumulation |
| `precip_snow` | Snow accumulation |
| `precip_mix` | Mixed precipitation |
| `precip_rain` | Rain accumulation |
| `precip_swe` | Snow water equivalent |
| `snow_level` | Snow level elevation |
| `slr` | Snow-to-liquid ratio |

## Cron Job

The worker includes a scheduled handler that runs every hour (`0 * * * *`) to:

1. Fetch hourly forecast data from OpenSnow API for each configured location
2. Upsert the data into the `hourly_forecasts` D1 table
3. Log results and any errors

## Getting Started

### Setup Steps

1. Install the project dependencies:
   ```bash
   npm install
   ```

2. Create a [D1 database](https://developers.cloudflare.com/d1/get-started/) with the name "cf-d1-template-database":
   ```bash
   npx wrangler d1 create cf-d1-template-database
   ```
   ...and update the `database_id` field in `wrangler.json` with the new database ID.

3. Run the database migrations to initialize the tables:
   ```bash
   npx wrangler d1 migrations apply --remote cf-d1-template-database
   ```

4. Deploy the project:
   ```bash
   npx wrangler deploy
   ```

5. Check logs:
   ```bash
   npx wrangler tail
   ```
   
## Local Development

### Running the Worker Locally

```bash
npx wrangler dev
```

### Testing the Cron Job Locally

Start the dev server with scheduled handler support:

```bash
npx wrangler dev --test-scheduled
```

Then trigger the cron job manually:

```bash
curl "http://localhost:8787/__scheduled?cron=0+*+*+*+*"
```

### Applying Migrations Locally

```bash
npx wrangler d1 migrations apply --local cf-d1-template-database
```

## Configuring the Cron Schedule

The cron schedule is defined in `wrangler.json`:

```json
{
  "triggers": {
    "crons": ["0 * * * *"]
  }
}
```

The default schedule `0 * * * *` runs at the top of every hour. You can modify this to any valid cron expression.

## Adding More Locations

To track additional ski resorts, edit the `LOCATIONS` array in `src/opensnow.ts`:

```typescript
export const LOCATIONS = [
  { slug: "palisadestahoe", name: "Palisades Tahoe" },
  { slug: "alpine-meadows-ca-us", name: "Alpine Meadows" },
  // Add more locations here
] as const;
```

Find location slugs by visiting the resort page on [OpenSnow](https://opensnow.com) and copying the slug from the URL.
