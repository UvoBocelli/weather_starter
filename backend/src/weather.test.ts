import { afterEach, describe, expect, it, vi } from 'vitest';
import { SingaporeWeatherClient } from './weather.js';

const twoHourForecast = {
  code: 0,
  data: {
    area_metadata: [
      { name: 'Bishan', label_location: { latitude: 1.35, longitude: 103.84 } },
      { name: 'Jurong West', label_location: { latitude: 1.34, longitude: 103.7 } },
    ],
    items: [
      {
        update_timestamp: '2026-10-22T16:06:35+08:00',
        valid_period: { text: '4.00 pm to 6.00 pm' },
        forecasts: [
          { area: 'Bishan', forecast: 'Thundery Showers' },
          { area: 'Jurong West', forecast: 'Cloudy' },
        ],
      },
    ],
  },
};

// Two stations: S1 near Bishan, S2 near Jurong West.
function stationReading(near: number, far: number) {
  return {
    code: 0,
    data: {
      stations: [
        { id: 'S1', location: { latitude: 1.351, longitude: 103.841 } },
        { id: 'S2', location: { latitude: 1.341, longitude: 103.701 } },
      ],
      readings: [
        {
          timestamp: '2026-10-22T16:20:00+08:00',
          data: [
            { stationId: 'S1', value: near },
            { stationId: 'S2', value: far },
          ],
        },
      ],
    },
  };
}

function stubFetch(responses: Record<string, unknown>) {
  const fetchMock = vi.fn(async (url: string) => {
    const endpoint = Object.keys(responses).find((key) => url.endsWith(`/${key}`));
    const body = endpoint ? responses[endpoint] : undefined;
    if (body === undefined) return new Response('{}', { status: 500 });
    return new Response(JSON.stringify(body), { status: 200 });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('SingaporeWeatherClient.getCurrentWeather', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('combines the 2-hour condition with the nearest station readings', async () => {
    const fetchMock = stubFetch({
      'two-hr-forecast': twoHourForecast,
      'air-temperature': stationReading(31.4, 28),
      'relative-humidity': stationReading(66, 90),
      rainfall: stationReading(0.2, 5),
    });

    const snapshot = await new SingaporeWeatherClient().getCurrentWeather(1.35, 103.84);

    expect(snapshot).toMatchObject({
      condition: 'Thundery Showers',
      area: 'Bishan',
      valid_period_text: '4.00 pm to 6.00 pm',
      observed_at: '2026-10-22T16:06:35+08:00',
      temperature_c: 31.4,
      humidity_percent: 66,
      rainfall_mm: 0.2,
    });
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it('keeps the condition when a station reading fails', async () => {
    stubFetch({
      'two-hr-forecast': twoHourForecast,
      'air-temperature': stationReading(31.4, 28),
      // relative-humidity and rainfall are missing, so they return HTTP 500
    });

    const snapshot = await new SingaporeWeatherClient().getCurrentWeather(1.34, 103.7);

    expect(snapshot).toMatchObject({
      condition: 'Cloudy',
      area: 'Jurong West',
      temperature_c: 28,
      humidity_percent: null,
      rainfall_mm: null,
    });
  });

  it('keeps the readings when the 2-hour forecast fails', async () => {
    stubFetch({
      'air-temperature': stationReading(31.4, 28),
      'relative-humidity': stationReading(66, 90),
      rainfall: stationReading(0.2, 5),
    });

    const snapshot = await new SingaporeWeatherClient().getCurrentWeather(1.35, 103.84);

    expect(snapshot).toMatchObject({
      condition: 'Unavailable',
      area: null,
      temperature_c: 31.4,
      humidity_percent: 66,
      rainfall_mm: 0.2,
    });
  });
});
