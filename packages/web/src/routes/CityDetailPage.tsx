import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { StatusMessage, Tabs, Button, ToggleButton, announce } from '@weather-demo/ui';
import { useCityDetail } from '../hooks/useCityDetail';
import { useForecast } from '../hooks/useForecast';
import { useVisitorContext } from '../context/visitor-context';
import { CurrentConditions } from '../components/CurrentConditions';
import { ForecastTable } from '../components/ForecastTable';
import { copy } from '../copy';

/** spec status_messages: #city-detail-status (polite) / #city-detail-error (alert); FR-008: a
 * distinct "City not found" state, not the generic error+retry treatment. spec 006: the
 * "Home city" pin toggle, its 404 auto-clear, and stale-name reconciliation. */
export function CityDetailPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const [reloadKey, setReloadKey] = useState(0);
  const detail = useCityDetail(slug, reloadKey);
  const forecast = useForecast(slug, reloadKey);
  const { homeCity, setHomeCity, clearHomeCity, reconcileHomeCity } = useVisitorContext();

  useEffect(() => {
    document.title =
      detail.status === 'success' ? copy.cityDetailTitle(detail.data.name) : copy.tabTitle;
  }, [detail]);

  // Heal a stale cached display name once fresh data for this city arrives (spec 006 FR-010).
  // Silent — the visitor didn't act. reconcileHomeCity() no-ops internally when nothing changed.
  useEffect(() => {
    if (detail.status !== 'success') return;
    reconcileHomeCity({
      slug: detail.data.slug,
      name: detail.data.name,
      regionName: detail.data.region.name,
    });
  }, [detail, reconcileHomeCity]);

  const isNotFound = detail.status === 'error' && detail.error.status === 404;

  // The "City not found" branch below renders before either StatusMessage, so it needs its own
  // announcement — otherwise a screen reader user gets silence instead of the heading text. A
  // 404 for the *pinned* city's own slug also clears the pin (spec 006 FR-009) — a transient
  // failure (network error, 5xx) is not "gone" and must not touch a saved preference.
  useEffect(() => {
    if (!isNotFound) return;
    announce(copy.cityNotFoundHeading);
    if (homeCity?.slug === slug) {
      const label = `${homeCity.name}, ${homeCity.regionName}`;
      clearHomeCity();
      announce(copy.homeCityUnavailable(label));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- homeCity/clearHomeCity intentionally excluded: this must run once per 404, not re-fire as the pin itself changes as a result
  }, [isNotFound, slug]);

  if (isNotFound) {
    return (
      <div>
        <h1 className="mb-4 font-display text-2xl font-bold">{copy.cityNotFoundHeading}</h1>
        <p className="mb-4 text-[var(--color-muted-text)]">{copy.cityNotFoundBody}</p>
        <Link to="/" className="text-[var(--color-link)] underline-offset-2 hover:underline">
          Back to city list
        </Link>
      </div>
    );
  }

  const cityName = detail.status === 'success' ? detail.data.name : slug;
  const isLoading =
    detail.status === 'loading' ||
    forecast.hourly.status === 'loading' ||
    forecast.daily.status === 'loading';
  const hasError =
    detail.status === 'error' ||
    forecast.hourly.status === 'error' ||
    forecast.daily.status === 'error';

  return (
    <div>
      <h1 className="mb-4 font-display text-2xl font-bold">
        {detail.status === 'success' ? `${detail.data.name} forecast` : 'Forecast'}
      </h1>

      {detail.status === 'success' && (
        <ToggleButton
          label="Home city"
          qualifier={`${detail.data.name}, ${detail.data.region.name}`}
          isSelected={homeCity?.slug === detail.data.slug}
          onChange={(selected) => {
            const cityLabel = `${detail.data.name}, ${detail.data.region.name}`;
            if (selected) {
              const durable = setHomeCity({
                slug: detail.data.slug,
                name: detail.data.name,
                regionName: detail.data.region.name,
              });
              announce(copy.homeCitySet(cityLabel));
              if (!durable) announce(copy.preferencesNotPersisted);
            } else {
              clearHomeCity();
              announce(copy.homeCityCleared(cityLabel));
            }
          }}
          renderIcon={(selected) => (selected ? '★' : '☆')}
          className="mb-4"
        />
      )}

      <StatusMessage
        id="city-detail-status"
        politeness="status"
        message={isLoading ? copy.loading : ''}
        className="mb-4 text-sm text-[var(--color-muted-text)]"
      />
      <StatusMessage
        id="city-detail-error"
        politeness="alert"
        message={hasError ? copy.forecastError(cityName) : ''}
        className="mb-2 font-medium text-[var(--color-danger)]"
      />

      {hasError && (
        <Button onPress={() => setReloadKey((key) => key + 1)} className="mb-4">
          Retry loading forecast
        </Button>
      )}

      {detail.status === 'success' && (
        <>
          <CurrentConditions
            observation={detail.data.latestObservation}
            dataAsOf={detail.data.dataAsOf}
          />
          {forecast.hourly.status === 'success' && forecast.daily.status === 'success' && (
            <Tabs
              label="Forecast range"
              items={[
                {
                  id: 'hourly',
                  label: 'Hourly',
                  content: (
                    <ForecastTable
                      cityName={detail.data.name}
                      range="hourly"
                      hourlyRows={forecast.hourly.data}
                    />
                  ),
                },
                {
                  id: 'daily',
                  label: 'Daily',
                  content: (
                    <ForecastTable
                      cityName={detail.data.name}
                      range="daily"
                      dailyRows={forecast.daily.data}
                    />
                  ),
                },
              ]}
            />
          )}
        </>
      )}
    </div>
  );
}
