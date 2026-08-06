import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getListsInWorkspace, getList } from "@/repositories/shopping-lists.repository";
import { getItems } from "@/repositories/shopping-items.repository";
import { getUserRole } from "@/repositories/workspace-members.repository";
import { getCategoryMap } from "@/repositories/product-categories.repository";
import { getCategoryOrder } from "@/repositories/workspaces.repository";
import { ShoppingList as ShoppingListComponent } from "@/features/lists/components/shopping-list";
import { ListSelector } from "@/features/lists/components/list-selector";

export const dynamic = "force-dynamic";

export default async function ListPage({
  params,
}: {
  params: Promise<{ workspaceId: string; listId: string }>;
}) {
  const { workspaceId, listId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) notFound();

  const [lists, list, items, role, categoryMap, categoryOrder] = await Promise.all([
    getListsInWorkspace(workspaceId),
    getList(listId),
    getItems(listId),
    getUserRole(workspaceId, user.id),
    getCategoryMap(workspaceId),
    getCategoryOrder(workspaceId),
  ]);

  if (!list) notFound();

  const canEdit = role === "OWNER" || role === "EDITOR";

  return (
    <>
      <div className="mx-auto w-full max-w-lg px-4">
        <ListSelector
          lists={lists}
          activeId={listId}
          workspaceId={workspaceId}
          canCreate={canEdit}
        />
      </div>
      <ShoppingListComponent
        list={list}
        items={items}
        categoryMap={categoryMap}
        categoryOrder={categoryOrder}
        canEdit={canEdit}
      />
    </>
  );
}
