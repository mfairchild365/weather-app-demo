import { z } from 'zod';

export const errorSchema = z
  .object({
    error: z.string(),
    message: z.string(),
  })
  .describe('A machine-readable JSON error body.');

export const regionSchema = z.object({
  name: z.string(),
  code: z.string(),
});

export const citySchema = z.object({
  slug: z.string(),
  name: z.string(),
  region: regionSchema,
  timezone: z.string(),
  latitude: z.number(),
  longitude: z.number(),
});

export const observationSchema = z.object({
  observedAt: z.string().describe('ISO 8601 UTC instant'),
  temperature: z.number().describe('Degrees Celsius'),
  windSpeed: z.number().describe('km/h'),
  windDirection: z.number().nullable().describe('Degrees'),
  humidity: z.number().nullable().describe('Percent'),
  pressure: z.number().nullable().describe('hPa'),
  precipitation: z.number().nullable().describe('mm'),
  weatherCode: z.number().int(),
  weatherLabel: z.string().describe('Human-readable label, e.g. "Partly cloudy"'),
  weatherIconKey: z.string(),
  isDay: z.boolean(),
});

export const cityDetailSchema = citySchema.extend({
  latestObservation: observationSchema.nullable(),
  dataAsOf: z
    .string()
    .nullable()
    .describe('ISO 8601 UTC instant of the ingest run that produced latestObservation'),
});

export const forecastRangeSchema = z.enum(['hourly', 'daily']);

export const forecastHourlyRowSchema = z.object({
  validAt: z.string().describe('ISO 8601 UTC instant'),
  temperature: z.number(),
  windSpeed: z.number().nullable(),
  windDirection: z.number().nullable(),
  humidity: z.number().nullable(),
  precipitation: z.number().nullable(),
  precipitationProbability: z.number().nullable().describe('Percent'),
  weatherCode: z.number().int(),
  weatherLabel: z.string(),
  weatherIconKey: z.string(),
  isDay: z.boolean(),
});

export const forecastDailyRowSchema = z.object({
  validDate: z.string().describe('ISO 8601 date, YYYY-MM-DD'),
  temperatureMin: z.number(),
  temperatureMax: z.number(),
  windSpeedMax: z.number().nullable(),
  precipitationSum: z.number().nullable(),
  precipitationProbabilityMax: z.number().nullable().describe('Percent'),
  weatherCode: z.number().int(),
  weatherLabel: z.string(),
  weatherIconKey: z.string(),
  sunrise: z.string().nullable(),
  sunset: z.string().nullable(),
});

export const forecastResponseSchema = z.object({
  range: forecastRangeSchema,
  rows: z.union([z.array(forecastHourlyRowSchema), z.array(forecastDailyRowSchema)]),
});

export const freshnessSchema = z.object({
  provider: z.string(),
  lastSuccessfulRunAt: z
    .string()
    .nullable()
    .describe('ISO 8601 UTC instant, null if no run has succeeded yet'),
});

export const healthSchema = z.object({
  status: z.literal('ok'),
});
