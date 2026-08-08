import { createFileRoute } from "@tanstack/react-router";
import ForgotPassword from "../../pages/auth/ForgotPassword.tsx";

export const Route = createFileRoute("/auth/forgot-password") ({
  component: ForgotPassword
});
