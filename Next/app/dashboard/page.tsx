import { Workspace } from "@/components/workspace";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Workspace" };
export default function Dashboard() {
  return <Workspace />;
}
