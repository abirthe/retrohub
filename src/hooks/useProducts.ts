import { useQuery } from '@tanstack/react-query';
import { fetchProducts } from '@/lib/shopApi';

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
  });
}
