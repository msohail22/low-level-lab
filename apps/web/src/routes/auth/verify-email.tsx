import { createFileRoute } from "@tanstack/react-router";
import VerifyEmail from "../../pages/auth/VerifyEmail.tsx";

export const Route = createFileRoute("/auth/verify-email") ({
  component: VerifyEmail
});
