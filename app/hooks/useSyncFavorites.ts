import { useEffect, useRef } from 'react';
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

    let cancelled = false;
    let syncChanges: ((nextIds: string[]) => Promise<void>) | null = null;
    let syncQueue = Promise.resolve();

    const initializeSync = async () => {
      try {
        // Do not put the Supabase SDK on the public homepage's critical path.
        const { getSupabaseBrowserClient } = await import('~/lib/supabase.client');
        const supabase = getSupabaseBrowserClient();
        const persistChanges = async (nextIds: string[]) => {
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
              // A favorite already saved from another tab is a successful
              // outcome. Avoid a no-op UPDATE here: on mobile browsers it can
              // otherwise turn into a 409 while the local state is correct.
              .upsert(addedRows, { onConflict: 'user_id,listing_id', ignoreDuplicates: true });
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

        syncChanges = persistChanges;
        const { data: dbFavorites, error } = await supabase
          .from('favorites')
          .select('listing_id')
          .eq('user_id', userId);
        if (error) throw error;

        const localIds = useAppStore.getState().favorites || [];
        const remoteIds = (dbFavorites || []).map((row: { listing_id: number | string }) => String(row.listing_id));
        const mergedIds = Array.from(new Set([...localIds, ...remoteIds]));

        // Start from the server state. Using the merged state as the baseline
        // would make anonymous favorites appear in the UI without ever being
        // inserted into the user's `favorites` rows.
        lastSyncedIdsRef.current = remoteIds;
        useAppStore.setState({ favorites: mergedIds });

        const enqueueSync = (nextIds: string[]) => {
          syncQueue = syncQueue
            .catch(() => undefined)
            .then(() => persistChanges(nextIds));
          return syncQueue;
        };

        await enqueueSync(mergedIds);
        if (cancelled) return;

        // Changes made while the first merge was in flight were intentionally
        // held back until the initial baseline was persisted. Reconcile once
        // before enabling live writes so no favorite is lost.
        readyRef.current = true;
        const latestIds = useAppStore.getState().favorites || [];
        if (latestIds.some((id) => !lastSyncedIdsRef.current.includes(id)) || lastSyncedIdsRef.current.some((id) => !latestIds.includes(id))) {
          await enqueueSync(latestIds);
        }
      } catch (error) {
        console.error('Failed to sync favorites:', error);
      }
    };

    const unsubscribe = useAppStore.subscribe(
      (state) => state.favorites,
      (nextIds) => {
        if (!readyRef.current || cancelled || !syncChanges) return;
        syncQueue = syncQueue
          .catch(() => undefined)
          .then(() => syncChanges?.(nextIds));
        void syncQueue.catch((error) => {
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
