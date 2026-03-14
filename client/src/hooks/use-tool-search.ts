import { useQuery } from "@tanstack/react-query";
import type { ToolData } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export function useToolSearch(query: string, limit: number = 10) {
  return useQuery<ToolData>({
    queryKey: ["/api/search", query, limit],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/search?q=${encodeURIComponent(query)}&limit=${limit}`);
      return res.json();
    },
    enabled: query.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}
