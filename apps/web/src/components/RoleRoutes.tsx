import { Navigate, Outlet } from "react-router-dom";

import { useMe } from "@/hooks/useMe";

export function ReviewerRoute() {
  const { data, isPending, error } = useMe();

  if (isPending) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <p className="text-[color:var(--muted)]">Checking reviewer access…</p>
      </main>
    );
  }

  if (error || !data?.roles.reviewer) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

export function AdminRoute() {
  const { data, isPending, error } = useMe();

  if (isPending) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <p className="text-[color:var(--muted)]">Checking admin access…</p>
      </main>
    );
  }

  if (error || !data?.roles.admin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
