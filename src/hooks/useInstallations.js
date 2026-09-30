import { useQuery } from '@tanstack/react-query';

const API_URL = '/api';

export function useInstallations() {
  return useQuery({
    queryKey: ['energy', 'installations'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/energy/installations`);
      if (!res.ok) throw new Error('Failed to fetch installations registry');
      const data = await res.json();
      return data.results || [];
    },
    staleTime: 24 * 60 * 60 * 1000, // Cache for 24h
    refetchOnWindowFocus: false,
  });
}
