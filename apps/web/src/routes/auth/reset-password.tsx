import { createFileRoute } from "@tanstack/react-router";
import ResetPassword from "../../pages/auth/ResetPassword.tsx";

export const Route = createFileRoute("/auth/reset-password") ({
  component: ResetPassword
});
