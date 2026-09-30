import { useQuery } from '@tanstack/react-query';

const API_URL = '/api';

export function useCarbonData() {
  return useQuery({
    queryKey: ['energy', 'carbon'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/energy/carbon`);
      if (!res.ok) throw new Error('Failed to fetch carbon data');
      const data = await res.json();
      return data.results?.[0] || null;
    },
    refetchInterval: 5 * 60 * 1000,
  });
}
