/** Static seed data, kept separate from the seed script (seed.ts) so each file stays focused. */

export const REGIONS = [
  { name: 'United States', code: 'US' },
  { name: 'United Kingdom', code: 'GB' },
  { name: 'Japan', code: 'JP' },
  { name: 'Kenya', code: 'KE' },
  { name: 'Australia', code: 'AU' },
] as const;

export const CITIES = [
  {
    regionCode: 'US',
    name: 'Portland',
    slug: 'portland-us',
    latitude: '45.51520',
    longitude: '-122.67840',
    timezone: 'America/Los_Angeles',
  },
  {
    regionCode: 'US',
    name: 'New York',
    slug: 'new-york-us',
    latitude: '40.71280',
    longitude: '-74.00600',
    timezone: 'America/New_York',
  },
  {
    regionCode: 'US',
    name: 'Chicago',
    slug: 'chicago-us',
    latitude: '41.87810',
    longitude: '-87.62980',
    timezone: 'America/Chicago',
  },
  {
    regionCode: 'US',
    name: 'Denver',
    slug: 'denver-us',
    latitude: '39.73920',
    longitude: '-104.99030',
    timezone: 'America/Denver',
  },
  {
    regionCode: 'US',
    name: 'Seattle',
    slug: 'seattle-us',
    latitude: '47.60620',
    longitude: '-122.33210',
    timezone: 'America/Los_Angeles',
  },
  {
    regionCode: 'GB',
    name: 'London',
    slug: 'london-gb',
    latitude: '51.50740',
    longitude: '-0.12780',
    timezone: 'Europe/London',
  },
  {
    regionCode: 'GB',
    name: 'Manchester',
    slug: 'manchester-gb',
    latitude: '53.48080',
    longitude: '-2.24260',
    timezone: 'Europe/London',
  },
  {
    regionCode: 'JP',
    name: 'Tokyo',
    slug: 'tokyo-jp',
    latitude: '35.67620',
    longitude: '139.65030',
    timezone: 'Asia/Tokyo',
  },
  {
    regionCode: 'JP',
    name: 'Osaka',
    slug: 'osaka-jp',
    latitude: '34.69370',
    longitude: '135.50230',
    timezone: 'Asia/Tokyo',
  },
  {
    regionCode: 'KE',
    name: 'Nairobi',
    slug: 'nairobi-ke',
    latitude: '-1.29210',
    longitude: '36.82190',
    timezone: 'Africa/Nairobi',
  },
  {
    regionCode: 'AU',
    name: 'Sydney',
    slug: 'sydney-au',
    latitude: '-33.86880',
    longitude: '151.20930',
    timezone: 'Australia/Sydney',
  },
  {
    regionCode: 'AU',
    name: 'Melbourne',
    slug: 'melbourne-au',
    latitude: '-37.81360',
    longitude: '144.96310',
    timezone: 'Australia/Melbourne',
  },
] as const;

export const PROVIDERS = [
  {
    key: 'open-meteo',
    name: 'Open-Meteo',
    attributionUrl: 'https://open-meteo.com/',
    license: 'CC BY 4.0',
  },
] as const;

export const MEASUREMENT_TYPES = [
  { key: 'temperature', displayName: 'Temperature' },
  { key: 'wind_speed', displayName: 'Wind speed' },
  { key: 'wind_direction', displayName: 'Wind direction' },
  { key: 'humidity', displayName: 'Relative humidity' },
  { key: 'pressure', displayName: 'Surface pressure' },
  { key: 'precipitation', displayName: 'Precipitation' },
  { key: 'precipitation_probability', displayName: 'Precipitation probability' },
] as const;

