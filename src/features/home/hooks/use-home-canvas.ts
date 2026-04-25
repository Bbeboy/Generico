import { useQuery } from '@tanstack/react-query';

import type { HomeCanvas } from '@/domain/home';
import { fetchHomeCanvas } from '@/services/shopify/queries/home';
import { homeKeys } from '../query-keys';

export function useHomeCanvas() {
  return useQuery<HomeCanvas>({
    queryKey: homeKeys.canvas(),
    queryFn: fetchHomeCanvas,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
