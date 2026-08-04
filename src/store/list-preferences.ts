import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ListPreferences {
  /** Hide checked-off items from the list. */
  hideChecked: boolean;
  /** Sort checked items to the bottom of the list. */
  sortCheckedBottom: boolean;
  toggleHideChecked: () => void;
  toggleSortCheckedBottom: () => void;
}

/**
 * UI-only preferences for the shopping list view. Persisted to localStorage so
 * the user's view settings survive navigations and reloads. Does not hold list
 * data — that lives on the server and is mutated via server actions.
 */
export const useListPreferences = create<ListPreferences>()(
  persist(
    (set) => ({
      hideChecked: false,
      sortCheckedBottom: true,
      toggleHideChecked: () => set((s) => ({ hideChecked: !s.hideChecked })),
      toggleSortCheckedBottom: () =>
        set((s) => ({ sortCheckedBottom: !s.sortCheckedBottom })),
    }),
    { name: "superlista:list-preferences" },
  ),
);
