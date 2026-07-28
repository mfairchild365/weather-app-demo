import { z } from 'zod';

// Shape of a response from Open-Meteo's `/v1/forecast` endpoint, requested with
// `timezone=UTC` (see open-meteo-client.ts) so every timestamp here is an unambiguous UTC
// instant — no timezone-conversion library needed at ingest time. Cities keep their own IANA
// timezone (packages/db schema) purely for display formatting downstream.

const currentSchema = z.object({
  time: z.string(),
  temperature_2m: z.number(),
  relative_humidity_2m: z.number(),
  is_day: z.union([z.literal(0), z.literal(1)]),
  precipitation: z.number(),
  weather_code: z.number().int(),
  surface_pressure: z.number(),
  wind_speed_10m: z.number(),
  wind_direction_10m: z.number(),
});

const hourlySchema = z.object({
  time: z.array(z.string()),
  temperature_2m: z.array(z.number()),
  relative_humidity_2m: z.array(z.number()),
  precipitation: z.array(z.number()),
  precipitation_probability: z.array(z.number()),
  weather_code: z.array(z.number().int()),
  wind_speed_10m: z.array(z.number()),
  wind_direction_10m: z.array(z.number()),
  is_day: z.array(z.union([z.literal(0), z.literal(1)])),
});

const dailySchema = z.object({
  time: z.array(z.string()),
  weather_code: z.array(z.number().int()),
  temperature_2m_max: z.array(z.number()),
  temperature_2m_min: z.array(z.number()),
  precipitation_sum: z.array(z.number()),
  precipitation_probability_max: z.array(z.number()),
  wind_speed_10m_max: z.array(z.number()),
  sunrise: z.array(z.string()),
  sunset: z.array(z.string()),
});

export const openMeteoResponseSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  current: currentSchema,
  hourly: hourlySchema,
  daily: dailySchema,
});

export type OpenMeteoResponse = z.infer<typeof openMeteoResponseSchema>;
export type OpenMeteoCurrent = z.infer<typeof currentSchema>;
export type OpenMeteoHourly = z.infer<typeof hourlySchema>;
export type OpenMeteoDaily = z.infer<typeof dailySchema>;