export const UNITS = [
  { key: 'celsius', measurementTypeKey: 'temperature', symbol: '°C', displayName: 'Celsius' },
  {
    key: 'km_h',
    measurementTypeKey: 'wind_speed',
    symbol: 'km/h',
    displayName: 'Kilometers per hour',
  },
  { key: 'degrees', measurementTypeKey: 'wind_direction', symbol: '°', displayName: 'Degrees' },
  { key: 'percent', measurementTypeKey: 'humidity', symbol: '%', displayName: 'Percent' },
  { key: 'hpa', measurementTypeKey: 'pressure', symbol: 'hPa', displayName: 'Hectopascal' },
  {
    key: 'millimeters',
    measurementTypeKey: 'precipitation',
    symbol: 'mm',
    displayName: 'Millimeters',
  },
  {
    key: 'probability_percent',
    measurementTypeKey: 'precipitation_probability',
    symbol: '%',
    displayName: 'Percent',
  },
] as const;

/** Which unit the `open-meteo` provider is requested in for each measurement type. */
export const PROVIDER_UNIT_ASSIGNMENTS = [
  { providerKey: 'open-meteo', measurementTypeKey: 'temperature', unitKey: 'celsius' },
  { providerKey: 'open-meteo', measurementTypeKey: 'wind_speed', unitKey: 'km_h' },
  { providerKey: 'open-meteo', measurementTypeKey: 'wind_direction', unitKey: 'degrees' },
  { providerKey: 'open-meteo', measurementTypeKey: 'humidity', unitKey: 'percent' },
  { providerKey: 'open-meteo', measurementTypeKey: 'pressure', unitKey: 'hpa' },
  { providerKey: 'open-meteo', measurementTypeKey: 'precipitation', unitKey: 'millimeters' },
  {
    providerKey: 'open-meteo',
    measurementTypeKey: 'precipitation_probability',
    unitKey: 'probability_percent',
  },
] as const;

/** WMO weather interpretation codes, as documented by Open-Meteo. */
export const WEATHER_CODES = [
  { code: 0, label: 'Clear sky', iconKey: 'clear' },
  { code: 1, label: 'Mainly clear', iconKey: 'mostly-clear' },
  { code: 2, label: 'Partly cloudy', iconKey: 'partly-cloudy' },
  { code: 3, label: 'Overcast', iconKey: 'overcast' },
  { code: 45, label: 'Fog', iconKey: 'fog' },
  { code: 48, label: 'Depositing rime fog', iconKey: 'fog' },
  { code: 51, label: 'Light drizzle', iconKey: 'drizzle' },
  { code: 53, label: 'Moderate drizzle', iconKey: 'drizzle' },
  { code: 55, label: 'Dense drizzle', iconKey: 'drizzle' },
  { code: 56, label: 'Light freezing drizzle', iconKey: 'freezing-drizzle' },
  { code: 57, label: 'Dense freezing drizzle', iconKey: 'freezing-drizzle' },
  { code: 61, label: 'Slight rain', iconKey: 'rain' },
  { code: 63, label: 'Moderate rain', iconKey: 'rain' },
  { code: 65, label: 'Heavy rain', iconKey: 'rain' },
  { code: 66, label: 'Light freezing rain', iconKey: 'freezing-rain' },
  { code: 67, label: 'Heavy freezing rain', iconKey: 'freezing-rain' },
  { code: 71, label: 'Slight snow fall', iconKey: 'snow' },
  { code: 73, label: 'Moderate snow fall', iconKey: 'snow' },
  { code: 75, label: 'Heavy snow fall', iconKey: 'snow' },
  { code: 77, label: 'Snow grains', iconKey: 'snow' },
  { code: 80, label: 'Slight rain showers', iconKey: 'rain-showers' },
  { code: 81, label: 'Moderate rain showers', iconKey: 'rain-showers' },
  { code: 82, label: 'Violent rain showers', iconKey: 'rain-showers' },
  { code: 85, label: 'Slight snow showers', iconKey: 'snow-showers' },
  { code: 86, label: 'Heavy snow showers', iconKey: 'snow-showers' },
  { code: 95, label: 'Thunderstorm', iconKey: 'thunderstorm' },
  { code: 96, label: 'Thunderstorm with slight hail', iconKey: 'thunderstorm-hail' },
  { code: 99, label: 'Thunderstorm with heavy hail', iconKey: 'thunderstorm-hail' },
] as const;
