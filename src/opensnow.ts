// OpenSnow API types and fetch utilities

export interface ForecastHourly {
	display_at: string;
	display_at_local_label: string;
	temp: number;
	pop: number;
	precip_type: number;
	precip_accum: number;
	precip_snow: number;
	precip_mix: number;
	precip_rain: number;
	precip_swe: number;
	snow_level: number;
	slr: number;
}

export interface OpenSnowLocation {
	id: number;
	name: string;
	slug: string;
}

export interface OpenSnowApiResponse {
	location: OpenSnowLocation;
	forecast_hourly: ForecastHourly[];
}

// Locations of interest
export const LOCATIONS = [
	{ slug: "palisadestahoe", name: "Palisades Tahoe" },
	{ slug: "alpine-meadows-ca-us", name: "Alpine Meadows" },
] as const;

// API headers required for OpenSnow requests
const API_HEADERS: HeadersInit = {
	"Accept": "*/*",
	"Accept-Language": "en-US,en;q=0.5",
	"Alt-Used": "opensnow.com",
	"Connection": "keep-alive",
	"Cookie": "omr=OTEzNTk0LmEuMjk0MTMxMy4xdW82eHQ5LmdwczN4cA%3D%3D.cKmJrxtiHoWGApmc1M3k7vxdr8SneRxh6XaoJZAUZA4%3D; ab.storage.userId.6f3b6c64-f280-4e10-87f1-4d96dcedd37e=g%3A64ebcdc9-1848-4a2a-8b27-d5d637135fb4%7Ce%3Aundefined%7Cc%3A1738861089405%7Cl%3A1764792884144; ab.storage.deviceId.6f3b6c64-f280-4e10-87f1-4d96dcedd37e=g%3Afc9029fe-25ed-bcae-29d2-e180dd8f5f7d%7Ce%3Aundefined%7Cc%3A1738861089405%7Cl%3A1764792884144; ab.storage.sessionId.6f3b6c64-f280-4e10-87f1-4d96dcedd37e=g%3Ac2d5c856-272b-1aa5-8870-cb6809b8520c%7Ce%3A1764794758453%7Cc%3A1764792884143%7Cl%3A1764792958453; opensnow-cookienotice=true",
	"Priority": "u=4",
	"Referer": "https://opensnow.com/location/palisadestahoe/snow-summary",
	"Sec-Fetch-Dest": "empty",
	"Sec-Fetch-Mode": "cors",
	"Sec-Fetch-Site": "same-origin",
	"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:145.0) Gecko/20100101 Firefox/145.0",
};

export interface FetchResult {
	data: OpenSnowApiResponse | null;
	error?: string;
}

/**
 * Fetch hourly forecast data from OpenSnow API for a given location
 */
export async function fetchLocationForecast(locationSlug: string): Promise<FetchResult> {
	const url = `https://opensnow.com/mtn/location/${locationSlug}/forecast/snow-detail?v=1&api_key=60600760edf827a75df71f712b71e3f3&days=15&units=imperial&with_weather_stations=true`;

	console.log(`Fetching forecast for ${locationSlug}...`);

	try {
		const response = await fetch(url, {
			method: "GET",
			headers: API_HEADERS,
		});

		if (!response.ok) {
			console.error(`OpenSnow API error for ${locationSlug}:`, response.status, response.statusText);
			return { data: null, error: `OpenSnow API error: ${response.status}` };
		}

		const data = await response.json() as OpenSnowApiResponse;
		return { data };
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : "Unknown error";
		console.error(`Failed to fetch forecast for ${locationSlug}:`, errorMessage);
		return { data: null, error: errorMessage };
	}
}

