import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useLogs(limit = 50, accountId?: number) {
  return useQuery({
    queryKey: [api.logs.list.path, accountId, limit],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (limit) params.append("limit", limit.toString());
      if (accountId) params.append("accountId", accountId.toString());
      
      const res = await fetch(`${api.logs.list.path}?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch logs");
      return api.logs.list.responses[200].parse(await res.json());
    },
    refetchInterval: 3000, // Real-time log streaming
  });
}
