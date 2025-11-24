import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { ConfiguratorState } from '@/types/design';

export interface SaveDesignData {
  userEmail: string;
  userFullName?: string;
  userPhone?: string;
  userPostalCode?: string;
  designData: ConfiguratorState;
  showerTypeId: number;
}

export interface UserDesign {
  id: string;
  userEmail: string;
  userFullName?: string;
  userPhone?: string;
  userPostalCode?: string;
  designData: ConfiguratorState;
  showerTypeId: number;
  createdAt: string;
  updatedAt: string;
}

export function useSaveDesign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SaveDesignData) => {
      const response = await apiClient.post('/user-designs', data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate queries to refresh the list if the user is viewing their designs
      queryClient.invalidateQueries({ queryKey: ['designs', variables.userEmail] });
    },
  });
}

export function useLoadDesigns(email: string) {
  return useQuery({
    queryKey: ['designs', email],
    queryFn: async () => {
      if (!email) return [];
      const response = await apiClient.get(`/user-designs?email=${encodeURIComponent(email)}`);
      return response.data.data as UserDesign[];
    },
    enabled: !!email && email.length > 3, // Only fetch if email is valid-ish
  });
}

export function useLoadDesignById(id: string) {
  return useQuery({
    queryKey: ['design', id],
    queryFn: async () => {
      const response = await apiClient.get(`/user-designs/${id}`);
      return response.data.data as UserDesign;
    },
    enabled: !!id,
  });
}
