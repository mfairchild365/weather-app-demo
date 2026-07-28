export interface Region {
  name: string;
  code: string;
}

export interface City {
  slug: string;
  name: string;
  region: Region;
  timezone: string;
  latitude: number;
  longitude: number;
}

export interface Observation {
  observedAt: string;
  temperature: number;
  windSpeed: number;
  windDirection: number | null;
  humidity: number | null;
  pressure: number | null;
  precipitation: number | null;
  weatherCode: number;
  weatherLabel: string;
  weatherIconKey: string;
  isDay: boolean;
}

export interface CityDetail extends City {
  latestObservation: Observation | null;
  dataAsOf: string | null;
}

export interface ForecastHourlyRow {
  validAt: string;
  temperature: number;
  windSpeed: number | null;
  windDirection: number | null;
  humidity: number | null;
  precipitation: number | null;
  precipitationProbability: number | null;
  weatherCode: number;
  weatherLabel: string;
  weatherIconKey: string;
  isDay: boolean;
}

export interface ForecastDailyRow {
  validDate: string;
  temperatureMin: number;
  temperatureMax: number;
  windSpeedMax: number | null;
  precipitationSum: number | null;
  precipitationProbabilityMax: number | null;
  weatherCode: number;
  weatherLabel: string;
  weatherIconKey: string;
  sunrise: string | null;
  sunset: string | null;
}

export interface ForecastResponse<T> {
  range: 'hourly' | 'daily';
  rows: T[];
}

/** Thrown for both network failures and non-2xx responses; `status` is absent for the former. */
export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    if (status !== undefined) this.status = status;
  }
}

async function request<T>(path: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path);
  } catch (error) {
    throw new ApiError(`Network error requesting ${path}: ${(error as Error).message}`);
  }
  if (!response.ok) {
    throw new ApiError(`Request to ${path} failed with status ${response.status}`, response.status);
  }
  return (await response.json()) as T;
}

export function getCities(): Promise<City[]> {
  return request('/api/cities');
}

export function getCityDetail(slug: string): Promise<CityDetail> {
  return request(`/api/cities/${encodeURIComponent(slug)}`);
}

export function getForecastHourly(slug: string): Promise<ForecastResponse<ForecastHourlyRow>> {
  return request(`/api/cities/${encodeURIComponent(slug)}/forecast?range=hourly`);
}

export function getForecastDaily(slug: string): Promise<ForecastResponse<ForecastDailyRow>> {
  return request(`/api/cities/${encodeURIComponent(slug)}/forecast?range=daily`);
}
