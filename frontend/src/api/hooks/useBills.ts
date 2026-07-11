import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { billService, BillCreate } from '../services/bills';

export const billKeys = {
  all: ['bills'] as const,
  lists: () => [...billKeys.all, 'list'] as const,
  list: (filters: string) => [...billKeys.lists(), { filters }] as const,
  details: () => [...billKeys.all, 'detail'] as const,
  detail: (id: string) => [...billKeys.details(), id] as const,
};

export function useBills() {
  return useQuery({
    queryKey: billKeys.lists(),
    queryFn: () => billService.getBills(),
  });
}

export function useBill(id: string) {
  return useQuery({
    queryKey: billKeys.detail(id),
    queryFn: () => billService.getBill(id),
    enabled: !!id,
  });
}

export function useCreateBill() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: BillCreate) => billService.createBill(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billKeys.lists() });
    },
  });
}

export function useUpdateBillStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: string; notes?: string }) => 
      billService.updateBillStatus(id, status, notes),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: billKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: billKeys.lists() });
    },
  });
}
