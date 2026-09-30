import { useQuery } from '@tanstack/react-query';

const API_URL = '/api';

export function useNarrator(mode) {
  return useQuery({
    queryKey: ['narration', mode],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/narration?mode=${mode}`);
      if (!res.ok) throw new Error('Failed to fetch narration data');
      return await res.json();
    },
    refetchInterval: 5 * 60 * 1000,
  });
}
