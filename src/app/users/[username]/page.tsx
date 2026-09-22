import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Users · username | AdvanceMe AI",
  description: "AdvanceMe AI — Users · username",
};

import UserProfileClient from "./UserProfileClient";

export default function Page() {
  return <UserProfileClient />;
}
