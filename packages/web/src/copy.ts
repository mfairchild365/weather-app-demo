/**
 * Centralized product voice (spec 004 FR-001): every user-facing string on this site lives here,
 * not scattered across components. The persona is deadpan forecaster — dry, understated, never
 * excited — but every line keeps its plain-language fact intact alongside the wry phrasing
 * (spec 004 FR-002); accessible names for controls are NOT sourced from this file — they stay
 * exactly as spec 003's `labels` table defined them.
 */
export const copy = {
  brand: 'Probably Weather',
  tabTitle: 'Probably Weather',
  cityDetailTitle: (cityName: string) => `${cityName} forecast — Probably Weather`,
  notFoundTitle: 'This page does not exist — Probably Weather',

  // Split around the embedded Open-Meteo link so App.tsx can render the anchor mid-sentence.
  footerPrefix: 'Data from ',
  footerSuffix: '. They do the hard part.',

  listHeading: 'Probably Weather',
  loading: 'Consulting the sky…',
  citiesError: "The sky is not returning our calls. Couldn't load cities.",
  forecastError: (cityName: string) =>
    `The sky is not returning our calls. Couldn't load forecast for ${cityName}.`,
  noMatches: (query: string) => `Nothing matched "${query}". Bold search. Zero results.`,
  cityCount: (n: number, query: string) => {
    const noun = n === 1 ? 'city' : 'cities';
    return query ? `${n} ${noun} matching "${query}"` : `${n} ${noun}`;
  },

  cityNotFoundHeading: 'City not found',
  cityNotFoundBody: 'This page does not exist. The weather here is unknown.',
  pageNotFoundHeading: 'Page not found',
  pageNotFoundBody: 'This page does not exist. The weather here is unknown.',

  noObservation: 'No current conditions yet.',

  // Easter eggs (spec 004 FR-010) — same #city-list-status region, no new surface.
  EASTER_EGGS: {
    xyzzy: 'Nothing here. You knew that.',
    atlantis: 'Submerged. Forecast unavailable.',
  } as Record<string, string>,
} as const;
