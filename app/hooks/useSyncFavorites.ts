import { useEffect, useRef } from 'react';
import { getSupabaseBrowserClient } from '~/lib/supabase.client';
import { useAppStore } from '~/stores/useAppStore';

/**
 * Keeps anonymous favorites in the persisted Zustand store and synchronizes
 * them with Supabase as soon as a user session becomes available.
 */
export function useSyncFavorites(userId: string | null | undefined) {
  const readyRef = useRef(false);
  const lastSyncedIdsRef = useRef<string[]>([]);

  useEffect(() => {
    readyRef.current = false;
    lastSyncedIdsRef.current = [];

    if (!userId) return;

    const supabase = getSupabaseBrowserClient();
    let cancelled = false;

    const syncChanges = async (nextIds: string[]) => {
      const previousIds = lastSyncedIdsRef.current;
      const addedIds = nextIds.filter((id) => !previousIds.includes(id));
      const removedIds = previousIds.filter((id) => !nextIds.includes(id));
      const addedRows = addedIds
        .map((id) => ({ user_id: userId, listing_id: Number(id) }))
        .filter((row) => Number.isInteger(row.listing_id));
      const removedListingIds = removedIds
        .map((id) => Number(id))
        .filter((id) => Number.isInteger(id));

      if (addedRows.length) {
        const { error } = await supabase
          .from('favorites')
          .upsert(addedRows, { onConflict: 'user_id,listing_id' });
        if (error) throw error;
      }

      if (removedListingIds.length) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', userId)
          .in('listing_id', removedListingIds);
        if (error) throw error;
      }

      lastSyncedIdsRef.current = nextIds;
    };

    const initializeSync = async () => {
      try {
        const { data: dbFavorites, error } = await supabase
          .from('favorites')
          .select('listing_id')
          .eq('user_id', userId);
        if (error) throw error;

        const localIds = useAppStore.getState().favorites || [];
        const remoteIds = (dbFavorites || []).map((row: { listing_id: number | string }) => String(row.listing_id));
        const mergedIds = Array.from(new Set([...localIds, ...remoteIds]));

        // Mark the merged state as the baseline before updating Zustand, so the
        // subscription below does not race the initial hydration.
        lastSyncedIdsRef.current = mergedIds;
        useAppStore.setState({ favorites: mergedIds });
        readyRef.current = true;
        await syncChanges(mergedIds);
      } catch (error) {
        console.error('Failed to sync favorites:', error);
      }
    };

    const unsubscribe = useAppStore.subscribe(
      (state) => state.favorites,
      (nextIds) => {
        if (!readyRef.current || cancelled) return;
        void syncChanges(nextIds).catch((error) => {
          console.error('Failed to persist favorite change:', error);
        });
      },
    );

    void initializeSync();

    return () => {
      cancelled = true;
      readyRef.current = false;
      unsubscribe();
    };
  }, [userId]);
}
