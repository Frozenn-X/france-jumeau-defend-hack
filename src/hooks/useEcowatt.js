import { useQuery } from '@tanstack/react-query';

const API_URL = '/api';

export function useEcowatt() {
  return useQuery({
    queryKey: ['energy', 'ecowatt'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/energy/ecowatt`);
      if (!res.ok) throw new Error('Failed to fetch ecowatt data');
      const data = await res.json();
      return data.results || [];
    },
    refetchInterval: 30 * 60 * 1000,
  });
}
