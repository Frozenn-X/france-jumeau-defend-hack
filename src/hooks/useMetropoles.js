import { useQuery } from '@tanstack/react-query';

const API_URL = '/api';

export function useMetropoles() {
  return useQuery({
    queryKey: ['energy', 'metropoles'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/energy/metropoles`);
      if (!res.ok) throw new Error('Failed to fetch metropoles data');
      const data = await res.json();
      return data.results || [];
    },
    refetchInterval: 5 * 60 * 1000, // 5 min
  });
}
