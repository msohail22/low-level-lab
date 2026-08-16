import { Navigate, Outlet } from "react-router-dom";

import { authClient } from "@/lib/auth";

export function ProtectedRoute() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <div className="grid min-h-screen place-items-center text-[color:var(--muted)]">
        Checking session…
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
