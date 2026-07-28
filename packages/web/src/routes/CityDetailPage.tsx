import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { StatusMessage, Tabs, Button } from '@weather-demo/ui';
import { useCityDetail } from '../hooks/useCityDetail';
import { useForecast } from '../hooks/useForecast';
import { CurrentConditions } from '../components/CurrentConditions';
import { ForecastTable } from '../components/ForecastTable';
import { copy } from '../copy';

/** spec status_messages: #city-detail-status (polite) / #city-detail-error (alert); FR-008: a
 * distinct "City not found" state, not the generic error+retry treatment. */
export function CityDetailPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const [reloadKey, setReloadKey] = useState(0);
  const detail = useCityDetail(slug, reloadKey);
  const forecast = useForecast(slug, reloadKey);

  useEffect(() => {
    document.title =
      detail.status === 'success' ? copy.cityDetailTitle(detail.data.name) : copy.tabTitle;
  }, [detail]);

  if (detail.status === 'error' && detail.error.status === 404) {
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
