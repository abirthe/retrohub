import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchStoreProducts } from '@/lib/shopApi';

interface FilterOptions {
  search?: string;
  activeCategory?: string;
  activeSubcategory?: string;
  sort?: string;
}

export function useProducts(filters: FilterOptions = {}) {
  return useInfiniteQuery({
    queryKey: ['products', filters],
    queryFn: ({ pageParam = 0 }) => fetchStoreProducts({ ...filters, pageParam }),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
  });
}
