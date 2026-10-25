import type { Metadata } from "next";
import { AdminSignIn } from "../../../components/AdminSignIn";

export const metadata: Metadata = {
  title: "Atlas Admin Console sign in",
  description: "Restricted Atlas platform administration access.",
};

export default function AdminSignInPage() {
  return <AdminSignIn />;
}
