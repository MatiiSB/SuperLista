import { redirect } from "next/navigation";
import { getOrCreateDefaultList } from "@/repositories/shopping-lists.repository";

export const dynamic = "force-dynamic";

/** Workspace page — redirect to the default list (or create one). */
export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const list = await getOrCreateDefaultList(workspaceId);
  redirect(`/w/${workspaceId}/l/${list.id}`);
}
