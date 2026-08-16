import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";

export type MeResponse = {
  user: { id: string; email: string; name: string };
  roles: { reviewer: boolean; admin: boolean };
};

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const res = await apiFetch<MeResponse>("/api/me");
      if (res.status === 401) return null;
      if (res.error) throw new Error(res.error);
      return res.data!;
    },
    retry: false,
  });
}
