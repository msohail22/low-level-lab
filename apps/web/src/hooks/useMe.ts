import { useQuery } from "@tanstack/react-query";
import type { MeResponse } from "@llb/shared";

import { apiFetch } from "@/lib/api";

export type { MeResponse };

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
