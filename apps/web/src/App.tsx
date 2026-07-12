import { AppRouter } from "@/routes";
import { authClient } from "@/lib/auth";

export default function App() {
  const { isPending } = authClient.useSession();

  if (isPending) {
    return <div>Loading...</div>;
  }

  return <AppRouter />;
}
