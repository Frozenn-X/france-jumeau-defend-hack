import { useQuery } from '@tanstack/react-query';

const API_URL = '/api';

export function useWeatherData() {
  const { data: current, isLoading: isLoadingCurrent } = useQuery({
    queryKey: ['weather', 'current'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/weather/current`);
      if (!res.ok) throw new Error('Failed to fetch current weather data');
      return await res.json();
    },
    refetchInterval: 15 * 60 * 1000,
  });

  const { data: history, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['weather', 'history'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/weather/history`);
      if (!res.ok) throw new Error('Failed to fetch weather history');
      return await res.json();
    },
    refetchInterval: 15 * 60 * 1000,
  });

  return {
    current: current || null,
    history: history || null,
    isLoading: isLoadingCurrent || isLoadingHistory,
  };
}
