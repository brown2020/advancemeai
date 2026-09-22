import type { Metadata } from "next";
import ForgotPasswordClient from "./ForgotPasswordClient";

export const metadata: Metadata = {
  title: "Forgot password | AdvanceMe AI",
  description: "Reset your AdvanceMe AI account password.",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordClient />;
}
