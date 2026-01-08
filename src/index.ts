import { renderHtml } from "./renderHtml";
import { fetchLocationForecast, LOCATIONS, ForecastHourly } from "./opensnow";

/**
 * Upsert a single hourly forecast record into D1
 */
async function upsertHourlyForecast(
	db: D1Database,
	locationId: number,
	forecast: ForecastHourly
): Promise<void> {
	const sql = `
		INSERT INTO hourly_forecasts (
			location_id, display_at, display_at_local_label, temp, pop,
			precip_type, precip_accum, precip_snow, precip_mix, precip_rain,
			precip_swe, snow_level, slr, updated_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
		ON CONFLICT(location_id, display_at, display_at_local_label) DO UPDATE SET
			temp = excluded.temp,
			pop = excluded.pop,
			precip_type = excluded.precip_type,
			precip_accum = excluded.precip_accum,
			precip_snow = excluded.precip_snow,
			precip_mix = excluded.precip_mix,
			precip_rain = excluded.precip_rain,
			precip_swe = excluded.precip_swe,
			snow_level = excluded.snow_level,
			slr = excluded.slr,
			updated_at = CURRENT_TIMESTAMP
	`;

	await db
		.prepare(sql)
		.bind(
			locationId,
			forecast.display_at,
			forecast.display_at_local_label,
			forecast.temp,
			forecast.pop,
			forecast.precip_type,
			forecast.precip_accum,
			forecast.precip_snow,
			forecast.precip_mix,
			forecast.precip_rain,
			forecast.precip_swe,
			forecast.snow_level,
			forecast.slr
		)
		.run();
}

/**
 * Process all hourly forecasts for a location
 */
async function processLocationForecasts(
	db: D1Database,
	locationSlug: string
): Promise<{ success: boolean; recordCount: number; error?: string }> {
	const result = await fetchLocationForecast(locationSlug);

	if (!result.data) {
		return { success: false, recordCount: 0, error: result.error };
	}

	const { location, forecast_hourly } = result.data;

	if (!forecast_hourly || forecast_hourly.length === 0) {
		console.log(`No hourly forecast data for ${locationSlug}`);
		return { success: true, recordCount: 0 };
	}

	console.log(`Processing ${forecast_hourly.length} hourly records for ${location.name}`);

	// Batch upsert all forecasts
	const statements = forecast_hourly.map((forecast) =>
		db
			.prepare(
				`INSERT INTO hourly_forecasts (
					location_id, display_at, display_at_local_label, temp, pop,
					precip_type, precip_accum, precip_snow, precip_mix, precip_rain,
					precip_swe, snow_level, slr, updated_at
				) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
				ON CONFLICT(location_id, display_at, display_at_local_label) DO UPDATE SET
					temp = excluded.temp,
					pop = excluded.pop,
					precip_type = excluded.precip_type,
					precip_accum = excluded.precip_accum,
					precip_snow = excluded.precip_snow,
					precip_mix = excluded.precip_mix,
					precip_rain = excluded.precip_rain,
					precip_swe = excluded.precip_swe,
					snow_level = excluded.snow_level,
					slr = excluded.slr,
					updated_at = CURRENT_TIMESTAMP`
			)
			.bind(
				location.id,
				forecast.display_at,
				forecast.display_at_local_label,
				forecast.temp,
				forecast.pop,
				forecast.precip_type,
				forecast.precip_accum,
				forecast.precip_snow,
				forecast.precip_mix,
				forecast.precip_rain,
				forecast.precip_swe,
				forecast.snow_level,
				forecast.slr
			)
	);

	try {
		await db.batch(statements);
		console.log(`Upserted ${forecast_hourly.length} records for ${location.name}`);
		return { success: true, recordCount: forecast_hourly.length };
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : "Unknown error";
		console.error(`Database error for ${location.name}:`, errorMessage);
		return { success: false, recordCount: 0, error: errorMessage };
	}
}

export default {
	async fetch(request, env) {
		const stmt = env.DB.prepare("SELECT * FROM comments LIMIT 3");
		const { results } = await stmt.all();

		return new Response(renderHtml(JSON.stringify(results, null, 2)), {
			headers: {
				"content-type": "text/html",
			},
		});
	},

	async scheduled(event, env, ctx) {
		console.log("Starting scheduled OpenSnow forecast fetch...");
		console.log(`Cron pattern: ${event.cron}`);
		console.log(`Scheduled time: ${new Date(event.scheduledTime).toISOString()}`);

		const results: Array<{ location: string; success: boolean; recordCount: number; error?: string }> = [];

		// Fetch forecasts for all locations in parallel
		const fetchPromises = LOCATIONS.map(async (loc) => {
			const result = await processLocationForecasts(env.DB, loc.slug);
			return { location: loc.name, ...result };
		});

		const locationResults = await Promise.all(fetchPromises);
		results.push(...locationResults);

		const totalRecords = results.reduce((sum, r) => sum + r.recordCount, 0);
		const errors = results.filter((r) => !r.success);

		console.log(`Completed forecast update: ${totalRecords} total records`);
		if (errors.length > 0) {
			console.error("Errors:", errors);
		}
	},
} satisfies ExportedHandler<Env>;
