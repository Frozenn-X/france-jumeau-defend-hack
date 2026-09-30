import { useQuery } from '@tanstack/react-query';

const API_URL = '/api';

export function useEnergyData() {
  const { data: nationalData, isLoading: isLoadingNational } = useQuery({
    queryKey: ['energy', 'national'],
    queryFn: async () => {
      try {
        const res = await fetch(`${API_URL}/energy/national`);
        if (!res.ok) throw new Error('Failed to fetch national data');
        const data = await res.json();
        if (data && data.results && data.results.length > 0) {
          localStorage.setItem('fallback_national_data', JSON.stringify(data.results));
          return data.results;
        }
        throw new Error('Empty national data');
      } catch (e) {
        const cached = localStorage.getItem('fallback_national_data');
        if (cached) {
          return JSON.parse(cached);
        }
        throw e;
      }
    },
    refetchInterval: 5 * 60 * 1000,
  });

  const { data: forecastData, isLoading: isLoadingForecast } = useQuery({
    queryKey: ['energy', 'forecasts'],
    queryFn: async () => {
      try {
        const res = await fetch(`${API_URL}/energy/forecasts`);
        if (!res.ok) throw new Error('Failed to fetch forecasts');
        const data = await res.json();
        if (data && data.results && data.results.length > 0) {
          localStorage.setItem('fallback_forecast_data', JSON.stringify(data.results));
          return data.results;
        }
        return [];
      } catch (e) {
        const cached = localStorage.getItem('fallback_forecast_data');
        if (cached) {
          return JSON.parse(cached);
        }
        return [];
      }
    },
    refetchInterval: 15 * 60 * 1000,
  });

  const { data: regionalData, isLoading: isLoadingRegional } = useQuery({
    queryKey: ['energy', 'regional'],
    queryFn: async () => {
      try {
        const res = await fetch(`${API_URL}/energy/regional`);
        if (!res.ok) throw new Error('Failed to fetch regional data');
        const data = await res.json();
        if (data && Object.keys(data).length > 0) {
          localStorage.setItem('fallback_regional_data', JSON.stringify(data));
          return data;
        }
        throw new Error('Empty regional data');
      } catch (e) {
        const cached = localStorage.getItem('fallback_regional_data');
        if (cached) {
          return JSON.parse(cached);
        }
        throw e;
      }
    },
    refetchInterval: 5 * 60 * 1000,
  });

  const cachedNational = localStorage.getItem('fallback_national_data');
  const fallbackNational = cachedNational ? JSON.parse(cachedNational) : [];

  const cachedRegional = localStorage.getItem('fallback_regional_data');
  const fallbackRegional = cachedRegional ? JSON.parse(cachedRegional) : {};

  const cachedForecast = localStorage.getItem('fallback_forecast_data');
  const fallbackForecast = cachedForecast ? JSON.parse(cachedForecast) : [];

  return {
    national: nationalData || fallbackNational,
    regional: regionalData || fallbackRegional,
    forecasts: forecastData || fallbackForecast,
    isLoading: (isLoadingNational && fallbackNational.length === 0) || 
               (isLoadingRegional && Object.keys(fallbackRegional).length === 0),
  };
}
